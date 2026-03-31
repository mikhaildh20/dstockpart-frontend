"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import DropDown from "@/component/common/Dropdown";
import Button from "@/component/common/Button";
import Toast from "@/component/common/Toast";
import SweetAlert from "@/component/common/SweetAlert";
import Breadcrumb from "@/component/common/Breadcrumb";
import Loading from "@/component/common/Loading";
import fetchData from "@/lib/fetch";

export default function AddPlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState([]);
    const [currentShift, setCurrentShift] = useState(null);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        modelId: "",
    });
    const [partPlans, setPartPlans] = useState([]);

    const modelOptions = useMemo(
        () => models.map((item) => ({ Value: item.Id, Text: item.Code })),
        [models]
    );

    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);

            const [modelsRes, shiftRes] = await Promise.all([
                fetchData("plans/models", {}, "GET"),
                fetchData("plans/current-shift", {}, "GET"),
            ]);

            if (modelsRes.error) {
                throw new Error(modelsRes.message);
            }
            if (shiftRes.error) {
                throw new Error(shiftRes.message);
            }

            setModels(Array.isArray(modelsRes.data) ? modelsRes.data : []);
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

    const loadPartsByModel = useCallback(async (modelId) => {
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

    const handleFormChange = useCallback(async (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }

        if (name === "modelId") {
            setPartPlans([]);
            if (!value) return;
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

        if (!currentShift?.Id) {
            Toast.error("Current shift is not available.");
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

            Toast.success(response.message || "Plans created successfully.");
            router.push("/pages/plan");
        } catch (err) {
            const message = err.message || "Failed to create plans";
            if (message.includes("already been created today")) {
                SweetAlert({
                    title: "Plan Already Exists",
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
            <Breadcrumb
                title="Add Plan"
                items={[
                    { label: "Plans Management", href: "/pages/plan" },
                    { label: "Add Plan" },
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
                                />
                            </div>
                            <div className="col-lg-4">
                                <label className="form-label" style={{ fontSize: 12, fontWeight: 500 }}>
                                    Current Shift
                                </label>
                                <div className="form-control" style={{ fontSize: 13, height: 38 }}>
                                    {currentShift ? `${currentShift.Code} - ${currentShift.Name}` : "-"}
                                </div>
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
                                                    Select a model to load parts.
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
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
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
