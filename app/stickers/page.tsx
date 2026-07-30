"use client";

import StickerCalculator from "@/components/StickerCalculator";

export default function Page() {
  function handleStickerChange(data: any) {
    console.log("Resultado del cálculo:", data);
  }

  return (
    <div className="p-8">
      <StickerCalculator onChange={handleStickerChange} />
    </div>
  );
}
