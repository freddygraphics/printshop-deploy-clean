import Link from "next/link";
import {
  Boxes,
  CreditCard,
  Layers3,
  Package,
  Shirt,
  ShoppingBag,
  Sparkles,
  Sticker,
  Users,
} from "lucide-react";

const cards = [
  {
    title: "Templates",
    href: "/settings/templates",
    description: "Create and manage product templates.",
    icon: Layers3,
  },
  {
    title: "Products",
    href: "/settings/products",
    description: "Create, edit and manage your products.",
    icon: ShoppingBag,
  },
  {
    title: "Product Option Library",
    href: "/settings/product-option-library",
    description: "Reusable options for all products.",
    icon: Package,
  },
  {
    title: "Sticker Pricing",
    href: "/settings/stickers",
    description: "Manage sticker materials, costs and pricing.",
    icon: Sticker,
  },
  {
    title: "Apparel & DTF Pricing",
    href: "/settings/apparel-pricing",
    description: "Configure garments, DTF, labor, fees and profit.",
    icon: Shirt,
  },
  {
    title: "Materials",
    href: "/settings/materials",
    description: "Manage materials and production costs.",
    icon: Boxes,
  },
  {
    title: "Finishes",
    href: "/settings/finishes",
    description: "Manage available product finishes.",
    icon: Sparkles,
  },
  {
    title: "Billing",
    href: "/settings/billing",
    description: "Configure billing and payment settings.",
    icon: CreditCard,
  },
  {
    title: "Users",
    href: "/settings/users",
    description: "Manage users and permissions.",
    icon: Users,
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl p-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Settings</h1>

      <p className="mb-8 text-gray-500">Configure your print shop.</p>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 transition group-hover:bg-blue-100">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>

              <h2 className="text-lg font-semibold text-gray-900">
                {card.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
