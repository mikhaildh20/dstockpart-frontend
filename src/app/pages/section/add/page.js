"use client";

import { useState, useCallback } from "react";
import Input from "@/component/common/Input";
import Button from "@/component/common/Button";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import Toast from "@/component/common/Toast";
import Breadcrumb from "@/component/common/Breadcrumb";

const maxLengthRules = {
    code: 50,
    name: 100,
}

export default function AddSectionPage(){
    const [formData, setFormData] = useState({
        code: "",
        name: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const router = useRouter();

    const handleChange = useCallback(
        (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
        },
        [errors]
    );

    const validateForm = useCallback(() => {
        const newErrors = {};
        const requiredFields = {
        code: "Code is required.",
        name: "Name is required.",
        };

        for (const [field, message] of Object.entries(requiredFields)) {
        const value = formData[field];
        if (!value || (typeof value === "string" && !value.trim())) {
            newErrors[field] = message;
        }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    },[formData]);

    const reset = useCallback(() => {
        setFormData({
            code: "",
            name: "",
        });
    },[]);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();

            if (!validateForm()) {
                Toast.error("Please fill in all required fields.");
                return;
            }

            setLoading(true);

            try {
                const data = await fetchData(
                "sections/create",
                formData,
                "POST"
                );

                if (!data.error) {
                Toast.success(data.message || "Section created successfully.");
                reset();
                router.push("/pages/section");
                } else {
                Toast.error(data.message || "Error occured while creating section.");
                setLoading(false);
                }
            } catch (err) {
                Toast.error("Failed to create section! " + err.message);
                setLoading(false);
            }
        },
        [validateForm, formData, router, reset]
    );

    const handleCancel = useCallback(() => {
        reset();
        router.back();
    }, [reset, router]);

    return(
        <>
        <Breadcrumb
            title="Add Section"
            items={[
                { label: "Sections Management", href: "/pages/section" },
                { label: "Add Section" },
            ]}
        />
        <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-lg-4">
                            <Input
                                label="Code"
                                name="code"
                                id="code"
                                value={formData.code}
                                onChange={handleChange}
                                error={errors.code}
                                maxLength={maxLengthRules.code}
                            />
                        </div>
                        <div className="col-lg-4">
                            <Input
                                label="Name"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                maxLength={maxLengthRules.name}
                            />
                        </div>
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