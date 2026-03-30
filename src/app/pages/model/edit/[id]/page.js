"use client";

import { useState, useCallback, useEffect } from "react";
import Input from "@/component/common/Input";
import Button from "@/component/common/Button";
import { useRouter, useParams } from "next/navigation";
import fetchData from "@/lib/fetch";
import Toast from "@/component/common/Toast";
import Breadcrumb from "@/component/common/Breadcrumb";
import { decryptIdUrl } from "@/lib/encryptor";

const maxLengthRules = {
  code: 50,
};

export default function EditModelPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);
  const [formData, setFormData] = useState({
    id: "",
    code: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetchData(`models/${id}`, {}, "GET");

      if (response.error) {
        throw new Error(response.message);
      }

      const data = response.data || {};

      setFormData({
        id,
        code: data.Code || "",
      });
    } catch (err) {
      Toast.error(err.message || "An error occurred while fetching model data");
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
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      const value = formData[field];
      if (!value || (typeof value === "string" && !value.trim())) {
        newErrors[field] = message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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
          "models/update",
          {
            id: formData.id,
            code: formData.code,
          },
          "PUT"
        );

        if (!data.error) {
          Toast.success(data.message || "Model data updated successfully");
          router.push("/pages/model");
        } else {
          Toast.error(
            data.message || "An error occurred while updating model data"
          );
          setLoading(false);
        }
      } catch (err) {
        Toast.error(
          err.message || "An error occurred while updating model data"
        );
        setLoading(false);
      }
    },
    [validateForm, formData, router]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <>
      <Breadcrumb
        title="Edit Model"
        items={[
          { label: "Models Management", href: "/pages/model" },
          { label: "Edit Model" },
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
