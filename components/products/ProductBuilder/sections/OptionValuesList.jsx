"use client";

import OptionValueCard from "./OptionValueCard";

export default function OptionValuesList({
  values = [],
  updateValue,
  removeValue,
  setDefault,
}) {
  return (
    <div className="space-y-4 p-5">
      {values.map((value, index) => (
        <OptionValueCard
          key={value.id || index}
          value={value}
          index={index}
          updateValue={updateValue}
          removeValue={removeValue}
          setDefault={setDefault}
        />
      ))}
    </div>
  );
}
