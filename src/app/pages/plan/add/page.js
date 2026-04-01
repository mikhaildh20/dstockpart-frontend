"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Input from "@/component/common/Input";
import Button from "@/component/common/Button";
import Toast from "@/component/common/Toast";
import SweetAlert from "@/component/common/SweetAlert";
import Breadcrumb from "@/component/common/Breadcrumb";
import Loading from "@/component/common/Loading";
import fetchData from "@/lib/fetch";

export default function AddPlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currentShift, setCurrentShift] = useState(null);
    const [errors, setErrors] = useState({});
    const [partPlans, setPartPlans] = useState([]);

    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);

            const [itemsRes, shiftRes] = await Promise.all([
                fetchData("plans/base-items", {}, "GET"),
                fetchData("plans/current-shift", {}, "GET"),
            ]);

            if (itemsRes.error) {
                throw new Error(itemsRes.message);
            }
            if (shiftRes.error) {
                throw new Error(shiftRes.message);
            }

            const mapped = (Array.isArray(itemsRes.data) ? itemsRes.data : []).map((item) => ({
                modelId: item.ModelId,
                modelCode: item.ModelCode,
                qtyR: "",
                qtyL: "",
            }));

            setPartPlans(mapped);
            setCurrentShift(shiftRes.data || null);
        } catch (err) {
            Toast.error(err.message || "Failed to load form data");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handlePlanQtyChange = useCallback((index, field, value) => {
        setPartPlans((prev) =>
            prev.map((item, idx) =>
                idx === index ? { ...item, [field]: value } : item
            )
        );
    }, []);

    const validateForm = useCallback(() => {
        const newErrors = {};

        const validRows = partPlans.filter(
            (item) => item.qtyR !== "" || item.qtyL !== ""
        );
        if (validRows.length === 0) {
            newErrors.partPlans = "Please fill at least one base planning row.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [partPlans]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            Toast.error("Please fill in at least one base planning row.");
            return;
        }

        if (!currentShift?.Id) {
            Toast.error("Current shift is not available.");
            return;
        }

        const items = partPlans
            .filter((item) => item.qtyR !== "" || item.qtyL !== "")
            .map((item) => ({
                modelId: Number(item.modelId),
                qtyR: Number(item.qtyR || 0),
                qtyL: Number(item.qtyL || 0),
            }));

        try {
            setLoading(true);
            const response = await fetchData(
                "plans/create",
                {
                    shiftId: Number(currentShift.Id),
                    items,
                },
                "POST"
            );

            if (response.error) {
                throw new Error(response.message);
            }

            Toast.success(response.message || "Base planning created successfully.");
            router.push("/pages/plan");
        } catch (err) {
            const message = err.message || "Failed to create base planning";
            if (message.includes("already been created today")) {
                SweetAlert({
                    title: "Base Planning Already Exists",
                    text: message,
                    icon: "warning",
                });
            } else {
                Toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    }, [validateForm, currentShift, partPlans, router]);

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    return (
        <>
            <Loading loading={loading} message="Loading data..." />
            <style jsx>{`
                .planning-table-shell {
                    max-height: min(62vh, 640px);
                    overflow: auto;
                    border: 1px solid #dee2e6;
                    border-radius: 0.5rem;
                }

                .planning-table {
                    margin-bottom: 0;
                }

                .planning-table thead th {
                    position: sticky;
                    top: 0;
                    z-index: 2;
                    background: #f8fbff;
                    box-shadow: inset 0 -1px 0 #dee2e6;
                }
            `}</style>
            <Breadcrumb
                title="Add Base Planning"
                items={[
                    { label: "Base Planning", href: "/pages/plan" },
                    { label: "Add Base Planning" },
                ]}
            />
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Current Shift"
                                    name="currentShift"
                                    id="currentShift"
                                    value={currentShift ? `${currentShift.Code} - ${currentShift.Name}` : "-"}
                                    onChange={() => {}}
                                    readOnly={true}
                                    helperText={currentShift ? `${currentShift.StartTime} - ${currentShift.EndTime}` : ""}
                                />
                            </div>
                        </div>
                        <div className="alert alert-info py-2 px-3 mb-3" style={{ fontSize: 13 }}>
                            Fill only the active side required by each model. If a model uses a single side,
                            enter quantity for that side only and leave the unused side as <strong>0</strong>.
                            WIP input and dashboard side visibility will follow the saved daily plan.
                        </div>

                        <div className="mt-2">
                            <div className="planning-table-shell">
                                <table className="table table-sm table-bordered align-middle planning-table">
                                    <thead>
                                        <tr>
                                            <th className="text-center">No</th>
                                            <th>Model</th>
                                            <th className="text-center">Qty R</th>
                                            <th className="text-center">Qty L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partPlans.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center text-secondary">
                                                    No base planning items available.
                                                </td>
                                            </tr>
                                        ) : (
                                            partPlans.map((item, index) => (
                                                <tr key={item.modelId}>
                                                    <td className="text-center">{index + 1}</td>
                                                    <td>{item.modelCode}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="form-control form-control-sm"
                                                            value={item.qtyR}
                                                            onChange={(e) => handlePlanQtyChange(index, "qtyR", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="form-control form-control-sm"
                                                            value={item.qtyL}
                                                            onChange={(e) => handlePlanQtyChange(index, "qtyL", e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {errors.partPlans && (
                                <div style={{ color: "#a32d2d", fontSize: 12 }}>{errors.partPlans}</div>
                            )}
                        </div>

                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="d-flex justify-content-end gap-2">
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
                                        label={loading ? "Saving..." : "Save"}
                                        type="submit"
                                        isDisabled={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
