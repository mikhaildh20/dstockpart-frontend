"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Breadcrumb from "@/component/common/Breadcrumb";
import Table from "@/component/common/Table";
import Button from "@/component/common/Button";
import Toast from "@/component/common/Toast";
import Loading from "@/component/common/Loading";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";

function SortableSectionItem({ id, code, name, sequence }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="d-flex align-items-center justify-content-between border rounded px-3 py-2 bg-white"
    >
      <div className="d-flex align-items-center gap-3">
        <span className="badge text-bg-primary">{sequence}</span>
        <div>
          <div className="fw-semibold" style={{ fontSize: 13 }}>
            {code}
          </div>
          <div className="text-secondary" style={{ fontSize: 12 }}>
            {name}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-sm btn-light border"
        {...attributes}
        {...listeners}
        title="Drag to change sequence"
        aria-label={`Drag ${code}`}
      >
        <i className="bi bi-list" />
      </button>
    </div>
  );
}

export default function PartDetailPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("Part Detail");
  const [mpdId, setMpdId] = useState(null);
  const [sectionRows, setSectionRows] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [sequenceOrder, setSequenceOrder] = useState([]);
  const [initialSelected, setInitialSelected] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const syncSelectionAndOrder = useCallback((ids, previousOrder) => {
    const normalized = [...new Set(ids.map(Number).filter((item) => !Number.isNaN(item)))];
    const kept = previousOrder.filter((item) => normalized.includes(item));
    const appended = normalized.filter((item) => !kept.includes(item));
    return {
      selected: normalized,
      order: [...kept, ...appended],
    };
  }, []);

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetchData(`parts/${id}/detail-sections`, {}, "GET");
      if (response.error) {
        throw new Error(response.message);
      }

      const data = response.data || {};
      const sections = Array.isArray(data.Sections) ? data.Sections : [];
      const mappedRows = sections.map((item, index) => ({
        No: index + 1,
        id: Number(item.Id),
        Code: item.Code,
        Section: item.Name,
        Status: item.Status,
        Sequence: item.Sequence ?? "-",
        Alignment: ["center", "center", "left", "center", "center", "center"],
      }));

      const initial = mappedRows
        .filter((item) => item.Status === "Active")
        .sort((a, b) => Number(a.Sequence) - Number(b.Sequence))
        .map((item) => item.id);

      setMpdId(data.MpdId || null);
      setSectionRows(mappedRows);
      setInitialSelected(initial);
      setSelectedSectionIds(initial);
      setSequenceOrder(initial);
      setTitle(
        `Part Detail - ${data.PartCode || "N/A"}${data.ModelCode ? ` (${data.ModelCode})` : ""}`
      );
    } catch (err) {
      Toast.error(err.message || "Failed to load part detail");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id, loadDetails]);

  const handleSelectionChange = useCallback(
    (ids) => {
      setSequenceOrder((previousOrder) => {
        const result = syncSelectionAndOrder(ids, previousOrder);
        setSelectedSectionIds(result.selected);
        return result.order;
      });
    },
    [syncSelectionAndOrder]
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!active?.id || !over?.id || active.id === over.id) {
      return;
    }

    setSequenceOrder((previous) => {
      const oldIndex = previous.indexOf(active.id);
      const newIndex = previous.indexOf(over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return previous;
      }

      return arrayMove(previous, oldIndex, newIndex);
    });
  }, []);

  const sequenceMap = useMemo(() => {
    const map = new Map();
    sequenceOrder.forEach((item, index) => {
      map.set(item, index + 1);
    });
    return map;
  }, [sequenceOrder]);

  const tableData = useMemo(() => {
    return sectionRows.map((item, index) => ({
      No: index + 1,
      id: item.id,
      Code: item.Code,
      Section: item.Section,
      Status: item.Status,
      Sequence: item.Sequence ?? "-",
      Alignment: ["center", "center", "left", "center", "center", "center"],
    }));
  }, [sectionRows]);

  const selectedItems = useMemo(() => {
    const sectionMap = new Map(sectionRows.map((item) => [item.id, item]));
    return sequenceOrder
      .map((item) => sectionMap.get(item))
      .filter((item) => Boolean(item));
  }, [sectionRows, sequenceOrder]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!mpdId) {
        Toast.error("Model-part detail is not available");
        return;
      }

      const finalSequence = sequenceOrder.filter((item) =>
        selectedSectionIds.includes(item)
      );

      try {
        setLoading(true);
        const response = await fetchData(
          "parts/save-detail-sections",
          {
            mpdId,
            sectionIds: finalSequence,
          },
          "POST"
        );

        if (response.error) {
          throw new Error(response.message);
        }

        setInitialSelected(finalSequence);
        setSelectedSectionIds(finalSequence);
        setSequenceOrder(finalSequence);
        Toast.success(response.message || "Section sequence updated successfully");
        router.push("/pages/part");
      } catch (err) {
        Toast.error(err.message || "Failed to save section sequence");
      } finally {
        setLoading(false);
      }
    },
    [mpdId, selectedSectionIds, sequenceOrder]
  );

  return (
    <>
      <Loading loading={loading} message="Loading data..." />
      <Breadcrumb
        title={title}
        items={[
          { label: "Parts Management", href: "/pages/part" },
          { label: "Part Detail" },
        ]}
      />

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="mb-0">Section Checklist</h6>
              <small className="text-secondary">
                Select sections using checkboxes, then set their order in the right panel.
              </small>
            </div>
            <div className="card-body">
              <Table
                size="Small"
                data={tableData}
                enableCheckbox={true}
                initialSelectedIds={initialSelected}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="mb-0">Sequence (Drag and Drop)</h6>
              <small className="text-secondary">
                The top item will be saved as the lowest sequence value.
              </small>
            </div>
            <div className="card-body d-flex flex-column gap-2">
              {selectedItems.length === 0 ? (
                <div className="text-secondary" style={{ fontSize: 13 }}>
                  No sections selected yet.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="d-flex flex-column gap-2">
                      {selectedItems.map((item, index) => (
                        <SortableSectionItem
                          key={item.id}
                          id={item.id}
                          code={item.Code}
                          name={item.Section}
                          sequence={index + 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
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
                isDisabled={loading || (!selectedSectionIds.length && !initialSelected.length)}
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
