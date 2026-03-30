"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Paging from "@/component/common/Paging";
import Table from "@/component/common/Table";
import Toast from "@/component/common/Toast";
import DropDown from "@/component/common/Dropdown";
import Formsearch from "@/component/common/Formsearch";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import { encryptIdUrl } from "@/lib/encryptor";
import SweetAlert from "@/component/common/SweetAlert";
import Breadcrumb from "@/component/common/Breadcrumb";
import Loading from "@/component/common/Loading";

export default function LinePage(){
    const router = useRouter();
    const [dataLine, setDataLine] = useState([]);
    const [dataLineRaw, setDataLineRaw] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const sortRef = useRef();
    const statusRef = useRef();
    const dataFilterSort = [
        { Value: "lne_code ASC", Text: "Line Code [↑]" },
        { Value: "lne_code DESC", Text: "Line Code [↓]" },
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

    const loadData = useCallback(async (page, sort, cari, status) => {
        try{
            setLoading(true);

            const response = await fetchData("lines", 
                {
                    Status: status,
                    ...(cari === "" ? {} : { Search: cari }),
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

            setDataLineRaw(response.data.data || []);

            const pagedData = data.map((item, index) => ({
                No: (page - 1) * pageSize + index + 1,
                id: item.Id,
                Code: item.Code,
                Status: item.Status === 1 ? "Active" : "Inactive",
                Action: ["Edit", "Toggle", "Detail"],
                Alignment: ["center", "center","center"],
            }));

            setDataLine(pagedData);
            setTotalData(totalData || 0);
            setCurrentPage(page);
        } catch (err) {
            Toast.error(err.message || "Failed to load data");
            setDataLine([]);
            setTotalData(0);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

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

    const handleAdd = useCallback(() => {
        router.push("/pages/line/add");
    }, [router]);

    const handleEdit = useCallback(
        (id) =>
        router.push(`/pages/line/edit/${encryptIdUrl(id)}`),
        [router]
    );

    const handleDetail = useCallback(
        async (id) => {

        }
    );

    const handleToggle = useCallback(
        async (id) => {

        const line = dataLineRaw.find(item => item.Id === id);
        const isActive = line?.Status === 1;
        
        if (isActive) {
            const result = await SweetAlert({
                title: "Disable Line",
                text: "Are you sure you want to disable this line?",
                icon: "warning",
                confirmText: "Yes, disable it!",
            });

            if (!result) return;
        }

        setLoading(true);

        try {
            const data = await fetchData(
            "lines/toggle-status",
            {
                id: id,
            },
            "POST"
            );

            if (data.error) {
            throw new Error(data.message);
            }

            Toast.success(data.message || "Line status updated successfully");
            await loadData(1, sortBy, search, sortStatus);
        } catch (err) {
            Toast.error(err.message);
        } finally {
            setLoading(false);
        }
        },
        [sortBy, search, sortStatus, loadData, dataLineRaw]
    );

    useEffect(() => {
        loadData(1, sortBy, search, sortStatus);
    }, [loadData, sortBy, search, sortStatus]);

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
                title="Lines Management"
                items={[]}
            />
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onAdd={handleAdd}
                    onFilter={handleFilterApply}
                    searchPlaceholder="Search line data"
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
                                data={dataLine}
                                onEdit={handleEdit}
                                onToggle={handleToggle}
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
