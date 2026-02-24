import fs from "fs";
import csv from "csv-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const rows = [];

  fs.createReadStream("./clients.csv")
    .pipe(csv())
    .on("data", (data) => rows.push(data))
    .on("end", async () => {
      for (const row of rows) {
        await prisma.customer.create({
          data: {
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
          },
        });
      }

      console.log("✅ Import completed");
      process.exit();
    });
}

run();
