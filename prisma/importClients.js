// prisma/importClients.js
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function importClients() {
  const filePath = path.join(process.cwd(), "prisma/import/clients.csv");

  console.log("📥 Importing clients from:", filePath);

  const file = fs.readFileSync(filePath, "utf8");
  const lines = file.split("\n").filter((line) => line.trim() !== "");

  let count = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");

    const [
      name,
      company,
      email,
      phone,
      address,
      city,
      state,
      country,
      zip,
    ] = row.map((cell) => cell.trim().replace(/"/g, ""));

    try {
      await prisma.client.create({
        data: {
          name,
          company: company || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          country: country || null,
          zip: zip || null,
        },
      });

      count++;
    } catch (err) {
      console.log("⚠️ Error importing row", i, err.message);
    }
  }

  console.log(`✅ Done! Imported ${count} clients.`);
  process.exit();
}

importClients();
