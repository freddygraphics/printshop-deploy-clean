import { XMLParser } from "fast-xml-parser";

const ONESOURCE_BASE_URL = "https://api.dc-onesource.com/xml/Hub";

function getCredentials() {
  const id = process.env.ONESOURCE_KEY_ID;
  const password = process.env.ONESOURCE_KEY_PASSWORD;

  if (!id || !password) {
    throw new Error(
      "ONESOURCE_KEY_ID or ONESOURCE_KEY_PASSWORD is not configured",
    );
  }

  return { id, password };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function soapRequest({
  endpoint,
  soapAction,
  body,
}: {
  endpoint: string;
  soapAction: string;
  body: string;
}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: soapAction,
    },
    body,
    cache: "no-store",
  });

  const xml = await response.text();

  if (!response.ok) {
    console.error("OneSource HTTP error:", response.status, xml);

    throw new Error(`OneSource request failed with status ${response.status}`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: true,
    trimValues: true,
  });

  const parsed = parser.parse(xml);

  return {
    xml,
    parsed,
  };
}

/* ======================================================
   HUB PRODUCT DATA 2.0.0
====================================================== */

export async function getHubProduct(productId: string) {
  const { id, password } = getCredentials();

  const endpoint = `${ONESOURCE_BASE_URL}/Product/2.0.0/soap`;

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:prod="http://www.promostandards.org/WSDL/ProductDataService/2.0.0/">
  <soapenv:Header/>
  <soapenv:Body>
    <prod:GetProductRequest>
      <prod:wsVersion>2.0.0</prod:wsVersion>
      <prod:id>${escapeXml(id)}</prod:id>
      <prod:password>${escapeXml(password)}</prod:password>
      <prod:localizationCountry>US</prod:localizationCountry>
      <prod:localizationLanguage>en</prod:localizationLanguage>
      <prod:productId>${escapeXml(productId)}</prod:productId>
    </prod:GetProductRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  const result = await soapRequest({
    endpoint,
    soapAction: "getProduct",
    body,
  });

  const envelope = result.parsed?.Envelope;
  const soapBody = envelope?.Body;

  if (!soapBody) {
    console.error(
      "Invalid SOAP structure:",
      JSON.stringify(result.parsed, null, 2),
    );

    throw new Error("Invalid SOAP response from OneSource");
  }

  if (soapBody.Fault) {
    console.error(
      "OneSource SOAP Fault:",
      JSON.stringify(soapBody.Fault, null, 2),
    );

    throw new Error(
      soapBody.Fault?.faultstring || "OneSource returned a SOAP Fault",
    );
  }

  console.log("HUB SOAP BODY KEYS:", Object.keys(soapBody));

  const replyKey = Object.keys(soapBody)[0];

  if (!replyKey) {
    throw new Error("Empty SOAP Body returned by OneSource");
  }

  const reply = soapBody[replyKey];

  console.log("HUB PRODUCT REPLY:", JSON.stringify(reply, null, 2));

  return reply;
}
export async function getHubInventory(productId: string) {
  const { id, password } = getCredentials();

  const endpoint = `${ONESOURCE_BASE_URL}/INV/1.2.1/soap`;

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:inv="http://www.promostandards.org/WSDL/InventoryService/1.0.0/">
  <soapenv:Header/>
  <soapenv:Body>
    <inv:Request>
      <inv:wsVersion>1.2.1</inv:wsVersion>
      <inv:id>${escapeXml(id)}</inv:id>
      <inv:password>${escapeXml(password)}</inv:password>
      <inv:productID>${escapeXml(productId)}</inv:productID>
      <inv:productIDtype>Supplier</inv:productIDtype>
    </inv:Request>
  </soapenv:Body>
</soapenv:Envelope>`;

  const result = await soapRequest({
    endpoint,
    soapAction: "getInventoryLevels",
    body,
  });

  const envelope = result.parsed?.Envelope;
  const soapBody = envelope?.Body;

  if (!soapBody) {
    throw new Error("Invalid inventory SOAP response");
  }

  if (soapBody.Fault) {
    throw new Error(
      soapBody.Fault?.faultstring ||
        "OneSource returned an inventory SOAP Fault",
    );
  }

  const replyKey = Object.keys(soapBody)[0];

  if (!replyKey) {
    throw new Error("Empty inventory SOAP body");
  }

  return soapBody[replyKey];
}
export async function getHubPricing(productId: string) {
  const { id, password } = getCredentials();

  const endpoint = `${ONESOURCE_BASE_URL}/PPC/1.0.0/soap`;

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ppc="http://www.promostandards.org/WSDL/PricingAndConfiguration/1.0.0/">
  <soapenv:Header/>
  <soapenv:Body>
    <ppc:GetConfigurationAndPricingRequest>
      <ppc:wsVersion>1.0.0</ppc:wsVersion>
      <ppc:id>${escapeXml(id)}</ppc:id>
      <ppc:password>${escapeXml(password)}</ppc:password>
      <ppc:productId>${escapeXml(productId)}</ppc:productId>
      <ppc:currency>USD</ppc:currency>
      <ppc:fobId>1</ppc:fobId>
      <ppc:priceType>Net</ppc:priceType>
      <ppc:localizationCountry>US</ppc:localizationCountry>
      <ppc:localizationLanguage>en</ppc:localizationLanguage>
      <ppc:configurationType>Decorated</ppc:configurationType>
    </ppc:GetConfigurationAndPricingRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  const result = await soapRequest({
    endpoint,
    soapAction: "getConfigurationAndPricing",
    body,
  });

  const envelope = result.parsed?.Envelope;
  const soapBody = envelope?.Body;

  if (!soapBody) {
    throw new Error("Invalid PPC SOAP response");
  }

  if (soapBody.Fault) {
    throw new Error(
      soapBody.Fault?.faultstring || "OneSource returned a PPC SOAP Fault",
    );
  }

  const replyKey = Object.keys(soapBody)[0];

  if (!replyKey) {
    throw new Error("Empty PPC SOAP body");
  }

  return soapBody[replyKey];
}
/* =====================================================
   HUB SELLABLE PRODUCTS
===================================================== */

export async function getHubSellableProducts() {
  const { id, password } = getCredentials();

  const endpoint = `${ONESOURCE_BASE_URL}/Product/1.0.0/soap`;

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:prod="http://www.promostandards.org/WSDL/ProductDataService/1.0.0/"
  xmlns:shar="http://www.promostandards.org/WSDL/ProductDataService/1.0.0/SharedObjects/">

  <soapenv:Header/>

  <soapenv:Body>
    <prod:GetProductSellableRequest>
      <shar:wsVersion>1.0.0</shar:wsVersion>
      <shar:id>${escapeXml(id)}</shar:id>
      <shar:password>${escapeXml(password)}</shar:password>
      <shar:isSellable>true</shar:isSellable>
    </prod:GetProductSellableRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  const result = await soapRequest({
    endpoint,
    soapAction: "getProductSellable",
    body,
  });

  const envelope = result.parsed?.Envelope;

  const soapBody = envelope?.Body;

  if (!soapBody) {
    throw new Error("Invalid getProductSellable SOAP response");
  }

  if (soapBody.Fault) {
    throw new Error(
      soapBody.Fault?.faultstring ||
        "OneSource returned a getProductSellable SOAP Fault",
    );
  }

  const replyKey = Object.keys(soapBody)[0];

  if (!replyKey) {
    throw new Error("Empty getProductSellable SOAP body");
  }

  return soapBody[replyKey];
}
