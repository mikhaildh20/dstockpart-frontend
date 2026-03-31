"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Input from "@/component/common/Input";
import DropDown from "@/component/common/Dropdown";
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
    const [models, setModels] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLocked, setIsLocked] = useState(false);
    const [formData, setFormData] = useState({
        id: "",
        modelId: "",
        shiftId: "",
        shiftLabel: "",
        shiftTime: "",
        reason: "",
    });
    const [partPlans, setPartPlans] = useState([]);

    const modelOptions = useMemo(
        () => models.map((item) => ({ Value: item.Id, Text: item.Code })),
        [models]
    );

    const loadPartsByModel = useCallback(async (modelId) => {
        if (!modelId) {
            setPartPlans([]);
            return;
        }

        const response = await fetchData(`plans/parts-by-model/${modelId}`, {}, "GET");
        if (response.error) {
            throw new Error(response.message);
        }

        const mapped = (Array.isArray(response.data) ? response.data : []).map((item) => ({
            mpdId: item.MpdId,
            partCode: item.PartCode,
            partName: item.PartName,
            qtyR: "",
            qtyL: "",
        }));
        setPartPlans(mapped);
    }, []);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [modelsRes, detailRes] = await Promise.all([
                fetchData("plans/models", {}, "GET"),
                fetchData(`plans/${id}`, {}, "GET"),
            ]);

            if (modelsRes.error) {
                throw new Error(modelsRes.message);
            }
            if (detailRes.error) {
                throw new Error(detailRes.message);
            }

            const modelList = Array.isArray(modelsRes.data) ? modelsRes.data : [];
            const detail = detailRes.data || {};
            setModels(modelList);

            const parts = Array.isArray(detail.Parts) ? detail.Parts : [];
            setPartPlans(parts.map((item) => ({
                mpdId: item.MpdId,
                partCode: item.PartCode,
                partName: item.PartName,
                qtyR: item.QtyR ?? 0,
                qtyL: item.QtyL ?? 0,
            })));

            setFormData({
                id,
                modelId: detail.ModelId || "",
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

    const handleFormChange = useCallback(async (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }

        if (name === "modelId") {
            try {
                await loadPartsByModel(value);
            } catch (err) {
                Toast.error(err.message || "Failed to load parts");
            }
        }
    }, [errors, loadPartsByModel]);

    const handlePlanQtyChange = useCallback((index, field, value) => {
        setPartPlans((prev) =>
            prev.map((item, idx) =>
                idx === index ? { ...item, [field]: value } : item
            )
        );
    }, []);

    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!formData.modelId) newErrors.modelId = "Model is required.";
        if (!formData.reason || !formData.reason.trim()) {
            newErrors.reason = "Reason is required for update.";
        }

        const validRows = partPlans.filter(
            (item) => item.qtyR !== "" || item.qtyL !== ""
        );
        if (validRows.length === 0) {
            newErrors.partPlans = "Please fill at least one part plan.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, partPlans]);

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

        const items = partPlans
            .filter((item) => item.qtyR !== "" || item.qtyL !== "")
            .map((item) => ({
                mpdId: Number(item.mpdId),
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

            Toast.success(response.message || "Plans updated successfully.");
            router.push("/pages/plan");
        } catch (err) {
            Toast.error(err.message || "Failed to update plans");
        } finally {
            setLoading(false);
        }
    }, [validateForm, formData, partPlans, router, isLocked]);

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    return (
        <>
            <Loading loading={loading} message="Loading data..." />
            <Breadcrumb
                title="Edit Plan"
                items={[
                    { label: "Plans Management", href: "/pages/plan" },
                    { label: "Edit Plan" },
                ]}
            />
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-lg-4">
                                <DropDown
                                    arrData={modelOptions}
                                    type="choose"
                                    label="Model"
                                    forInput="modelId"
                                    value={formData.modelId}
                                    onChange={handleFormChange}
                                    errorMessage={errors.modelId}
                                    isRequired={true}
                                    isDisabled={isLocked}
                                />
                            </div>
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

                        <div className="mt-2">
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered align-middle">
                                    <thead>
                                        <tr>
                                            <th className="text-center">No</th>
                                            <th>Part</th>
                                            <th className="text-center">Qty R</th>
                                            <th className="text-center">Qty L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partPlans.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center text-secondary">
                                                    No parts available for this model.
                                                </td>
                                            </tr>
                                        ) : (
                                            partPlans.map((item, index) => (
                                                <tr key={item.mpdId}>
                                                    <td className="text-center">{index + 1}</td>
                                                    <td>{item.partCode} - {item.partName}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            value={item.qtyR}
                                                            onChange={(e) => handlePlanQtyChange(index, "qtyR", e.target.value)}
                                                            disabled={isLocked}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
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
