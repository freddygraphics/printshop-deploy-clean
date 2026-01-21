"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LargeFormatTemplate from "../../templates/LargeFormatTemplate";

export default function LargeFormatPage() {
  return (
    <main className="min-h-screen bg-[#F5F7F9] py-24 px-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Back Button */}
        <div className="flex items-center mb-4">
          <Link
            href="/products"
            className="flex items-center text-[#0EA5E9] hover:text-[#0284C7] font-medium transition"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Products
          </Link>
        </div>

        {/* Product Template */}
        <LargeFormatTemplate />
      </div>
    </main>
  );
}
