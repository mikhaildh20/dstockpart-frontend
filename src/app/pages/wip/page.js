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

export default function WipPage() {
    const router = useRouter();
    const [dataWips, setDataWips] = useState([]);
    const [loading, setLoading] = useState(false);

    const sortRef = useRef();
    const dataFilterSort = [
        { Value: "mdl_code ASC", Text: "Model [A-Z]" },
        { Value: "mdl_code DESC", Text: "Model [Z-A]" },
        { Value: "updated_at DESC", Text: "Last Input [Newest]" },
        { Value: "updated_at ASC", Text: "Last Input [Oldest]" },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);

    const formatDateTime = useCallback((value) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString("en-GB")}`;
    }, []);

    const loadData = useCallback(async (page, sort, keyword) => {
        try {
            setLoading(true);

            const response = await fetchData(
                "wips",
                {
                    ...(keyword === "" ? {} : { Keyword: keyword }),
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
                Model: item.ModelCode,
                Shift: `${item.ShiftCode} - ${item.ShiftName}`,
                "Total R": item.TotalQtyR,
                "Total L": item.TotalQtyL,
                "Last Input By": item.LastInputBy || "-",
                "Last Input At": formatDateTime(item.LastInputAt),
                Action: ["Detail"],
                Alignment: ["center", "center", "center", "center", "center", "center", "center", "center"],
            }));

            setDataWips(mapped);
            setTotalData(totalData || 0);
            setCurrentPage(page);
        } catch (err) {
            Toast.error(err.message || "Failed to load WIP data");
            setDataWips([]);
            setTotalData(0);
        } finally {
            setLoading(false);
        }
    }, [pageSize, formatDateTime]);

    useEffect(() => {
        loadData(1, sortBy, search);
    }, [loadData, sortBy, search]);

    const handleSearch = useCallback((query) => {
        setSearch(query);
        loadData(1, sortBy, query);
    }, [sortBy, loadData]);

    const handleFilterApply = useCallback(() => {
        const newSortBy = sortRef.current.value;
        setSortBy(newSortBy);
        setCurrentPage(1);
        loadData(1, newSortBy, search);
    }, [search, loadData]);

    const handleNavigation = useCallback((page) => {
        loadData(page, sortBy, search);
    }, [sortBy, search, loadData]);

    const handleDetail = useCallback((id) => {
        router.push(`/pages/wip/detail/${encryptIdUrl(id)}`);
    }, [router]);

    const filterContent = (
        <DropDown
            ref={sortRef}
            arrData={dataFilterSort}
            type="choose"
            label="Sorting"
            forInput="sortBy"
            defaultValue={sortBy}
        />
    );

    return (
        <>
            <Loading loading={loading} message="Loading data..." />
            <Breadcrumb title="Work in Progress Management" items={[]} />
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onFilter={handleFilterApply}
                    searchPlaceholder="Search model or last input user"
                    showAddButton={false}
                    showExportButton={false}
                    filterContent={filterContent}
                />
            </div>
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <Table
                            size="Small"
                            data={dataWips}
                            onDetail={handleDetail}
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
