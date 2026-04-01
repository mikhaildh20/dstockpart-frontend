"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import fetchData, { API_BASE_URL } from "@/lib/fetch";
import Toast from "@/component/common/Toast";
import Loading from "@/component/common/Loading";
import Input from "@/component/common/Input";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [modelSearch, setModelSearch] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [clock, setClock] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [draftDate, setDraftDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [draftMonth, setDraftMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [draftShiftId, setDraftShiftId] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeView, setActiveView] = useState("matrix");

  const socketBaseUrl = useMemo(
    () => API_BASE_URL.replace(/\/api\/?$/, ""),
    []
  );

  const formatClock = useCallback((date) => {
    return date.toLocaleTimeString("en-GB");
  }, []);

  const formatDate = useCallback((date) => {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  const formatNumber = useCallback((value) => {
    const numeric = Number(value ?? 0);
    if (Number.isNaN(numeric)) return "0";
    return numeric.toLocaleString("en-GB");
  }, []);

  const getStatusTone = useCallback((actualValue, targetValue) => {
    const actual = Number(actualValue ?? 0);
    const target = Number(targetValue ?? 0);

    if (Number.isNaN(actual) || Number.isNaN(target)) {
      return "neutral";
    }

    if (actual < target) return "under";
    if (actual > target) return "over";
    return "on-target";
  }, []);

  const loadModels = useCallback(async () => {
    const response = await fetchData("dashboard/models", {}, "GET");
    if (response.error) {
      throw new Error(response.message);
    }
    const data = Array.isArray(response.data) ? response.data : [];
    setModels(data);
    if (!selectedModelId && data.length > 0) {
      setSelectedModelId(data[0].Id);
    }
  }, [selectedModelId]);

  const loadShifts = useCallback(async () => {
    const response = await fetchData("dashboard/shifts", {}, "GET");
    if (response.error) {
      throw new Error(response.message);
    }

    const data = Array.isArray(response.data) ? response.data : [];
    setShifts(data);
    if (!draftShiftId && data.length > 0) {
      const firstId = String(data[0].Id);
      setDraftShiftId(firstId);
      setSelectedShiftId(firstId);
    }
  }, [draftShiftId]);

  const loadDashboardData = useCallback(async (modelId) => {
    if (!modelId) return;
    const response = await fetchData(`dashboard/${modelId}`, {
      Date: selectedDate,
      ...(selectedShiftId ? { ShiftId: selectedShiftId } : {}),
    }, "GET");
    if (response.error) {
      throw new Error(response.message);
    }
    const data = response.data || null;
    setDashboardData(data);
    if (data?.ShiftId) {
      setSelectedShiftId(String(data.ShiftId));
      setDraftShiftId(String(data.ShiftId));
    }
    if (data?.FilterDate) {
      setSelectedDate(data.FilterDate);
      setDraftDate(data.FilterDate);
    }
    if (data?.FilterMonth) {
      setSelectedMonth(data.FilterMonth);
      setDraftMonth(data.FilterMonth);
    }
  }, [selectedDate, selectedShiftId]);

  useEffect(() => {
    setClock(new Date());
    const timer = setInterval(() => {
      setClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncViewport = () => {
      if (globalThis.window !== undefined) {
        setViewportWidth(globalThis.window.innerWidth);
      }
    };

    syncViewport();
    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener("resize", syncViewport);
      return () => globalThis.window.removeEventListener("resize", syncViewport);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await loadModels();
        await loadShifts();
      } catch (err) {
        Toast.error(err.message || "Failed to load dashboard models");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadModels, loadShifts]);

  useEffect(() => {
    if (!selectedModelId) return;
    const load = async () => {
      try {
        setLoading(true);
        await loadDashboardData(selectedModelId);
      } catch (err) {
        Toast.error(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedModelId, loadDashboardData]);

  useEffect(() => {
    const socket = io(socketBaseUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("dashboard:update", async () => {
      try {
        await loadModels();
        if (selectedModelId) {
          await loadDashboardData(selectedModelId);
        }
      } catch {
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [socketBaseUrl, selectedModelId, loadModels, loadDashboardData]);

  const handleApplyFilter = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedDate(draftDate);
      setSelectedShiftId(draftShiftId);

      if (selectedModelId) {
        const effectiveDate = draftMonth
          ? `${draftMonth}-${String(new Date(draftDate).getDate()).padStart(2, "0")}`
          : draftDate;
        const response = await fetchData(`dashboard/${selectedModelId}`, {
          Date: effectiveDate,
          ...(draftShiftId ? { ShiftId: draftShiftId } : {}),
        }, "GET");

        if (response.error) {
          throw new Error(response.message);
        }

        const data = response.data || null;
        setDashboardData(data);
        if (data?.ShiftId) {
          setSelectedShiftId(String(data.ShiftId));
          setDraftShiftId(String(data.ShiftId));
        }
        if (data?.FilterDate) {
          setSelectedDate(data.FilterDate);
          setDraftDate(data.FilterDate);
        }
        if (data?.FilterMonth) {
          setSelectedMonth(data.FilterMonth);
          setDraftMonth(data.FilterMonth);
        }
        setShowFilterPanel(false);
      }
    } catch (err) {
      Toast.error(err.message || "Failed to apply dashboard filter");
    } finally {
      setLoading(false);
    }
  }, [draftDate, draftShiftId, selectedModelId]);

  const parts = Array.isArray(dashboardData?.Parts) ? dashboardData.Parts : [];
  const sections = Array.isArray(dashboardData?.Sections) ? dashboardData.Sections : [];
  const planByPart = Array.isArray(dashboardData?.PlanByPart) ? dashboardData.PlanByPart : [];
  const monthlyPlanRows = Array.isArray(dashboardData?.MonthlyPlan) ? dashboardData.MonthlyPlan : [];
  const monthlyActualRows = Array.isArray(dashboardData?.MonthlyActual) ? dashboardData.MonthlyActual : [];
  const partPlanMap = parts.reduce((acc, part) => {
    acc[part.MpdId] = {
      planR: part.PlanR,
      planL: part.PlanL,
      finishR: part.FinishR,
      finishL: part.FinishL,
    };
    return acc;
  }, {});
  const partGroups = sections.reduce((acc, item) => {
    const existing = acc.find((part) => part.mpdId === item.MpdId);
    if (existing) {
      existing.sections.push(item);
    } else {
      acc.push({
        mpdId: item.MpdId,
        partCode: item.PartCode,
        partName: item.PartName,
        sections: [item],
      });
    }
    return acc;
  }, []);
  const isCompactLayout = viewportWidth < 1200;
  const formatShortDate = useCallback((value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  }, []);
  const normalizeDateKey = useCallback((value) => {
    if (!value) return "";
    if (typeof value === "string") {
      return value.slice(0, 10);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }, []);
  const monthlyPlanGroups = useMemo(() => {
    const grouped = [];
    monthlyPlanRows.forEach((row) => {
      const summaryDate = normalizeDateKey(row.SummaryDate);
      let group = grouped.find((item) => item.date === summaryDate);
      if (!group) {
        group = {
          date: summaryDate,
          parts: [],
        };
        grouped.push(group);
      }
      group.parts.push(row);
    });
    return grouped;
  }, [monthlyPlanRows, normalizeDateKey]);
  const monthlyActualGroups = useMemo(() => {
    const grouped = [];
    monthlyActualRows.forEach((row) => {
      const summaryDate = normalizeDateKey(row.SummaryDate);
      let group = grouped.find((item) => item.date === summaryDate);
      if (!group) {
        group = {
          date: summaryDate,
          parts: [],
        };
        grouped.push(group);
      }
      group.parts.push(row);
    });
    return grouped;
  }, [monthlyActualRows, normalizeDateKey]);
  const filteredModels = useMemo(() => {
    const keyword = modelSearch.trim().toLowerCase();
    if (!keyword) return models;

    return models.filter((model) =>
      [model.Code, model.LineCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [modelSearch, models]);
  const selectedDayPlanSummary = useMemo(() => {
    if (parts.length > 0) {
      const summaryFromParts = parts.reduce(
        (acc, part) => {
          acc.r += Number(part.PlanR ?? 0);
          acc.l += Number(part.PlanL ?? 0);
          return acc;
        },
        { r: 0, l: 0 }
      );

      return {
        ...summaryFromParts,
        total: summaryFromParts.r + summaryFromParts.l,
      };
    }

    const activeDate = normalizeDateKey(dashboardData?.FilterDate || selectedDate);
    const matchingRows = monthlyPlanRows.filter(
      (row) => normalizeDateKey(row.SummaryDate) === activeDate
    );

    if (matchingRows.length === 0) {
      return { r: 0, l: 0, total: 0 };
    }

    const fallbackSummary = matchingRows.reduce(
      (acc, part) => {
        acc.r += Number(part.QtyR ?? 0);
        acc.l += Number(part.QtyL ?? 0);
        return acc;
      },
      { r: 0, l: 0 }
    );

    return {
      ...fallbackSummary,
      total: fallbackSummary.r + fallbackSummary.l,
    };
  }, [dashboardData?.FilterDate, monthlyPlanRows, normalizeDateKey, parts, selectedDate]);
  const summary = parts.reduce(
    (acc, part) => {
      acc.planR += Number(part.PlanR ?? 0);
      acc.planL += Number(part.PlanL ?? 0);
      acc.currentR += Number(part.CurrentR ?? 0);
      acc.currentL += Number(part.CurrentL ?? 0);
      acc.finishR += Number(part.FinishR ?? 0);
      acc.finishL += Number(part.FinishL ?? 0);
      return acc;
    },
    {
      planR: 0,
      planL: 0,
      currentR: 0,
      currentL: 0,
      finishR: 0,
      finishL: 0,
    }
  );
  const minResult = parts.reduce(
    (acc, part) => {
      const finishR = Number(part.FinishR ?? 0);
      const finishL = Number(part.FinishL ?? 0);

      if (!Number.isNaN(finishR)) {
        acc.r = acc.r === null ? finishR : Math.min(acc.r, finishR);
      }

      if (!Number.isNaN(finishL)) {
        acc.l = acc.l === null ? finishL : Math.min(acc.l, finishL);
      }

      return acc;
    },
    { r: null, l: null }
  );

  return (
    <>
      <Loading loading={loading} message="Loading dashboard..." />
      <style jsx>{`
        .dashboard-shell {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hero-card {
          border: 1px solid #d9e5f2;
          background:
            linear-gradient(135deg, rgba(238, 245, 253, 0.96), rgba(250, 252, 255, 0.98)),
            linear-gradient(120deg, #f8fbff, #eef4fb);
          box-shadow: 0 14px 34px rgba(24, 95, 165, 0.08);
        }

        .hero-title {
          font-size: 1.45rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          color: #163a63;
        }

        .hero-subtitle {
          font-size: 13px;
          color: #66788d;
        }

        .hero-clock {
          min-width: 190px;
          border-radius: 16px;
          padding: 12px 16px;
          border: 1px solid #d7e4f2;
          background: rgba(255, 255, 255, 0.72);
        }

        .filter-icon-button {
          width: 42px;
          height: 42px;
          border: 1px solid #d7e4f2;
          border-radius: 14px;
          background: #ffffff;
          color: #185fa5;
          font-size: 18px;
          box-shadow: 0 10px 20px rgba(24, 95, 165, 0.08);
        }

        .filter-popover {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: min(320px, calc(100vw - 40px));
          padding: 16px;
          border: 1px solid #dbe5f0;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 38px rgba(20, 49, 82, 0.14);
          z-index: 20;
        }

        .model-toolbar {
          display: flex;
          align-items: stretch;
          gap: 12px;
          position: relative;
        }

        .model-toolbar .model-chip-wrap {
          flex: 1 1 auto;
        }

        .model-selector {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .filter-popover-title {
          font-size: 14px;
          font-weight: 700;
          color: #163a63;
          margin-bottom: 12px;
        }

        .meta-card {
          border: 1px solid #dde6f1;
          border-radius: 18px;
          background: linear-gradient(180deg, #ffffff, #f7faff);
          box-shadow: 0 10px 26px rgba(24, 95, 165, 0.06);
        }

        .meta-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6b7f98;
        }

        .meta-value {
          font-size: 1rem;
          font-weight: 700;
          color: #163a63;
        }

        .model-chip-wrap {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
          scrollbar-color: #b8cbe1 #edf4fb;
        }

        .model-chip-wrap::-webkit-scrollbar {
          height: 8px;
        }

        .model-chip-wrap::-webkit-scrollbar-track {
          background: #edf4fb;
          border-radius: 999px;
        }

        .model-chip-wrap::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #b4c9df, #8fb0d1);
          border-radius: 999px;
        }

        .model-chip-wrap::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #9db9d5, #7fa4ca);
        }

        .model-search-field {
          margin-bottom: 0;
        }

        .model-search-field :global(.form-control) {
          border-color: #d7e4f2;
          border-radius: 12px;
          color: #244769;
        }

        .model-search-empty {
          font-size: 12px;
          color: #6d8096;
          padding: 6px 2px 0;
        }

        .model-chip {
          flex: 0 0 auto;
          min-width: 92px;
          border: 1px solid #cfddee;
          border-radius: 999px;
          background: #fff;
          color: #4d6480;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 8px 16px;
          text-align: center;
          white-space: nowrap;
          transition: all 0.16s ease;
        }

        .model-chip.active {
          background: linear-gradient(135deg, #185fa5, #2d79c5);
          border-color: #185fa5;
          color: #fff;
          box-shadow: 0 10px 20px rgba(24, 95, 165, 0.22);
        }

        .filter-field {
          min-width: 0;
        }

        .filter-label {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #59718d;
        }

        .filter-input {
          width: 100%;
          height: 40px;
          border: 1px solid #d7e4f2;
          border-radius: 12px;
          padding: 0 12px;
          font-size: 13px;
          color: #244769;
          background: #fff;
        }

        .filter-button {
          height: 40px;
          border: none;
          border-radius: 12px;
          padding: 0 18px;
          background: linear-gradient(135deg, #185fa5, #2d79c5);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 10px 20px rgba(24, 95, 165, 0.2);
        }

        .filter-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .stat-card {
          border: 1px solid #dde6f0;
          border-radius: 18px;
          padding: 16px;
          background: #fff;
          box-shadow: 0 10px 24px rgba(24, 95, 165, 0.05);
        }

        .stat-card.plan {
          background: linear-gradient(180deg, #edf4fd, #ffffff);
        }

        .stat-card.plan-detail {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .stat-card.current {
          background: linear-gradient(180deg, #f4f7fc, #ffffff);
        }

        .stat-card.finish {
          background: linear-gradient(180deg, #f7f1e8, #ffffff);
        }

        .stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6d8096;
          margin-bottom: 10px;
        }

        .stat-values {
          display: flex;
          gap: 18px;
        }

        .stat-values.three-col {
          justify-content: space-between;
        }

        .plan-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .plan-breakdown-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) repeat(3, minmax(54px, auto));
          gap: 10px;
          align-items: center;
          padding-top: 8px;
          border-top: 1px dashed #d8e4f3;
        }

        .plan-breakdown-part {
          min-width: 0;
        }

        .plan-breakdown-code {
          font-size: 12px;
          font-weight: 700;
          color: #244769;
        }

        .plan-breakdown-name {
          font-size: 11px;
          color: #73859a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .plan-breakdown-metric {
          text-align: center;
        }

        .plan-breakdown-metric-label {
          font-size: 10px;
          color: #7688a0;
        }

        .plan-breakdown-metric-value {
          font-size: 13px;
          font-weight: 700;
          color: #163a63;
        }

        .stat-side {
          min-width: 60px;
        }

        .stat-side-label {
          font-size: 11px;
          color: #788aa0;
        }

        .stat-side-value {
          font-size: 1.28rem;
          font-weight: 800;
          color: #163a63;
          line-height: 1.1;
        }

        .matrix-card {
          border: 1px solid #dde6f0;
          border-radius: 22px;
          background: linear-gradient(180deg, #ffffff, #f8fbff);
          box-shadow: 0 16px 36px rgba(24, 95, 165, 0.07);
        }

        .view-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .view-tab {
          border: 1px solid #d7e4f2;
          border-radius: 999px;
          background: #fff;
          color: #47637f;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
        }

        .view-tab.active {
          background: linear-gradient(135deg, #185fa5, #2d79c5);
          border-color: #185fa5;
          color: #fff;
          box-shadow: 0 10px 18px rgba(24, 95, 165, 0.18);
        }

        .matrix-title {
          font-size: 1rem;
          font-weight: 700;
          color: #163a63;
        }

        .matrix-subtitle {
          font-size: 12px;
          color: #6d8096;
        }

        .matrix-table {
          min-width: 980px;
          border-collapse: separate;
          border-spacing: 0;
          overflow: hidden;
        }

        .matrix-table th,
        .matrix-table td {
          border: 1px solid #dbe5f0;
          padding: 8px 10px;
        }

        .matrix-table thead th {
          font-size: 12px;
          font-weight: 700;
          color: #244769;
        }

        .sticky-col {
          position: sticky;
          left: 0;
          z-index: 3;
          background: #f7faff;
          width: 140px;
          min-width: 120px;
          text-align: center;
          vertical-align: middle;
        }

        .sticky-col.side {
          left: 120px;
          z-index: 3;
          background: #f7faff;
          width: 84px;
          min-width: 72px;
          text-align: center;
          vertical-align: middle;
        }

        .group-head {
          background: linear-gradient(180deg, #eaf3ff, #e1edf9);
          color: #163a63;
        }

        .section-head {
          background: #f8fbff;
        }

        .metric-label {
          font-weight: 800;
          color: #163a63;
          width: 140px;
          min-width: 140px;
          text-align: center;
          vertical-align: middle;
          font-size: 14px;
        }

        .side-label-cell {
          width: 84px;
          min-width: 84px;
          font-weight: 700;
          color: #4f6480;
          text-align: center;
          vertical-align: middle;
          font-size: 14px;
        }

        .matrix-table thead .sticky-col,
        .matrix-table thead .sticky-col.side {
          font-size: 13px;
          font-weight: 800;
          text-align: center;
          vertical-align: middle;
        }

        .row-plan td {
          background: #edf4fd;
        }

        .row-plan .sticky-col,
        .row-plan .sticky-col.side {
          background: #e7f0fb;
        }

        .row-current td {
          background: #f5f8fd;
        }

        .row-current .sticky-col,
        .row-current .sticky-col.side {
          background: #eef3fb;
        }

        .row-finish td {
          background: #f7f1e9;
        }

        .row-finish .sticky-col,
        .row-finish .sticky-col.side {
          background: #f1e7d9;
        }

        .row-uncomplete td {
          background: #f8f5fb;
        }

        .row-uncomplete .sticky-col,
        .row-uncomplete .sticky-col.side {
          background: #efe9f7;
        }

        .value-cell {
          text-align: center;
          font-weight: 700;
          color: #203b5a;
          min-width: 74px;
        }

        .value-cell.zero {
          color: #c24848;
        }

        .value-cell.muted {
          color: #91a0b2;
          font-weight: 600;
        }

        .status-cell {
          position: relative;
        }

        .status-under {
          background: #fff1f1 !important;
          color: #b43d3d;
        }

        .status-on-target {
          background: #eef7f0 !important;
          color: #2e6a46;
        }

        .status-over {
          background: #fff3e8 !important;
          color: #b7651d;
        }

        .status-neutral {
          background: #f6f8fb !important;
        }

        .legend-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .legend-label {
          font-size: 12px;
          font-weight: 700;
          color: #5c728d;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border: 1px solid #dde6f0;
          border-radius: 999px;
          background: #fff;
          font-size: 12px;
          color: #49627e;
        }

        .legend-swatch {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          border: 1px solid rgba(32, 59, 90, 0.12);
        }

        .legend-swatch.under {
          background: #fff1f1;
        }

        .legend-swatch.on-target {
          background: #eef7f0;
        }

        .legend-swatch.over {
          background: #fff3e8;
        }

        .compact-part {
          border: 1px solid #dde6f0;
          border-radius: 18px;
          padding: 14px;
          background: linear-gradient(180deg, #ffffff, #f8fbff);
          box-shadow: 0 10px 22px rgba(24, 95, 165, 0.05);
        }

        .compact-part-title {
          font-size: 13px;
          font-weight: 700;
          color: #163a63;
        }

        .compact-table thead th {
          background: #eef4fb;
          font-size: 12px;
          color: #244769;
        }

        .compact-table td {
          font-size: 12px;
        }

        .summary-table th {
          background: #eef4fb;
          color: #244769;
          font-size: 12px;
        }

        .summary-table td {
          font-size: 13px;
        }

        .summary-scroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .summary-wide-table {
          min-width: 960px;
          white-space: nowrap;
        }

        @media (max-width: 991px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-shell">
      <div className="card hero-card border-0">
        <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="hero-title">Production Planning & Stock Dashboard</div>
            <p className="mb-0 hero-subtitle">
              Provides real-time visibility of production plans, ongoing stock levels, and finished stock across models.
            </p>
          </div>
          <div className="hero-clock text-end">
            <div className="fw-semibold" style={{ fontSize: 24, color: "#163a63" }}>
              {clock ? formatClock(clock) : "--:--:--"}
            </div>
            <div style={{ fontSize: 13, color: "#6b7f98" }}>
              {clock ? formatDate(clock) : "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="model-toolbar">
            <div className="model-selector">
              <Input
                name="dashboardModelSearch"
                id="dashboardModelSearch"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Search model or line"
                className="model-search-field"
                size="lg"
                autoComplete="off"
              />
              <div className="model-chip-wrap">
                {filteredModels.map((model) => (
                  <button
                    key={model.Id}
                    type="button"
                    className={`model-chip ${selectedModelId === model.Id ? "active" : ""}`}
                    onClick={() => setSelectedModelId(model.Id)}
                  >
                    {model.Code}
                  </button>
                ))}
              </div>
              {filteredModels.length === 0 && (
                <div className="model-search-empty">
                  No model matches your search.
                </div>
              )}
            </div>
            <button
              type="button"
              className="filter-icon-button"
              aria-label="Open dashboard filter"
              title="Filter Dashboard"
              onClick={() => setShowFilterPanel((prev) => !prev)}
            >
              <i className="bi bi-funnel-fill" />
            </button>
            {showFilterPanel && (
              <div className="filter-popover">
                <div className="filter-popover-title">Dashboard Filter</div>
                <div className="filter-stack">
                  <div className="filter-field">
                    <label className="filter-label" htmlFor="dashboardDate">Date</label>
                    <input
                      id="dashboardDate"
                      type="date"
                      className="filter-input"
                      value={draftDate}
                      onChange={(e) => setDraftDate(e.target.value)}
                    />
                  </div>

                  <div className="filter-field">
                    <label className="filter-label" htmlFor="dashboardMonth">Month</label>
                    <input
                      id="dashboardMonth"
                      type="month"
                      className="filter-input"
                      value={draftMonth}
                      onChange={(e) => {
                        setDraftMonth(e.target.value);
                        if (e.target.value) {
                          setDraftDate(`${e.target.value}-01`);
                        }
                      }}
                    />
                  </div>

                  <div className="filter-field">
                    <label className="filter-label" htmlFor="dashboardShift">Shift</label>
                    <select
                      id="dashboardShift"
                      className="filter-input"
                      value={draftShiftId}
                      onChange={(e) => setDraftShiftId(e.target.value)}
                    >
                      {shifts.map((shift) => (
                        <option key={shift.Id} value={shift.Id}>
                          {shift.Code} - {shift.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="filter-button"
                    onClick={handleApplyFilter}
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {dashboardData && (
        <>
          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <div className="card meta-card border-0 h-100">
                <div className="card-body">
                  <div className="meta-label mb-1">Model</div>
                  <div className="meta-value">{dashboardData.ModelCode}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card meta-card border-0 h-100">
                <div className="card-body">
                  <div className="meta-label mb-1">Line</div>
                  <div className="meta-value">{dashboardData.LineCode || "-"}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card meta-card border-0 h-100">
                <div className="card-body">
                  <div className="meta-label mb-1">Current Shift</div>
                  <div className="meta-value">
                    {dashboardData.ShiftCode} - {dashboardData.ShiftName}
                  </div>
                  <div style={{ fontSize: 12, color: "#6d8096" }}>
                    {dashboardData.ShiftStart} - {dashboardData.ShiftEnd}
                  </div>
                  <div style={{ fontSize: 12, color: "#6d8096" }}>
                    Date: {dashboardData.FilterDate || selectedDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card plan plan-detail">
              <div className="stat-label">Plan</div>
              <div className="plan-breakdown-list">
                {planByPart.map((part) => (
                  <div key={`plan-breakdown-${part.MpdId}`} className="plan-breakdown-row">
                    <div className="plan-breakdown-part">
                      <div className="plan-breakdown-code">{part.PartCode}</div>
                      <div className="plan-breakdown-name">{part.PartName}</div>
                    </div>
                    <div className="plan-breakdown-metric">
                      <div className="plan-breakdown-metric-label">R</div>
                      <div className="plan-breakdown-metric-value">{formatNumber(part.QtyR)}</div>
                    </div>
                    <div className="plan-breakdown-metric">
                      <div className="plan-breakdown-metric-label">L</div>
                      <div className="plan-breakdown-metric-value">{formatNumber(part.QtyL)}</div>
                    </div>
                    <div className="plan-breakdown-metric">
                      <div className="plan-breakdown-metric-label">Total</div>
                      <div className="plan-breakdown-metric-value">{formatNumber(part.Total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stat-card finish plan-detail">
              <div className="stat-label">Result</div>
              <div className="plan-breakdown-list">
                {parts.map((part) => (
                  <div key={`uncomplete-breakdown-${part.MpdId}`} className="plan-breakdown-row">
                    <div className="plan-breakdown-part">
                      <div className="plan-breakdown-code">{part.PartCode}</div>
                      <div className="plan-breakdown-name">{part.PartName}</div>
                    </div>
                    <div className="plan-breakdown-metric">
                      <div className="plan-breakdown-metric-label">R</div>
                      <div className="plan-breakdown-metric-value">{formatNumber(part.FinishR ?? 0)}</div>
                    </div>
                    <div className="plan-breakdown-metric">
                      <div className="plan-breakdown-metric-label">L</div>
                      <div className="plan-breakdown-metric-value">{formatNumber(part.FinishL ?? 0)}</div>
                    </div>
                    <div className="plan-breakdown-metric">
                      <div className="plan-breakdown-metric-label">Total</div>
                      <div className="plan-breakdown-metric-value">
                        {formatNumber(Number(part.FinishR ?? 0) + Number(part.FinishL ?? 0))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card matrix-card border-0">
            <div className="card-body">
              <div className="view-tabs">
                <button
                  type="button"
                  className={`view-tab ${activeView === "matrix" ? "active" : ""}`}
                  onClick={() => setActiveView("matrix")}
                >
                  Production Matrix
                </button>
                <button
                  type="button"
                  className={`view-tab ${activeView === "monthly-plan" ? "active" : ""}`}
                  onClick={() => setActiveView("monthly-plan")}
                >
                  Monthly Plan Summary
                </button>
                <button
                  type="button"
                  className={`view-tab ${activeView === "monthly-actual" ? "active" : ""}`}
                  onClick={() => setActiveView("monthly-actual")}
                >
                  Monthly Actual Summary
                </button>
              </div>

              {activeView === "matrix" && (
                <>
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                <div>
                  <div className="matrix-title">Production Matrix</div>
                  <div className="matrix-subtitle">
                    Section-by-section view for plan, current stock, and finish result.
                  </div>
                </div>
                <div className="matrix-subtitle">
                  {partGroups.length} part group{partGroups.length === 1 ? "" : "s"} • {sections.length} section{sections.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="legend-wrap mb-3">
                <div className="legend-label">Status Legend</div>
                <div className="legend-item">
                  <span className="legend-swatch under" />
                  Below Target
                </div>
                <div className="legend-item">
                  <span className="legend-swatch on-target" />
                  On Target
                </div>
                <div className="legend-item">
                  <span className="legend-swatch over" />
                  Above Target
                </div>
              </div>

              {!isCompactLayout && (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0 matrix-table">
                    <thead>
                      <tr>
                        <th rowSpan={2} className="sticky-col">Metric</th>
                        <th rowSpan={2} className="text-center sticky-col side">Side</th>
                        {partGroups.length === 0 ? (
                          <th className="text-center group-head">No Part</th>
                        ) : (
                          partGroups.map((part) => (
                            <th
                              key={`part-${part.mpdId}`}
                              className="text-center group-head"
                              colSpan={part.sections.length}
                            >
                              {part.partCode} - {part.partName}
                            </th>
                          ))
                        )}
                      </tr>
                      <tr>
                        {partGroups.length === 0 ? (
                          <th className="text-center section-head">-</th>
                        ) : (
                          partGroups.flatMap((part) =>
                            part.sections.map((section) => (
                              <th key={`section-${section.MpsdId}`} className="text-center section-head">
                                <div>{section.SectionCode}</div>
                                <div style={{ fontSize: 10, color: "#738279", fontWeight: 600 }}>
                                  Seq {section.Sequence}
                                </div>
                              </th>
                            ))
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sections.length === 0 ? (
                        <tr>
                          <td colSpan={partGroups.length ? partGroups.reduce((sum, part) => sum + part.sections.length, 0) + 2 : 3} className="text-center text-secondary">
                            No section stock data.
                          </td>
                        </tr>
                      ) : (
                        <>
                          <tr className="row-plan">
                            <td rowSpan={2} className="metric-label sticky-col">Plan</td>
                            <td className="text-center side-label-cell sticky-col side">R</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section) => (
                                <td
                                  key={`plan-r-${section.MpsdId}`}
                                  className={`value-cell ${(partPlanMap[part.mpdId]?.planR ?? 0) === 0 ? "zero" : ""}`}
                                >
                                  {formatNumber(partPlanMap[part.mpdId]?.planR ?? 0)}
                                </td>
                              ))
                            )}
                          </tr>
                          <tr className="row-plan">
                            <td className="text-center side-label-cell sticky-col side">L</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section) => (
                                <td
                                  key={`plan-l-${section.MpsdId}`}
                                  className={`value-cell ${(partPlanMap[part.mpdId]?.planL ?? 0) === 0 ? "zero" : ""}`}
                                >
                                  {formatNumber(partPlanMap[part.mpdId]?.planL ?? 0)}
                                </td>
                              ))
                            )}
                          </tr>
                          <tr className="row-current">
                            <td rowSpan={2} className="metric-label sticky-col">Current</td>
                            <td className="text-center side-label-cell sticky-col side">R</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section) => (
                                <td
                                  key={`current-r-${section.MpsdId}`}
                                  className={`value-cell status-cell status-${getStatusTone(
                                    section.CurrentR,
                                    partPlanMap[part.mpdId]?.planR ?? 0
                                  )}`}
                                >
                                  {formatNumber(section.CurrentR)}
                                </td>
                              ))
                            )}
                          </tr>
                          <tr className="row-current">
                            <td className="text-center side-label-cell sticky-col side">L</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section) => (
                                <td
                                  key={`current-l-${section.MpsdId}`}
                                  className={`value-cell status-cell status-${getStatusTone(
                                    section.CurrentL,
                                    partPlanMap[part.mpdId]?.planL ?? 0
                                  )}`}
                                >
                                  {formatNumber(section.CurrentL)}
                                </td>
                              ))
                            )}
                          </tr>
                          <tr className="row-finish">
                            <td rowSpan={2} className="metric-label sticky-col">Result</td>
                            <td className="text-center side-label-cell sticky-col side">R</td>
                            {partGroups.map((part) => (
                              <td
                                key={`finish-r-${part.mpdId}`}
                                colSpan={part.sections.length}
                                className={`value-cell status-cell status-${getStatusTone(
                                  partPlanMap[part.mpdId]?.finishR ?? 0,
                                  partPlanMap[part.mpdId]?.planR ?? 0
                                )}`}
                              >
                                {formatNumber(partPlanMap[part.mpdId]?.finishR ?? 0)}
                              </td>
                            ))}
                          </tr>
                          <tr className="row-finish">
                            <td className="text-center side-label-cell sticky-col side">L</td>
                            {partGroups.map((part) => (
                              <td
                                key={`finish-l-${part.mpdId}`}
                                colSpan={part.sections.length}
                                className={`value-cell status-cell status-${getStatusTone(
                                  partPlanMap[part.mpdId]?.finishL ?? 0,
                                  partPlanMap[part.mpdId]?.planL ?? 0
                                )}`}
                              >
                                {formatNumber(partPlanMap[part.mpdId]?.finishL ?? 0)}
                              </td>
                            ))}
                          </tr>
                          <tr className="row-uncomplete">
                            <td rowSpan={2} className="metric-label sticky-col">Part Complete</td>
                            <td className="text-center side-label-cell sticky-col side">R</td>
                            <td
                              colSpan={partGroups.reduce((sum, part) => sum + part.sections.length, 0)}
                              className="value-cell"
                            >
                              {formatNumber(minResult.r ?? 0)}
                            </td>
                          </tr>
                          <tr className="row-uncomplete">
                            <td className="text-center side-label-cell sticky-col side">L</td>
                            <td
                              colSpan={partGroups.reduce((sum, part) => sum + part.sections.length, 0)}
                              className="value-cell"
                            >
                              {formatNumber(minResult.l ?? 0)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {isCompactLayout && (
                <div className="d-flex flex-column gap-3">
                  {partGroups.length === 0 ? (
                    <div className="text-secondary" style={{ fontSize: 13 }}>
                      No section stock data.
                    </div>
                  ) : (
                    partGroups.map((part) => (
                      <div key={`compact-${part.mpdId}`} className="compact-part">
                        <div className="compact-part-title mb-2">
                          {part.partCode} - {part.partName}
                        </div>
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered align-middle mb-0 compact-table">
                            <thead>
                              <tr>
                                <th>Section</th>
                                <th className="text-center">Side</th>
                                <th className="text-center">Plan</th>
                                <th className="text-center">Current</th>
                                <th className="text-center">Result</th>
                                <th className="text-center">Part Complete</th>
                              </tr>
                            </thead>
                            <tbody>
                              {part.sections.flatMap((section, index) => ([
                                <tr key={`compact-${section.MpsdId}-R`}>
                                  <td rowSpan={2}>
                                    {section.SectionCode} - {section.SectionName}
                                    <div style={{ fontSize: 10, color: "#718176" }}>
                                      Seq {section.Sequence}
                                    </div>
                                  </td>
                                  <td className="text-center">R</td>
                                  <td className="text-center">{formatNumber(partPlanMap[part.mpdId]?.planR ?? 0)}</td>
                                  <td className={`text-center status-${getStatusTone(
                                    section.CurrentR,
                                    partPlanMap[part.mpdId]?.planR ?? 0
                                  )}`}>{formatNumber(section.CurrentR)}</td>
                                  <td className={`text-center ${index === part.sections.length - 1
                                    ? `status-${getStatusTone(
                                        partPlanMap[part.mpdId]?.finishR ?? 0,
                                        partPlanMap[part.mpdId]?.planR ?? 0
                                      )}`
                                    : ""}`}>
                                    {index === part.sections.length - 1 ? formatNumber(partPlanMap[part.mpdId]?.finishR ?? 0) : "-"}
                                  </td>
                                  <td className={`text-center ${index === 0 ? `status-${getStatusTone(
                                    minResult.r ?? 0,
                                    summary.planR
                                  )}` : ""}`}>
                                    {index === 0 ? formatNumber(minResult.r ?? 0) : "-"}
                                  </td>
                                </tr>,
                                <tr key={`compact-${section.MpsdId}-L`}>
                                  <td className="text-center">L</td>
                                  <td className="text-center">{formatNumber(partPlanMap[part.mpdId]?.planL ?? 0)}</td>
                                  <td className={`text-center status-${getStatusTone(
                                    section.CurrentL,
                                    partPlanMap[part.mpdId]?.planL ?? 0
                                  )}`}>{formatNumber(section.CurrentL)}</td>
                                  <td className={`text-center ${index === part.sections.length - 1
                                    ? `status-${getStatusTone(
                                        partPlanMap[part.mpdId]?.finishL ?? 0,
                                        partPlanMap[part.mpdId]?.planL ?? 0
                                      )}`
                                    : ""}`}>
                                    {index === part.sections.length - 1 ? formatNumber(partPlanMap[part.mpdId]?.finishL ?? 0) : "-"}
                                  </td>
                                  <td className={`text-center ${index === 0 ? `status-${getStatusTone(
                                    minResult.l ?? 0,
                                    summary.planL
                                  )}` : ""}`}>
                                    {index === 0 ? formatNumber(minResult.l ?? 0) : "-"}
                                  </td>
                                </tr>,
                              ]))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
                </>
              )}

              {activeView === "monthly-plan" && (
                <>
                  <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                    <div>
                      <div className="matrix-title">Monthly Plan Summary</div>
                      <div className="matrix-subtitle">
                        Daily plan summary by part for {selectedMonth} based on the selected shift.
                      </div>
                    </div>
                  </div>
                  <div className="summary-scroll">
                    <table className="table table-bordered align-middle mb-0 summary-table summary-wide-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          {monthlyPlanGroups.map((group) => (
                            <th
                              key={`plan-head-${group.date}`}
                              className="text-center"
                              colSpan={group.parts.length}
                            >
                              {formatShortDate(group.date)}
                            </th>
                          ))}
                        </tr>
                        <tr>
                          <th>Part</th>
                          {monthlyPlanGroups.flatMap((group) =>
                            group.parts.map((part) => (
                              <th key={`plan-part-${group.date}-${part.MpdId}`} className="text-center">
                                {part.PartCode}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-semibold">Plan R</td>
                          {monthlyPlanGroups.flatMap((group) =>
                            group.parts.map((part) => (
                            <td key={`plan-r-${group.date}-${part.MpdId}`} className="text-center">
                              {formatNumber(part.QtyR)}
                            </td>
                            ))
                          )}
                        </tr>
                        <tr>
                          <td className="fw-semibold">Plan L</td>
                          {monthlyPlanGroups.flatMap((group) =>
                            group.parts.map((part) => (
                            <td key={`plan-l-${group.date}-${part.MpdId}`} className="text-center">
                              {formatNumber(part.QtyL)}
                            </td>
                            ))
                          )}
                        </tr>
                        <tr>
                          <td className="fw-semibold">Total</td>
                          {monthlyPlanGroups.flatMap((group) =>
                            group.parts.map((part) => (
                            <td key={`plan-total-${group.date}-${part.MpdId}`} className="text-center">
                              {formatNumber(Number(part.QtyR || 0) + Number(part.QtyL || 0))}
                            </td>
                            ))
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeView === "monthly-actual" && (
                <>
                  <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                    <div>
                      <div className="matrix-title">Monthly Actual Summary</div>
                      <div className="matrix-subtitle">
                        Latest actual result by part and day for {selectedMonth} based on the selected shift.
                      </div>
                    </div>
                  </div>
                  <div className="summary-scroll">
                    <table className="table table-bordered align-middle mb-0 summary-table summary-wide-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          {monthlyActualGroups.map((group) => (
                            <th
                              key={`actual-head-${group.date}`}
                              className="text-center"
                              colSpan={group.parts.length}
                            >
                              {formatShortDate(group.date)}
                            </th>
                          ))}
                        </tr>
                        <tr>
                          <th>Part</th>
                          {monthlyActualGroups.flatMap((group) =>
                            group.parts.map((part) => (
                              <th key={`actual-part-${group.date}-${part.MpdId}`} className="text-center">
                                {part.PartCode}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-semibold">Actual R</td>
                          {monthlyActualGroups.flatMap((group) =>
                            group.parts.map((part) => (
                            <td key={`actual-r-${group.date}-${part.MpdId}`} className="text-center">
                              {formatNumber(part.QtyR)}
                            </td>
                            ))
                          )}
                        </tr>
                        <tr>
                          <td className="fw-semibold">Actual L</td>
                          {monthlyActualGroups.flatMap((group) =>
                            group.parts.map((part) => (
                            <td key={`actual-l-${group.date}-${part.MpdId}`} className="text-center">
                              {formatNumber(part.QtyL)}
                            </td>
                            ))
                          )}
                        </tr>
                        <tr>
                          <td className="fw-semibold">Total</td>
                          {monthlyActualGroups.flatMap((group) =>
                            group.parts.map((part) => (
                            <td key={`actual-total-${group.date}-${part.MpdId}`} className="text-center">
                              {formatNumber(Number(part.QtyR || 0) + Number(part.QtyL || 0))}
                            </td>
                            ))
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && !dashboardData && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-secondary" style={{ fontSize: 13 }}>
            Select a model to view dashboard data.
          </div>
        </div>
      )}
      </div>
    </>
  );
}
