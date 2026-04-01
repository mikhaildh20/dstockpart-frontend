"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import DropDown from "@/component/common/Dropdown";
import Formsearch from "@/component/common/Formsearch";
import Breadcrumb from "@/component/common/Breadcrumb";
import Loading from "@/component/common/Loading";
import fetchData from "@/lib/fetch";
import { encryptIdUrl } from "@/lib/encryptor";

export default function PlanPage() {
    const router = useRouter();
    const [dataPlans, setDataPlans] = useState([]);
    const [loading, setLoading] = useState(false);

    const sortRef = useRef();
    const dateRef = useRef();
    const dataFilterSort = [
        { Value: "created_at DESC", Text: "Created At [Newest]" },
        { Value: "created_at ASC", Text: "Created At [Oldest]" },
        { Value: "model ASC", Text: "Model [A-Z]" },
        { Value: "model DESC", Text: "Model [Z-A]" },
        { Value: "shift ASC", Text: "Shift [A-Z]" },
        { Value: "shift DESC", Text: "Shift [Z-A]" },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
    const [planDate, setPlanDate] = useState("");

    const formatDate = useCallback((value) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("en-GB");
    }, []);

    const loadData = useCallback(
        async (page, sort, keyword, dateFilter) => {
            try {
                setLoading(true);

                const response = await fetchData(
                    "plans",
                    {
                        ...(keyword === "" ? {} : { Keyword: keyword }),
                        ...(dateFilter === "" ? {} : { PlanDate: dateFilter }),
                        ModelSummary: true,
                        Urut: sort,
                        PageNumber: page,
                        PageSize: pageSize,
                    },
                    "GET"
                );

                if (response.error) {
                    throw new Error(response.message);
                }

                const { data = [], totalData = 0 } = response.data || {};

                const mapped = data.map((item, index) => ({
                    No: (page - 1) * pageSize + index + 1,
                    id: item.Id,
                    "Plan Date": formatDate(item.PlanDate || item.CreatedAt),
                    Shift: `${item.ShiftCode} - ${item.ShiftName}`,
                    Model: item.ModelCode,
                    "Qty R": item.QtyR,
                    "Qty L": item.QtyL,
                    Action: ["Edit"],
                    Alignment: ["center", "center", "center", "center", "center", "center", "center"],
                }));

                setDataPlans(mapped);
                setTotalData(totalData || 0);
                setCurrentPage(page);
            } catch (err) {
                Toast.error(err.message || "Failed to load plans");
                setDataPlans([]);
                setTotalData(0);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, formatDate]
    );

    useEffect(() => {
        loadData(1, sortBy, search, planDate);
    }, [loadData, sortBy, search, planDate]);

    const handleSearch = useCallback((query) => {
        setSearch(query);
        loadData(1, sortBy, query, planDate);
    }, [sortBy, loadData, planDate]);

    const handleFilterApply = useCallback(() => {
        const newSortBy = sortRef.current.value;
        const newPlanDate = dateRef.current?.value || "";
        setSortBy(newSortBy);
        setPlanDate(newPlanDate);
        setCurrentPage(1);
        loadData(1, newSortBy, search, newPlanDate);
    }, [search, loadData]);

    const handleNavigation = useCallback((page) => {
        loadData(page, sortBy, search, planDate);
    }, [sortBy, search, loadData, planDate]);

    const handleAdd = useCallback(() => {
        router.push("/pages/plan/add");
    }, [router]);

    const handleEdit = useCallback((id) => {
        router.push(`/pages/plan/edit/${encryptIdUrl(id)}`);
    }, [router]);

    const filterContent = (
        <>
            <DropDown
                ref={sortRef}
                arrData={dataFilterSort}
                type="choose"
                label="Sorting"
                forInput="sortBy"
                defaultValue={sortBy}
            />
            <div className="mb-3">
                <label
                    htmlFor="planDateFilter"
                    className="form-label"
                    style={{ fontSize: 12, fontWeight: 500 }}
                >
                    Plan Date
                </label>
                <input
                    ref={dateRef}
                    id="planDateFilter"
                    type="date"
                    className="form-control rounded-2"
                    defaultValue={planDate}
                    style={{ fontSize: 13, height: 38 }}
                />
            </div>
        </>
    );

    return (
        <>
            <Loading loading={loading} message="Loading data..." />
            <Breadcrumb title="Plans Management" items={[]} />
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onAdd={handleAdd}
                    onFilter={handleFilterApply}
                    searchPlaceholder="Search plan data"
                    addButtonText="Add"
                    showExportButton={false}
                    filterContent={filterContent}
                />
            </div>
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <Table
                            size="Small"
                            data={dataPlans}
                            onEdit={handleEdit}
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
        </>
    );
}
