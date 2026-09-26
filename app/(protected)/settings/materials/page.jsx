"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Package,
  Ruler,
  DollarSign,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  category: "Vinyl",
  unitType: "roll",

  brand: "",
  type: "",
  finish: "",
  color: "",
  sku: "",
  supplier: "",

  rollWidthIn: "",
  rollLengthFt: "",
  rollCost: "",

  sheetWidthIn: "",
  sheetHeightIn: "",
  sheetsPerPack: "",
  packCost: "",

  unitCost: "",

  sellPerSqft: "",
  wastePercent: "10",

  notes: "",
  active: true,
};

const DEFAULT_CATEGORIES = [
  "Vinyl",
  "Printable Vinyl",
  "Laminate",
  "Banner",
  "Paper",
  "Cardstock",
  "Coroplast",
  "PVC",
  "Foam Board",
  "Magnetic",
  "Other",
];

function money(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getMaterialSize(material) {
  if (material.unitType === "roll") {
    return `${material.rollWidthIn || 0}" × ${material.rollLengthFt || 0} ft`;
  }

  if (material.unitType === "sheet") {
    return `${material.sheetWidthIn || 0}" × ${material.sheetHeightIn || 0}"`;
  }

  if (material.unitType === "pack") {
    return `${material.sheetWidthIn || 0}" × ${
      material.sheetHeightIn || 0
    }" / ${material.sheetsPerPack || 0} sheets`;
  }

  return "Each";
}

function getPurchaseCost(material) {
  if (material.unitType === "roll") {
    return material.rollCost;
  }

  if (material.unitType === "sheet" || material.unitType === "pack") {
    return material.packCost;
  }

  return material.unitCost;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  /* ======================================================
     LOAD MATERIALS
  ====================================================== */

  async function loadMaterials() {
    try {
      setLoading(true);

      const response = await fetch("/api/materials", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load materials.");
      }

      setMaterials(Array.isArray(data.materials) ? data.materials : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load materials.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  /* ======================================================
     CATEGORIES
  ====================================================== */

  const categories = useMemo(() => {
    const materialCategories = materials
      .map((material) => material.category)
      .filter(Boolean);

    return Array.from(
      new Set([...DEFAULT_CATEGORIES, ...materialCategories]),
    ).sort();
  }, [materials]);

  /* ======================================================
     FILTER MATERIALS
  ====================================================== */

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();

    return materials.filter((material) => {
      const matchesCategory =
        categoryFilter === "all" || material.category === categoryFilter;

      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        material.name,
        material.category,
        material.brand,
        material.type,
        material.finish,
        material.color,
        material.supplier,
        material.sku,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [materials, search, categoryFilter]);

  /* ======================================================
     LIVE COST PREVIEW
  ====================================================== */

  const preview = useMemo(() => {
    const unitType = form.unitType;

    let costPerSqft = 0;
    let costPerLinearFt = null;
    let costPerSheet = null;
    let costPerUnit = null;
    let totalArea = null;

    if (unitType === "roll") {
      const width = numberValue(form.rollWidthIn);
      const length = numberValue(form.rollLengthFt);
      const cost = numberValue(form.rollCost);

      if (width > 0 && length > 0) {
        totalArea = (width / 12) * length;

        if (cost >= 0 && totalArea > 0) {
          costPerSqft = cost / totalArea;
          costPerLinearFt = cost / length;
        }
      }
    }

    if (unitType === "sheet" || unitType === "pack") {
      const width = numberValue(form.sheetWidthIn);
      const height = numberValue(form.sheetHeightIn);
      const cost = numberValue(form.packCost);

      const quantity =
        unitType === "sheet" ? 1 : Math.max(1, numberValue(form.sheetsPerPack));

      if (cost >= 0) {
        costPerSheet = cost / quantity;
      }

      if (width > 0 && height > 0) {
        const sheetArea = (width * height) / 144;

        totalArea = sheetArea * quantity;

        if (sheetArea > 0 && costPerSheet !== null) {
          costPerSqft = costPerSheet / sheetArea;
        }
      }
    }

    if (unitType === "each") {
      costPerUnit = numberValue(form.unitCost);
    }

    return {
      costPerSqft,
      costPerLinearFt,
      costPerSheet,
      costPerUnit,
      totalArea,
    };
  }, [form]);

  /* ======================================================
     FORM
  ====================================================== */

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreate() {
    setEditingMaterial(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setModalOpen(true);
  }

  function openEdit(material) {
    setEditingMaterial(material);

    setForm({
      name: material.name || "",
      category: material.category || "Vinyl",
      unitType: material.unitType || "roll",

      brand: material.brand || "",
      type: material.type || "",
      finish: material.finish || "",
      color: material.color || "",
      sku: material.sku || "",
      supplier: material.supplier || "",

      rollWidthIn: material.rollWidthIn ?? "",
      rollLengthFt: material.rollLengthFt ?? "",
      rollCost: material.rollCost ?? "",

      sheetWidthIn: material.sheetWidthIn ?? "",
      sheetHeightIn: material.sheetHeightIn ?? "",
      sheetsPerPack: material.sheetsPerPack ?? "",
      packCost: material.packCost ?? "",

      unitCost: material.unitCost ?? "",

      sellPerSqft: material.sellPerSqft ?? "",
      wastePercent: material.wastePercent ?? "0",

      notes: material.notes || "",
      active: material.active !== false,
    });

    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingMaterial(null);
    setError("");
  }

  /* ======================================================
     SAVE
  ====================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const url = editingMaterial
        ? `/api/materials/${editingMaterial.id}`
        : "/api/materials";

      const method = editingMaterial ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save material.");
      }

      await loadMaterials();

      setModalOpen(false);
      setEditingMaterial(null);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to save material.");
    } finally {
      setSaving(false);
    }
  }

  /* ======================================================
     DELETE
  ====================================================== */

  async function handleDelete(material) {
    const confirmed = window.confirm(
      `Delete "${material.name}"?\n\nIf this material is already being used, it will be deactivated instead.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(material.id);
      setError("");

      const response = await fetch(`/api/materials/${material.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete material.");
      }

      await loadMaterials();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to delete material.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Boxes className="h-6 w-6 text-blue-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900">Materials</h1>
          </div>

          <p className="text-gray-500">
            Manage materials used across products and pricing calculators.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Material
        </button>
      </div>

      {/* ERROR */}

      {error && !modalOpen && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* FILTERS */}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search materials..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Categories</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-4">Material</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Unit</th>
                <th className="px-5 py-4">Size</th>
                <th className="px-5 py-4">Purchase Cost</th>
                <th className="px-5 py-4">Cost / Sq Ft</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-16 text-center text-sm text-gray-500"
                  >
                    Loading materials...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-16 text-center">
                    <Package className="mx-auto mb-3 h-8 w-8 text-gray-300" />

                    <div className="font-medium text-gray-700">
                      No materials found
                    </div>

                    <div className="mt-1 text-sm text-gray-400">
                      Add your first production material.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => (
                  <tr
                    key={material.id}
                    className="transition hover:bg-gray-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">
                        {material.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-400">
                        {[material.brand, material.color, material.finish]
                          .filter(Boolean)
                          .join(" • ") || "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {material.category}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                        {material.unitType}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {getMaterialSize(material)}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-gray-800">
                      {money(getPurchaseCost(material))}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {material.unitType === "each"
                        ? "—"
                        : money(material.costPerSqft)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          material.active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {material.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(material)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Edit material"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === material.id}
                          onClick={() => handleDelete(material)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          title="Delete material"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingMaterial ? "Edit Material" : "Add Material"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add material dimensions and purchase cost.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-8 p-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* GENERAL */}

                <section>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Material Information
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Material Name *">
                      <input
                        required
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="input"
                        placeholder="ORACAL 651 White"
                      />
                    </Field>

                    <Field label="Category *">
                      <input
                        required
                        list="material-categories"
                        value={form.category}
                        onChange={(e) =>
                          updateField("category", e.target.value)
                        }
                        className="input"
                      />

                      <datalist id="material-categories">
                        {categories.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </Field>

                    <Field label="Brand">
                      <input
                        value={form.brand}
                        onChange={(e) => updateField("brand", e.target.value)}
                        className="input"
                        placeholder="ORACAL"
                      />
                    </Field>

                    <Field label="Type">
                      <input
                        value={form.type}
                        onChange={(e) => updateField("type", e.target.value)}
                        className="input"
                        placeholder="Permanent"
                      />
                    </Field>

                    <Field label="Finish">
                      <input
                        value={form.finish}
                        onChange={(e) => updateField("finish", e.target.value)}
                        className="input"
                        placeholder="Gloss"
                      />
                    </Field>

                    <Field label="Color">
                      <input
                        value={form.color}
                        onChange={(e) => updateField("color", e.target.value)}
                        className="input"
                        placeholder="White"
                      />
                    </Field>
                  </div>
                </section>

                {/* PURCHASE */}

                <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-5 flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-blue-600" />

                    <h3 className="font-semibold text-gray-900">
                      Purchase Information
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Purchase Unit *">
                      <select
                        value={form.unitType}
                        onChange={(e) =>
                          updateField("unitType", e.target.value)
                        }
                        className="input"
                      >
                        <option value="roll">Roll</option>
                        <option value="sheet">Sheet</option>
                        <option value="pack">Pack</option>
                        <option value="each">Each</option>
                      </select>
                    </Field>

                    <Field label="Waste %">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.wastePercent}
                        onChange={(e) =>
                          updateField("wastePercent", e.target.value)
                        }
                        className="input"
                      />
                    </Field>

                    {form.unitType === "roll" && (
                      <>
                        <Field label="Roll Width (inches) *">
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.rollWidthIn}
                            onChange={(e) =>
                              updateField("rollWidthIn", e.target.value)
                            }
                            className="input"
                            placeholder="24"
                          />
                        </Field>

                        <Field label="Roll Length (feet) *">
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.rollLengthFt}
                            onChange={(e) =>
                              updateField("rollLengthFt", e.target.value)
                            }
                            className="input"
                            placeholder="150"
                          />
                        </Field>

                        <Field label="Roll Cost *">
                          <MoneyInput
                            value={form.rollCost}
                            onChange={(value) => updateField("rollCost", value)}
                          />
                        </Field>
                      </>
                    )}

                    {(form.unitType === "sheet" ||
                      form.unitType === "pack") && (
                      <>
                        <Field label="Sheet Width (inches) *">
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.sheetWidthIn}
                            onChange={(e) =>
                              updateField("sheetWidthIn", e.target.value)
                            }
                            className="input"
                            placeholder="11"
                          />
                        </Field>

                        <Field label="Sheet Height (inches) *">
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.sheetHeightIn}
                            onChange={(e) =>
                              updateField("sheetHeightIn", e.target.value)
                            }
                            className="input"
                            placeholder="17"
                          />
                        </Field>

                        {form.unitType === "pack" && (
                          <Field label="Sheets per Pack *">
                            <input
                              required
                              type="number"
                              min="1"
                              step="1"
                              value={form.sheetsPerPack}
                              onChange={(e) =>
                                updateField("sheetsPerPack", e.target.value)
                              }
                              className="input"
                              placeholder="250"
                            />
                          </Field>
                        )}

                        <Field
                          label={
                            form.unitType === "pack"
                              ? "Pack Cost *"
                              : "Sheet Cost *"
                          }
                        >
                          <MoneyInput
                            value={form.packCost}
                            onChange={(value) => updateField("packCost", value)}
                          />
                        </Field>
                      </>
                    )}

                    {form.unitType === "each" && (
                      <Field label="Unit Cost *">
                        <MoneyInput
                          value={form.unitCost}
                          onChange={(value) => updateField("unitCost", value)}
                        />
                      </Field>
                    )}
                  </div>
                </section>

                {/* COST PREVIEW */}

                <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />

                    <h3 className="font-semibold text-gray-900">
                      Calculated Cost
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {form.unitType !== "each" && (
                      <CostCard
                        label="Cost / Sq Ft"
                        value={money(preview.costPerSqft)}
                      />
                    )}

                    {form.unitType === "roll" && (
                      <CostCard
                        label="Cost / Linear Ft"
                        value={
                          preview.costPerLinearFt === null
                            ? "—"
                            : money(preview.costPerLinearFt)
                        }
                      />
                    )}

                    {(form.unitType === "sheet" ||
                      form.unitType === "pack") && (
                      <CostCard
                        label="Cost / Sheet"
                        value={
                          preview.costPerSheet === null
                            ? "—"
                            : money(preview.costPerSheet)
                        }
                      />
                    )}

                    {form.unitType === "each" && (
                      <CostCard
                        label="Cost / Unit"
                        value={money(preview.costPerUnit)}
                      />
                    )}

                    {preview.totalArea !== null && (
                      <CostCard
                        label="Total Area"
                        value={`${preview.totalArea.toFixed(2)} sq ft`}
                      />
                    )}
                  </div>
                </section>

                {/* EXTRA */}

                <section>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Supplier">
                      <input
                        value={form.supplier}
                        onChange={(e) =>
                          updateField("supplier", e.target.value)
                        }
                        className="input"
                      />
                    </Field>

                    <Field label="SKU">
                      <input
                        value={form.sku}
                        onChange={(e) => updateField("sku", e.target.value)}
                        className="input"
                      />
                    </Field>

                    <div className="md:col-span-2">
                      <Field label="Notes">
                        <textarea
                          rows="3"
                          value={form.notes}
                          onChange={(e) => updateField("notes", e.target.value)}
                          className="input resize-none"
                        />
                      </Field>
                    </div>

                    <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) =>
                          updateField("active", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Active Material
                    </label>
                  </div>
                </section>
              </div>

              {/* FOOTER */}

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingMaterial
                      ? "Save Changes"
                      : "Save Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgb(229 231 235);
          border-radius: 0.5rem;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(17 24 39);
          outline: none;
          transition: 150ms;
        }

        .input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 2px rgb(219 234 254);
        }
      `}</style>
    </div>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>

      {children}
    </label>
  );
}

function MoneyInput({ value, onChange }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
        $
      </span>

      <input
        required
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input"
        style={{ paddingLeft: "28px" }}
        placeholder="0.00"
      />
    </div>
  );
}

function CostCard({ label, value }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </div>

      <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}
