"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import fetchData, { API_BASE_URL } from "@/lib/fetch";
import Toast from "@/component/common/Toast";
import Loading from "@/component/common/Loading";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [clock, setClock] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(1280);

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

  const loadDashboardData = useCallback(async (modelId) => {
    if (!modelId) return;
    const response = await fetchData(`dashboard/${modelId}`, {}, "GET");
    if (response.error) {
      throw new Error(response.message);
    }
    setDashboardData(response.data || null);
  }, []);

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
      } catch (err) {
        Toast.error(err.message || "Failed to load dashboard models");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadModels]);

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

  const parts = Array.isArray(dashboardData?.Parts) ? dashboardData.Parts : [];
  const sections = Array.isArray(dashboardData?.Sections) ? dashboardData.Sections : [];
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

  return (
    <>
      <Loading loading={loading} message="Loading dashboard..." />
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h4 className="mb-1">Realtime Production Dashboard</h4>
            <p className="mb-0 text-secondary" style={{ fontSize: 13 }}>
              Live monitoring for plan, current stock, and finish stock by model.
            </p>
          </div>
          <div className="text-end">
            <div className="fw-semibold" style={{ fontSize: 22 }}>
              {clock ? formatClock(clock) : "--:--:--"}
            </div>
            <div className="text-secondary" style={{ fontSize: 13 }}>
              {clock ? formatDate(clock) : "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 overflow-auto pb-1">
            {models.map((model) => (
              <button
                key={model.Id}
                type="button"
                className={`btn btn-sm rounded-pill px-3 ${selectedModelId === model.Id ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setSelectedModelId(model.Id)}
              >
                {model.Code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {dashboardData && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary mb-1" style={{ fontSize: 12 }}>Model</div>
                  <div className="fw-semibold">{dashboardData.ModelCode}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary mb-1" style={{ fontSize: 12 }}>Line</div>
                  <div className="fw-semibold">{dashboardData.LineCode || "-"}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary mb-1" style={{ fontSize: 12 }}>Current Shift</div>
                  <div className="fw-semibold">
                    {dashboardData.ShiftCode} - {dashboardData.ShiftName}
                  </div>
                  <div className="text-secondary" style={{ fontSize: 12 }}>
                    {dashboardData.ShiftStart} - {dashboardData.ShiftEnd}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="mb-3">Plan & Current Stock Matrix</h6>

              {!isCompactLayout && (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle">
                    <thead>
                      <tr>
                        <th rowSpan={2}>Metric</th>
                        <th className="text-center">Side</th>
                        {partGroups.length === 0 ? (
                          <th className="text-center">No Part</th>
                        ) : (
                          partGroups.map((part) => (
                            <th
                              key={`part-${part.mpdId}`}
                              className="text-center"
                              colSpan={part.sections.length}
                            >
                              {part.partCode} - {part.partName}
                            </th>
                          ))
                        )}
                      </tr>
                      <tr>
                        <th className="text-center">-</th>
                        {partGroups.length === 0 ? (
                          <th className="text-center">-</th>
                        ) : (
                          partGroups.flatMap((part) =>
                            part.sections.map((section) => (
                              <th key={`section-${section.MpsdId}`} className="text-center">
                                {section.SectionCode}
                              </th>
                            ))
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sections.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-secondary">No section stock data.</td>
                        </tr>
                      ) : (
                        <>
                          <tr>
                            <td rowSpan={2} className="fw-semibold">Plan</td>
                            <td className="text-center fw-semibold">R</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section) => (
                                <td key={`plan-r-${section.MpsdId}`} className="text-center">
                                  {partPlanMap[part.mpdId]?.planR ?? 0}
                                </td>
                              ))
                            )}
                          </tr>
                          <tr>
                            <td className="text-center fw-semibold">L</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section) => (
                                <td key={`plan-l-${section.MpsdId}`} className="text-center">
                                  {partPlanMap[part.mpdId]?.planL ?? 0}
                                </td>
                              ))
                            )}
                          </tr>
                          <tr>
                            <td rowSpan={2} className="fw-semibold">Current</td>
                            <td className="text-center fw-semibold">R</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section) => (
                                <td key={`current-r-${section.MpsdId}`} className="text-center">
                                  {section.CurrentR}
                                </td>
                              ))
                            )}
                          </tr>
                          <tr>
                            <td className="text-center fw-semibold">L</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section) => (
                                <td key={`current-l-${section.MpsdId}`} className="text-center">
                                  {section.CurrentL}
                                </td>
                              ))
                            )}
                          </tr>
                          <tr>
                            <td rowSpan={2} className="fw-semibold">Finish</td>
                            <td className="text-center fw-semibold">R</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section, sectionIndex) => (
                                <td key={`finish-r-${section.MpsdId}`} className="text-center">
                                  {sectionIndex === part.sections.length - 1
                                    ? (partPlanMap[part.mpdId]?.finishR ?? 0)
                                    : "-"}
                                </td>
                              ))
                            )}
                          </tr>
                          <tr>
                            <td className="text-center fw-semibold">L</td>
                            {partGroups.flatMap((part) =>
                              part.sections.map((section, sectionIndex) => (
                                <td key={`finish-l-${section.MpsdId}`} className="text-center">
                                  {sectionIndex === part.sections.length - 1
                                    ? (partPlanMap[part.mpdId]?.finishL ?? 0)
                                    : "-"}
                                </td>
                              ))
                            )}
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
                      <div key={`compact-${part.mpdId}`} className="border rounded p-2">
                        <div className="fw-semibold mb-2" style={{ fontSize: 13 }}>
                          {part.partCode} - {part.partName}
                        </div>
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered align-middle mb-0">
                            <thead>
                              <tr>
                                <th>Section</th>
                                <th className="text-center">Side</th>
                                <th className="text-center">Plan</th>
                                <th className="text-center">Current</th>
                                <th className="text-center">Finish</th>
                              </tr>
                            </thead>
                            <tbody>
                              {part.sections.flatMap((section, index) => ([
                                <tr key={`compact-${section.MpsdId}-R`}>
                                  <td rowSpan={2}>{section.SectionCode} - {section.SectionName}</td>
                                  <td className="text-center">R</td>
                                  <td className="text-center">{partPlanMap[part.mpdId]?.planR ?? 0}</td>
                                  <td className="text-center">{section.CurrentR}</td>
                                  <td className="text-center">
                                    {index === part.sections.length - 1 ? (partPlanMap[part.mpdId]?.finishR ?? 0) : "-"}
                                  </td>
                                </tr>,
                                <tr key={`compact-${section.MpsdId}-L`}>
                                  <td className="text-center">L</td>
                                  <td className="text-center">{partPlanMap[part.mpdId]?.planL ?? 0}</td>
                                  <td className="text-center">{section.CurrentL}</td>
                                  <td className="text-center">
                                    {index === part.sections.length - 1 ? (partPlanMap[part.mpdId]?.finishL ?? 0) : "-"}
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
    </>
  );
}
