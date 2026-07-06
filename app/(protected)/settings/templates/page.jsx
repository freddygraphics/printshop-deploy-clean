"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();

      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>

          <p className="text-gray-500 mt-1">
            Manage reusable product templates.
          </p>
        </div>

        <Link href="/settings/templates/new">
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} />
            New Template
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Template</th>
              <th className="text-left p-4">Slug</th>
              <th className="text-left p-4">Products</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  No templates yet.
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} className="border-t">
                  <td className="p-4 font-medium">{template.name}</td>

                  <td className="p-4 text-gray-500">{template.slug}</td>

                  <td className="p-4">0</td>

                  <td className="p-4 text-right">
                    <Link
                      href={`/settings/templates/${template.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
