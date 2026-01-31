export type SqftInput = {
  widthIn: number;
  heightIn: number;
  qty: number;
};

export type MaterialSnapshot = {
  id: number;
  name: string;
  costPerSqft: number;
  sellPerSqft: number;
};

export type SqftPricingResult = {
  sqft: number;
  unitPrice: number;
  total: number;
  breakdown: {
    sqftPerUnit: number;
    materialCost: number;
    sellRate: number;
  };
};
