export const PRINT_PRODUCTS = {
  banners: {
    name: "Banners 13oz",
    sinaliteId: 101,

    options: {
      size: [
        { label: "2x4 ft", value: "2x4" },
        { label: "3x6 ft", value: "3x6" },
      ],
      quantity: [1, 2, 5, 10],
      finishing: [
        { label: "Hemmed + Grommets", value: "hemmed_grommets" },
        { label: "None", value: "none" },
      ],
    },
  },

  businessCards: {
    name: "Business Cards",
    sinaliteId: 202,

    options: {
      size: [{ label: "3.5x2", value: "3.5x2" }],
      quantity: [100, 250, 500, 1000],
      paper: [
        { label: "14pt Gloss", value: "14pt_gloss" },
        { label: "16pt Matte", value: "16pt_matte" },
      ],
    },
  },
};
