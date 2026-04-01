"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Input from "@/component/common/Input";
import Button from "@/component/common/Button";
import Toast from "@/component/common/Toast";
import Breadcrumb from "@/component/common/Breadcrumb";
import Loading from "@/component/common/Loading";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";
import SweetAlert from "@/component/common/SweetAlert";

const maxLengthRules = {
    reason: 100,
};

export default function EditPlanPage() {
    const path = useParams();
    const router = useRouter();
    const id = decryptIdUrl(path.id);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLocked, setIsLocked] = useState(false);
    const [formData, setFormData] = useState({
        id: "",
        shiftId: "",
        shiftLabel: "",
        shiftTime: "",
        reason: "",
    });
    const [modelPlans, setModelPlans] = useState([]);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const detailRes = await fetchData(`plans/${id}`, {}, "GET");
            if (detailRes.error) {
                throw new Error(detailRes.message);
            }

            const detail = detailRes.data || {};

            const models = Array.isArray(detail.Models) ? detail.Models : [];
            setModelPlans(models.map((item) => ({
                modelId: item.ModelId,
                modelCode: item.ModelCode,
                qtyR: item.QtyR ?? 0,
                qtyL: item.QtyL ?? 0,
            })));

            setFormData({
                id,
                shiftId: detail.ShiftId || "",
                shiftLabel: `${detail.ShiftCode || ""} - ${detail.ShiftName || ""}`,
                shiftTime: `${detail.ShiftStart || ""} - ${detail.ShiftEnd || ""}`,
                reason: "",
            });
            setIsLocked(detail.CanEdit === false);
        } catch (err) {
            Toast.error(err.message || "Failed to load plan data");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id, loadData]);

    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    }, [errors]);

    const handlePlanQtyChange = useCallback((index, field, value) => {
        setModelPlans((prev) =>
            prev.map((item, idx) =>
                idx === index ? { ...item, [field]: value } : item
            )
        );
    }, []);

    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!formData.reason || !formData.reason.trim()) {
            newErrors.reason = "Reason is required for update.";
        }

        const validRows = modelPlans.filter(
            (item) => item.qtyR !== "" || item.qtyL !== ""
        );
        if (validRows.length === 0) {
            newErrors.partPlans = "Please fill at least one model planning row.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, modelPlans]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            Toast.error("Please fill in all required fields.");
            return;
        }

        if (isLocked) {
            SweetAlert({
                title: "Edit Locked",
                text: "This plan can no longer be edited because the shift time has passed.",
                icon: "warning",
            });
            return;
        }

        const items = modelPlans
            .filter((item) => item.qtyR !== "" || item.qtyL !== "")
            .map((item) => ({
                modelId: Number(item.modelId),
                qtyR: Number(item.qtyR || 0),
                qtyL: Number(item.qtyL || 0),
            }));

        try {
            setLoading(true);
            const response = await fetchData(
                "plans/update",
                {
                    id: Number(formData.id),
                    shiftId: Number(formData.shiftId),
                    reason: formData.reason,
                    items,
                },
                "PUT"
            );

            if (response.error) {
                throw new Error(response.message);
            }

            Toast.success(response.message || "Base planning updated successfully.");
            router.push("/pages/plan");
        } catch (err) {
            Toast.error(err.message || "Failed to update base planning");
        } finally {
            setLoading(false);
        }
    }, [validateForm, formData, modelPlans, router, isLocked]);

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
                title="Edit Base Planning"
                items={[
                    { label: "Base Planning", href: "/pages/plan" },
                    { label: "Edit Base Planning" },
                ]}
            />
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Shift"
                                    name="shiftLabel"
                                    id="shiftLabel"
                                    value={formData.shiftLabel}
                                    onChange={() => {}}
                                    readOnly={true}
                                    helperText={formData.shiftTime}
                                />
                            </div>
                            <div className="col-lg-4">
                                <Input
                                    label="Reason"
                                    name="reason"
                                    id="reason"
                                    value={formData.reason}
                                    onChange={handleFormChange}
                                    error={errors.reason}
                                    maxLength={maxLengthRules.reason}
                                    readOnly={isLocked}
                                />
                            </div>
                        </div>
                        <div className="alert alert-info py-2 px-3 mb-3" style={{ fontSize: 13 }}>
                            Update only the active side required by each model. If a model uses a single side,
                            keep the unused side at <strong>0</strong>. WIP input and dashboard side visibility
                            will follow the saved daily plan.
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
                                        {modelPlans.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center text-secondary">
                                                    No model planning data available.
                                                </td>
                                            </tr>
                                        ) : (
                                            modelPlans.map((item, index) => (
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
                                                            disabled={isLocked}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="form-control form-control-sm"
                                                            value={item.qtyL}
                                                            onChange={(e) => handlePlanQtyChange(index, "qtyL", e.target.value)}
                                                            disabled={isLocked}
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
                                        label={isLocked ? "Locked" : (loading ? "Saving..." : "Save")}
                                        type="submit"
                                        isDisabled={loading || isLocked}
                                    />
                                </div>
                            </div>
                        </div>
                        {isLocked && (
                            <div className="text-warning mt-2" style={{ fontSize: 12 }}>
                                This plan is locked because the shift date/time has passed.
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
