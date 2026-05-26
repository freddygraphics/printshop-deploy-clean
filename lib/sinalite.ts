let cachedToken: string | null = null;
let tokenExpires = 0;

// 🔐 TOKEN
export async function getSinaliteToken() {
  if (cachedToken && Date.now() < tokenExpires) {
    return cachedToken;
  }

  const res = await fetch("https://api.sinaliteuppy.com/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.SINALITE_CLIENT_ID,
      client_secret: process.env.SINALITE_CLIENT_SECRET,
      audience: "https://apiconnect.sinalite.com",
      grant_type: "client_credentials",
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error("Error obteniendo token Sinalite");
  }

  cachedToken = data.access_token;
  tokenExpires = Date.now() + 1000 * 60 * 50;

  return cachedToken;
}
// 🔥 GET PRODUCT CONFIG
export async function getSinaliteProduct(productId: number) {
  const token = await getSinaliteToken();

  const res = await fetch(
    `https://api.sinaliteuppy.com/product/${productId}/1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await res.json();

  console.log("🔥 PRODUCT CONFIG:", JSON.stringify(data, null, 2));

  return data;
}
// 💰 PRICE
export async function getSinalitePrice(productId: number, options: any) {
  const token = await getSinaliteToken();

  const res = await fetch(
    `https://api.sinaliteuppy.com/product/${productId}/price`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attributes: options,
      }),
    },
  );

  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("RAW RESPONSE:", text);
  // 🔥 PRIMERO valida si la respuesta fue exitosa
  if (!res.ok) {
    console.error("❌ SINALITE ERROR STATUS:", res.status);
    console.error("❌ SINALITE RESPONSE:", text);

    throw new Error("Error en Sinalite API");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("❌ SINALITE INVALID JSON:", text);
    throw new Error("Respuesta inválida de Sinalite");
  }
}
