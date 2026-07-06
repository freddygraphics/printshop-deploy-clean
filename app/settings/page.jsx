import Link from "next/link";
import { Layers3, Package, Sticker } from "lucide-react";

const cards = [
  {
    title: "Templates",
    href: "/settings/templates",
    description: "Create and manage product templates.",
    icon: Layers3,
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
    description: "Manage sticker pricing.",
    icon: Sticker,
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>

      <p className="text-gray-500 mb-8">Configure your print shop.</p>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              href={card.href}
              className="border rounded-xl p-6 hover:shadow-md transition bg-white"
            >
              <Icon className="w-8 h-8 text-blue-600 mb-4" />

              <h2 className="text-lg font-semibold">{card.title}</h2>

              <p className="text-sm text-gray-500 mt-2">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
