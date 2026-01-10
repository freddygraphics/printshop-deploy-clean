"use client";

import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  async function loadUsers() {
    const res = await fetch("/api/users");
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data);
  }

  async function updateUser(id, payload) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    loadUsers();
  }

  async function createUser(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: form.get("role"),
      }),
    });

    if (res.ok) {
      e.target.reset();
      loadUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Error creating user");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F5F7F9] py-10">
      <div className="mx-auto max-w-5xl px-4">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            User Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage users, roles and access permissions
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* ADD USER */}
          <div className="p-6 border-b">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Add New User
            </h2>

            <form
              onSubmit={createUser}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <input
                name="name"
                placeholder="Full name"
                required
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="email"
                type="email"
                placeholder="Email address"
                required
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="password"
                type="password"
                placeholder="Temporary password"
                required
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <select
                name="role"
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="staff">Staff</option>
                <option value="sales">Sales</option>
                <option value="production">Production</option>
                <option value="admin">Admin</option>
              </select>

              <div className="md:col-span-4 flex justify-end">
                <button className="bg-black text-white px-5 py-2 rounded-lg text-sm hover:bg-gray-800">
                  Create User
                </button>
              </div>
            </form>
          </div>

          {/* USERS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-6 py-3 font-medium">{u.name}</td>
                    <td className="px-6 py-3 text-gray-600">{u.email}</td>

                    <td className="px-6 py-3">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateUser(u.id, { role: e.target.value })
                        }
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="sales">Sales</option>
                        <option value="production">Production</option>
                        <option value="staff">Staff</option>
                      </select>
                    </td>

                    <td className="px-6 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() =>
                          updateUser(u.id, { isActive: !u.isActive })
                        }
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
