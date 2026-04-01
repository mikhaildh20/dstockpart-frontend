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

export default function PartPage(){
    const router = useRouter();
    const [dataPart, setDataPart] = useState([]);
    const [dataPartRaw, setDataPartRaw] = useState([]);
    const [loading, setLoading] = useState(false);

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
                },
                "GET"
            );

            if (response.error) {
                throw new Error(response.message);
            }

            const { data = [], totalData = 0 } = response.data || {};

            setDataPartRaw(response.data.data || []);

            const pagedData = data.map((item, index) => ({
                No: (page - 1) * pageSize + index + 1,
                id: item.Id,
                Code: item.Code,
                Name: item.Name,
                Status: item.Status === 1 ? "Active" : "Inactive",
                Action: ["Edit", "Toggle"],
                Alignment: ["center", "center","center","center", "center"],
            }));

            setDataPart(pagedData);
            setTotalData(totalData || 0);
            setCurrentPage(page);
        }catch(err){
            Toast.error(err.message || "Failed to load data");
            setDataPart([]);
            setTotalData(0);
        }finally{
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
        router.push("/pages/part/add");
    }, [router]);

    const handleEdit = useCallback(
        (id) =>
        router.push(`/pages/part/edit/${encryptIdUrl(id)}`),
        [router]
    );

    const handleToggle = useCallback(
        async (id) => {
            
        const part = dataPartRaw.find(item => item.Id === id);
        const isActive = part?.Status === 1;
        
        if (isActive) {
            const result = await SweetAlert({
                title: "Disable Part",
                text: "Are you sure you want to disable this part?",
                icon: "warning",
                confirmText: "Yes, disable it!",
            });

            if (!result) return;
        }

        setLoading(true);

        try {
            const data = await fetchData(
            "parts/toggle-status",
            {
                id: id,
            },
            "POST"
            );

            if (data.error) {
            throw new Error(data.message);
            }

            Toast.success(data.message || "Part status updated successfully");
            await loadData(1, sortBy, search, sortStatus);
        } catch (err) {
            Toast.error(err.message);
        } finally {
            setLoading(false);
        }
        },
        [sortBy, search, sortStatus, loadData, dataPartRaw]
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
                title="Parts Management"
                items={[]}
            />
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onAdd={handleAdd}
                    onFilter={handleFilterApply}
                    searchPlaceholder="Search part data"
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
                                data={dataPart}
                                onEdit={handleEdit}
                                onToggle={handleToggle}
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
