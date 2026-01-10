"use client";

import { useState } from "react";

export default function TemplatesPage() {
  const [productName, setProductName] = useState("");
  const [finishOptions, setFinishOptions] = useState([]);
  const [cornersOptions, setCornersOptions] = useState([]);
  const [designOptions, setDesignOptions] = useState([]);
  const [showToast, setShowToast] = useState(false);

  const addOption = (setter, list) => setter([...list, { name: "", price: "" }]);
  const handleChange = (setter, list, index, field, value) => {
    const updated = [...list];
    updated[index][field] = value;
    setter(updated);
  };
  const removeOption = (setter, list, index) =>
    setter(list.filter((_, i) => i !== index));

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <main className="min-h-screen bg-[#F5F7F9] py-10 px-4 flex justify-center relative">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm p-8 border border-[#E9EDF1]">
        <h1 className="text-2xl font-bold text-[#0EA5E9] mb-2 text-center">
          Commercial Printing
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Template for reusable print product configurations
        </p>

        {/* Product Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full border border-[#E9EDF1] rounded-md px-3 py-2 text-gray-700 focus:ring-2 focus:ring-[#0EA5E9] outline-none"
            placeholder="Enter product name"
          />
        </div>

        {/* Quantity & Price Table */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity & Price Table
          </label>
          <table className="w-full border border-[#E9EDF1] rounded-md text-sm">
            <thead className="bg-[#F5F7F9] text-gray-600">
              <tr>
                <th className="p-2 border">Quantity</th>
                <th className="p-2 border">Price ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    className="w-full border border-[#E9EDF1] rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    className="w-full border border-[#E9EDF1] rounded px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* OPTIONS TITLE */}
        <h2 className="text-xl font-semibold text-[#0EA5E9] mb-6 border-b border-[#E9EDF1] pb-2 text-center">
          Options
        </h2>

        {/* FINISH */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Finish</h3>
          <table className="w-full border border-[#E9EDF1] rounded-md mb-2 text-sm">
            <thead className="bg-[#F5F7F9] text-gray-600">
              <tr>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Price ($)</th>
                <th className="p-2 border w-10"></th>
              </tr>
            </thead>
            <tbody>
              {finishOptions.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">
                    <input
                      type="text"
                      placeholder="e.g. Glossy"
                      value={item.name}
                      onChange={(e) =>
                        handleChange(
                          setFinishOptions,
                          finishOptions,
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      className="w-full border border-[#E9EDF1] rounded px-2 py-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={item.price}
                      onChange={(e) =>
                        handleChange(
                          setFinishOptions,
                          finishOptions,
                          index,
                          "price",
                          e.target.value
                        )
                      }
                      className="w-full border border-[#E9EDF1] rounded px-2 py-1"
                    />
                  </td>
                  <td className="border text-center">
                    <button
                      onClick={() =>
                        removeOption(setFinishOptions, finishOptions, index)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => addOption(setFinishOptions, finishOptions)}
            className="text-sm text-[#0EA5E9] hover:underline"
          >
            ➕ Add Finish
          </button>
        </section>

        {/* CORNERS */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Corners</h3>
          <table className="w-full border border-[#E9EDF1] rounded-md mb-2 text-sm">
            <thead className="bg-[#F5F7F9] text-gray-600">
              <tr>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Price ($)</th>
                <th className="p-2 border w-10"></th>
              </tr>
            </thead>
            <tbody>
              {cornersOptions.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">
                    <input
                      type="text"
                      placeholder="e.g. Round Corners"
                      value={item.name}
                      onChange={(e) =>
                        handleChange(
                          setCornersOptions,
                          cornersOptions,
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      className="w-full border border-[#E9EDF1] rounded px-2 py-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={item.price}
                      onChange={(e) =>
                        handleChange(
                          setCornersOptions,
                          cornersOptions,
                          index,
                          "price",
                          e.target.value
                        )
                      }
                      className="w-full border border-[#E9EDF1] rounded px-2 py-1"
                    />
                  </td>
                  <td className="border text-center">
                    <button
                      onClick={() =>
                        removeOption(setCornersOptions, cornersOptions, index)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => addOption(setCornersOptions, cornersOptions)}
            className="text-sm text-[#0EA5E9] hover:underline"
          >
            ➕ Add Corner
          </button>
        </section>

        {/* DESIGN */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Design</h3>
          <table className="w-full border border-[#E9EDF1] rounded-md mb-2 text-sm">
            <thead className="bg-[#F5F7F9] text-gray-600">
              <tr>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Price ($)</th>
                <th className="p-2 border w-10"></th>
              </tr>
            </thead>
            <tbody>
              {designOptions.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">
                    <input
                      type="text"
                      placeholder="e.g. With Design"
                      value={item.name}
                      onChange={(e) =>
                        handleChange(
                          setDesignOptions,
                          designOptions,
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      className="w-full border border-[#E9EDF1] rounded px-2 py-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      value={item.price}
                      onChange={(e) =>
                        handleChange(
                          setDesignOptions,
                          designOptions,
                          index,
                          "price",
                          e.target.value
                        )
                      }
                      className="w-full border border-[#E9EDF1] rounded px-2 py-1"
                    />
                  </td>
                  <td className="border text-center">
                    <button
                      onClick={() =>
                        removeOption(setDesignOptions, designOptions, index)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => addOption(setDesignOptions, designOptions)}
            className="text-sm text-[#0EA5E9] hover:underline"
          >
            ➕ Add Design
          </button>
        </section>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-6 py-2 rounded-md font-medium transition"
          >
            💾 Save
          </button>
        </div>
      </div>

      {/* ✅ Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          ✅ Saved successfully
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
