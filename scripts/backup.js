import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ENV
const DATABASE_URL = process.env.DATABASE_URL;
const REGION = process.env.AWS_REGION;

// S3
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

// nombre del backup
const date = new Date().toISOString().split("T")[0];
const fileName = `backup-${date}.sql`;
const gzName = `${fileName}.gz`;

const filePath = path.join("/tmp", fileName);
const gzPath = path.join("/tmp", gzName);

async function runBackup() {
  try {
    console.log("🚀 Iniciando backup...");

    // 1. Crear backup
    execSync(`pg_dump "${DATABASE_URL}" -f ${filePath}`);
    console.log("✅ SQL creado");

    // 2. Comprimir
    const fileBuffer = fs.readFileSync(filePath);
    const compressed = zlib.gzipSync(fileBuffer);
    fs.writeFileSync(gzPath, compressed);
    console.log("🗜️ Comprimido");

    // 3. Subir a S3
    const upload = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `backups/${gzName}`,
      Body: fs.readFileSync(gzPath),
      ContentType: "application/gzip",
    });

    await s3.send(upload);
    console.log("☁️ Subido a S3");

    // 4. Limpiar archivos locales
    fs.unlinkSync(filePath);
    fs.unlinkSync(gzPath);

    console.log("🧹 Limpieza OK");
  } catch (err) {
    console.error("❌ ERROR BACKUP:", err);
    throw err;
  }
}

export default runBackup;
