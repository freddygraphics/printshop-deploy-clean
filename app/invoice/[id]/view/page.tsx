"use client";

import { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function InvoiceViewPage({ params }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch(`/api/invoices/${params.id}/html`)
      .then((res) => res.text())
      .then(setHtml);
  }, [params.id]);

  const downloadPDF = async () => {
    const element = document.getElementById("invoice-root");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "letter");

    pdf.addImage(imgData, "PNG", 0, 0, 216, 279);

    // 🔥 abrir PDF en navegador
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);

    window.open(url, "_blank");

    // limpiar memoria
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  return (
    <div className="p-6 bg-white">
      <button
        onClick={downloadPDF}
        className="mb-4 bg-black text-white px-4 py-2 rounded"
      >
        Ver PDF
      </button>

      <div className="flex justify-center bg-gray-200 p-6">
        <div id="invoice-root" className="bg-white shadow">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
