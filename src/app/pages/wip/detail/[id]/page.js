"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/component/common/Button";
import Toast from "@/component/common/Toast";
import Breadcrumb from "@/component/common/Breadcrumb";
import Loading from "@/component/common/Loading";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";
import SweetAlert from "@/component/common/SweetAlert";

export default function WipDetailPage() {
    const path = useParams();
    const router = useRouter();
    const modelId = decryptIdUrl(path.id);

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("WIP Detail");
    const [shiftInfo, setShiftInfo] = useState("");
    const [rows, setRows] = useState([]);
    const [shiftId, setShiftId] = useState(null);
    const [canInput, setCanInput] = useState(true);
    const [logs, setLogs] = useState([]);
    const [logDate, setLogDate] = useState("");
    const [missingSectionParts, setMissingSectionParts] = useState([]);

    const groupedRows = rows.reduce((acc, row) => {
        const key = `${row.partCode}||${row.partName}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(row);
        return acc;
    }, {});
    const hasPlanR = rows.some((row) => Number(row.planR ?? 0) > 0);
    const hasPlanL = rows.some((row) => Number(row.planL ?? 0) > 0);
    const visibleSides = [
        ...(hasPlanR ? [{ key: "R", field: "qtyR", planField: "planR", label: "Current R" }] : []),
        ...(hasPlanL ? [{ key: "L", field: "qtyL", planField: "planL", label: "Current L" }] : []),
    ];

    const formatDateTime = useCallback((value) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString("en-GB")}`;
    }, []);

    const loadDetail = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetchData(`wips/${modelId}/detail`, {}, "GET");
            if (response.error) throw new Error(response.message);

            const data = response.data || {};
            setTitle(`WIP Detail - ${data.ModelCode || "N/A"}`);
            setShiftInfo(`${data.ShiftCode || "-"} - ${data.ShiftName || "-"} (${data.ShiftStart || "-"} - ${data.ShiftEnd || "-"})`);
            setShiftId(data.ShiftId || null);
            setCanInput(data.CanInput !== false);
            setMissingSectionParts(Array.isArray(data.MissingSectionParts) ? data.MissingSectionParts : []);

            const mapped = (Array.isArray(data.Sections) ? data.Sections : []).map((item) => ({
                mpsdId: item.MpsdId,
                partCode: item.PartCode,
                partName: item.PartName,
                sectionCode: item.SectionCode,
                sectionName: item.SectionName,
                sequence: item.Sequence,
                planR: Number(item.PlanR ?? 0),
                planL: Number(item.PlanL ?? 0),
                qtyR: Number(item.PlanR ?? 0) === 0 ? 0 : (item.QtyR ?? 0),
                qtyL: Number(item.PlanL ?? 0) === 0 ? 0 : (item.QtyL ?? 0),
            }));

            setRows(mapped);
        } catch (err) {
            Toast.error(err.message || "Failed to load WIP detail");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [modelId, router]);

    const loadLogs = useCallback(async (dateFilter = "") => {
        try {
            const response = await fetchData(
                `wips/${modelId}/logs`,
                {
                    ...(dateFilter ? { Date: dateFilter } : {}),
                },
                "GET"
            );
            if (response.error) throw new Error(response.message);
            setLogs(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            Toast.error(err.message || "Failed to load logs");
            setLogs([]);
        }
    }, [modelId]);

    useEffect(() => {
        if (modelId) {
            loadDetail();
            loadLogs("");
        }
    }, [modelId, loadDetail, loadLogs]);

    const handleQtyChange = useCallback((index, field, value) => {
        setRows((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
    }, []);

    const handleSave = useCallback(async (e) => {
        e.preventDefault();
        if (!shiftId) {
            Toast.error("Shift is not available");
            return;
        }
        if (!canInput) {
            SweetAlert({
                title: "Input Locked",
                text: "Current stock can no longer be submitted because the shift time has passed.",
                icon: "warning",
            });
            return;
        }

        try {
            setLoading(true);

            const items = rows.map((row) => ({
                mpsdId: Number(row.mpsdId),
                qtyR: Number(row.planR ?? 0) === 0 ? 0 : Number(row.qtyR || 0),
                qtyL: Number(row.planL ?? 0) === 0 ? 0 : Number(row.qtyL || 0),
            }));

            const response = await fetchData(
                "wips/save-current",
                {
                    shiftId: Number(shiftId),
                    items,
                },
                "POST"
            );
            if (response.error) throw new Error(response.message);

            Toast.success(response.message || "Current stock updated successfully");
            await loadDetail();
            await loadLogs(logDate);
        } catch (err) {
            const message = err.message || "Failed to save current stock";
            if (message.includes("can no longer be submitted")) {
                SweetAlert({
                    title: "Input Locked",
                    text: message,
                    icon: "warning",
                });
                setCanInput(false);
            } else {
                Toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    }, [rows, shiftId, loadDetail, loadLogs, logDate, canInput]);

    const handleLogFilter = useCallback(async () => {
        await loadLogs(logDate);
    }, [loadLogs, logDate]);

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    return (
        <>
            <Loading loading={loading} message="Loading data..." />
            <Breadcrumb
                title={title}
                items={[
                    { label: "WIP Management", href: "/pages/wip" },
                    { label: "WIP Detail" },
                ]}
            />

            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-4">
                    <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 12, fontWeight: 500 }}>Current Shift</label>
                        <div className="form-control" style={{ fontSize: 13, height: 38 }}>{shiftInfo}</div>
                    </div>

                    <form onSubmit={handleSave}>
                        {missingSectionParts.length > 0 && (
                            <div className="alert alert-warning py-2 px-3" style={{ fontSize: 13 }}>
                                Some parts in this model still do not have section sequence for WIP:
                                {" "}
                                {missingSectionParts
                                    .map((item) => `${item.PartCode} - ${item.PartName}`)
                                    .join(", ")}
                            </div>
                        )}
                        <div className="table-responsive">
                            <table className="table table-sm table-bordered align-middle">
                                <thead>
                                    <tr>
                                        <th className="text-center">No</th>
                                        <th>Part</th>
                                        <th>Section</th>
                                        <th className="text-center">Seq</th>
                                        {visibleSides.map((side) => (
                                            <th key={side.key} className="text-center">{side.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={4 + visibleSides.length} className="text-center text-secondary">
                                                {missingSectionParts.length > 0
                                                    ? "No section data available because the model parts have not been assigned section sequence yet."
                                                    : "No section data available for this model."}
                                            </td>
                                        </tr>
                                    ) : (
                                        Object.values(groupedRows).flatMap((group, groupIndex) =>
                                            group.map((row, rowIndex) => {
                                                const absoluteIndex = rows.findIndex((item) => item.mpsdId === row.mpsdId);
                                                return (
                                                    <tr key={row.mpsdId}>
                                                        {rowIndex === 0 && (
                                                            <td className="text-center" rowSpan={group.length}>
                                                                {groupIndex + 1}
                                                            </td>
                                                        )}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={group.length}>
                                                                {row.partCode} - {row.partName}
                                                            </td>
                                                        )}
                                                        <td>{row.sectionCode} - {row.sectionName}</td>
                                                        <td className="text-center">{row.sequence}</td>
                                                        {visibleSides.map((side) => (
                                                            <td key={`${row.mpsdId}-${side.key}`}>
                                                                <input
                                                                    type="number"
                                                                    className="form-control form-control-sm"
                                                                    value={row[side.field]}
                                                                    onChange={(e) => handleQtyChange(absoluteIndex, side.field, e.target.value)}
                                                                    disabled={!canInput || Number(row[side.planField] ?? 0) === 0}
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button
                                classType="secondary"
                                label="Cancel"
                                onClick={handleCancel}
                                type="button"
                                isDisabled={loading}
                            />
                            <Button
                                classType="primary"
                                iconName={loading ? "" : "save"}
                                label={!canInput ? "Locked" : (loading ? "Saving..." : "Save")}
                                type="submit"
                                isDisabled={loading || rows.length === 0 || !canInput}
                            />
                        </div>
                        {!canInput && (
                            <div className="text-warning mt-2" style={{ fontSize: 12 }}>
                                Input is locked because the shift date/time has passed.
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <div className="d-flex gap-2 align-items-end mb-3">
                        <div>
                            <label htmlFor="logDate" className="form-label" style={{ fontSize: 12, fontWeight: 500 }}>
                                Log Date
                            </label>
                            <input
                                id="logDate"
                                type="date"
                                className="form-control"
                                value={logDate}
                                onChange={(e) => setLogDate(e.target.value)}
                                style={{ fontSize: 13, height: 38 }}
                            />
                        </div>
                        <Button
                            classType="secondary"
                            label="Filter"
                            type="button"
                            onClick={handleLogFilter}
                            isDisabled={loading}
                        />
                    </div>

                    <div className="table-responsive">
                        <table className="table table-sm table-bordered align-middle">
                            <thead>
                                <tr>
                                    <th className="text-center">No</th>
                                    <th>Part</th>
                                    <th>Section</th>
                                    <th className="text-center">Side</th>
                                    <th className="text-center">Qty</th>
                                    <th>Created By</th>
                                    <th>Created At</th>
                                    <th className="text-center">Shift</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center text-secondary">
                                            No logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log, index) => (
                                        <tr key={log.Id}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>{log.PartCode}</td>
                                            <td>{log.SectionCode} - {log.SectionName}</td>
                                            <td className="text-center">{log.Side}</td>
                                            <td className="text-center">{log.Qty}</td>
                                            <td>{log.CreatedBy || "-"}</td>
                                            <td>{formatDateTime(log.CreatedAt)}</td>
                                            <td className="text-center">{log.ShiftCode}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
