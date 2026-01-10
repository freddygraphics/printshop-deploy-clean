export async function GET() {
  return Response.json({
    id: "commercial-printing",
    name: "Commercial Printing",

    customFields: {
      rows: [
        { qty: 100, price: 25, default: true },
        { qty: 250, price: 45 },
        { qty: 500, price: 70 },
        { qty: 1000, price: 120 }
      ],
      finish: [
        { name: "14pt Matte", price: 0, default: true },
        { name: "UV Gloss", price: 10 },
        { name: "Soft Touch", price: 20 }
      ],
      design: [
        { name: "I have design", price: 0, default: true },
        { name: "Need design", price: 25 }
      ],
      sides: [
        { name: "Single side", price: 0, default: true },
        { name: "Double side", price: 15 }
      ]
    },

    defaultOptions: {
      "Round Corners": false,
      "Spot UV": false,
      "Next Day": false
    }
  });
}
