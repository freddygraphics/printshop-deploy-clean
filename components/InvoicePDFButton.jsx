"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function InvoicePDFButton() {
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

    // 🔥 ABRIR EN NUEVA PESTAÑA
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);

    window.open(url, "_blank");
  };

  return (
    <button
      onClick={downloadPDF}
      className="mt-4 w-full bg-black text-white py-2 rounded"
    >
      Descargar PDF
    </button>
  );
}
