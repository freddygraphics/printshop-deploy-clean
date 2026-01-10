export const PERMISSIONS = {
  products: ["admin"],
  customers: ["admin", "sales"],
  quotes: ["admin", "sales"],
  invoices: ["admin", "sales"],
  jobs: ["admin", "production"],
  users: ["admin"],
};

export function can(role, module) {
  return PERMISSIONS[module]?.includes(role);
}
