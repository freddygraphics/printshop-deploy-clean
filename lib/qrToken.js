import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env.QR_SECRET; // 32 chars
if (!SECRET || SECRET.length !== 32) {
  throw new Error(
    "QR_SECRET is missing or invalid. It must be exactly 32 characters."
  );
}

export function generateInvoiceToken(invoiceId) {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(SECRET, "utf8");

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(invoiceId), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decodeInvoiceToken(token) {
  const data = Buffer.from(token, "base64url");

  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);

  const key = Buffer.from(SECRET, "utf8");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted =
    decipher.update(encrypted, null, "utf8") + decipher.final("utf8");

  return Number(decrypted);
}
