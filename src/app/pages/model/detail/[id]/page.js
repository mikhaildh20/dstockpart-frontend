"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Button from "@/component/common/Button";
import Paging from "@/component/common/Paging";
import DropDown from "@/component/common/Dropdown";
import Table from "@/component/common/Table";
import { useRouter, useParams } from "next/navigation";
import fetchData from "@/lib/fetch";
import Toast from "@/component/common/Toast";
import Breadcrumb from "@/component/common/Breadcrumb";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";
import Loading from "@/component/common/Loading";
import Formsearch from "@/component/common/Formsearch";

export default function ModelDetailPage() {
    const path = useParams();
    const router = useRouter();
    const id = decryptIdUrl(path.id);
    const [dataParts, setDataParts] = useState([]);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [selectedParts, setSelectedParts] = useState([]);
    const [initialSelected, setInitialSelected] = useState([]);

    const loadDetails = useCallback(async () => {
        try{
            setLoading(true);
            
            const response = await fetchData(`models/${id}`,{},"GET");

            if (response.error) {
                throw new Error(response.message);
            }

            const data = response.data || {};

            if(response){
                setTitle(`Detail Model - ${data.Code || "N/A"}`);
            }else{
                throw new Error("Failed to load model data");
            }
        }catch(err){
            Toast.error(err.message || "Error loading model details");
            router.back();
        }finally{
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (id) {
            loadDetails();
        }
    }, [id, loadDetails]);

    const sortRef = useRef();
    const statusRef = useRef();
    const dataFilterSort = [
        { Value: "prt_code ASC", Text: "Part Code [↑]" },
        { Value: "prt_code DESC", Text: "Part Code [↓]" },
        { Value: "prt_name ASC", Text: "Part Name [↑]" },
        { Value: "prt_name DESC", Text: "Part Name [↓]" },
    ];

    const dataFilterStatus = [
        { Value: "1", Text: "Active" },
        { Value: "0", Text: "Inactive" },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
    const [sortStatus, setSortStatus] = useState(dataFilterStatus[0].Value);

    const handleDetail = useCallback((mpdId) => {
        router.push(`/pages/part/detail/${encryptIdUrl(mpdId)}?modelId=${encodeURIComponent(id)}`);
    }, [id, router]);

    const loadData = useCallback(async (page, sort, cari, status) => {
        try{
            setLoading(true);

            const response = await fetchData("parts", 
                {
                    Status: status,
                    ...(cari === "" ? {} : { Keyword: cari }),
                    Urut: sort,
                    PageNumber: page,
                    PageSize: pageSize,
                    ModelDetail: true,
                    ModelId: id,
                },
                "GET"
            );

            if (response.error) {
                throw new Error(response.message);
            }

            const { data = [], totalData = 0 } = response.data || {};

            const pagedData = data.map((item, index) => ({
                No: (page - 1) * pageSize + index + 1,
                id: item.Id,
                Code: item.Code,
                Part: item.Name,
                Status: item.Status,
                Action: item.MpdId ? [
                    {
                        IconName: "eye",
                        Title: "See Detail",
                        Function: () => handleDetail(item.MpdId),
                    },
                ] : "-",
                Alignment: ["center", "center","center","center", "center"],
            }));

            setDataParts(pagedData);
            setTotalData(totalData || 0);
            setCurrentPage(page);
        }catch(err){
            Toast.error(err.message || "Failed to load data");
            setDataParts([]);
            setTotalData(0);
        }finally{
            setLoading(false);
        }
    }, [pageSize, id, handleDetail]);

    const initialSelectedIds = useMemo(() => {
        return dataParts
            .filter(item => item.Status === "Active")
            .map(item => item.id);
    }, [dataParts]);

    useEffect(() => {
        const initial = dataParts
            .filter(item => item.Status === "Active")
            .map(item => item.id);

        setInitialSelected(initial);
    }, [dataParts]);

    const handleSearch = useCallback((query) => {
        setSearch(query);
        loadData(1, sortBy, query, sortStatus);
    },[sortBy, sortStatus, loadData]);

    const handleFilterApply = useCallback(() => {
        const newSortBy = sortRef.current.value;
        const newStatus = statusRef.current.value;

        setSortBy(newSortBy);
        setSortStatus(newStatus);
        setCurrentPage(1);
        loadData(1, newSortBy, search, newStatus);
    }, [search, loadData]);

    const handleNavigation = useCallback((page) => {
        loadData(page, sortBy, search, sortStatus);
    },[sortBy, search, sortStatus, loadData]);

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    useEffect(() => {
        loadData(1, sortBy, search, sortStatus);
    }, [loadData, sortBy, search, sortStatus]);

    const handleSelection = useCallback((selectedIds) => {
        setSelectedParts([...new Set(selectedIds)]);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        setLoading(true);

        const toAssign = selectedParts.filter(
            id => !initialSelected.includes(id)
        );

        const toUnassign = initialSelected.filter(
            id => !selectedParts.includes(id)
        );

        try {
            const data = await fetchData(
                "parts/assign-to-model",
                {
                    modelId: id,
                    assignIds: toAssign,
                    unassignIds: toUnassign,
                },
                "POST"
            );

            if (!data.error) {
                Toast.success("Part assignment updated successfully");
                router.push("/pages/model");
            }
        } catch (err) {
            Toast.error(err.message || "Error updating part assignment");
        } finally {
            setLoading(false);
        }
    }, [selectedParts, initialSelected, id, router]);

    const filterContent = useMemo(
        () => (
        <>
            <DropDown
            ref={sortRef}
            arrData={dataFilterSort}
            type="choose"
            label="Sorting"
            forInput="sortBy"
            defaultValue={sortBy}
            />
            <DropDown
            ref={statusRef}
            arrData={dataFilterStatus}
            type="choose"
            label="Status"
            forInput="sortStatus"
            defaultValue={sortStatus}
            />
        </>
        ),
        [sortBy, sortStatus]
    );

    return (
        <>
            <Loading loading={loading} message="Loading data..." />
            <Breadcrumb
                title={title}
                items={[
                    { label: "Models Management", href: "/pages/model" },
                    { label: "Model Parts" },
                ]}
            />
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onFilter={handleFilterApply}
                    searchPlaceholder="Search part data"
                    showExportButton={false}
                    showAddButton={false}
                    filterContent={filterContent}
                />
            </div>
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0 pb-0">
                        <h6 className="mb-0">Part Assignment and Section Setup</h6>
                        <small className="text-secondary">
                            Check parts to assign them to this model. Use the detail action on active rows to arrange section sequence.
                        </small>
                    </div>
                    <div className="card-body p-0">
                        <Table
                                size="Small"
                                data={dataParts}
                                initialSelectedIds={initialSelectedIds}
                                enableCheckbox={true}
                                onSelectionChange={handleSelection}
                        />
                        {totalData > 0 && (
                            <div className="p-3 border-top">
                                <Paging
                                    pageSize={pageSize}
                                    pageCurrent={currentPage}
                                    totalData={totalData}
                                    navigation={handleNavigation}
                                    />
                                </div>
                            )}
                    </div>
                </div>
            </div>
            <form onSubmit={handleSubmit}>
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
        </>
    );
}
