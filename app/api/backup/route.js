export const runtime = "nodejs";

import runBackup from "@/scripts/backup";

export async function GET() {
  try {
    await runBackup();
    return new Response("✅ Backup completado");
  } catch (e) {
    return new Response("❌ Error backup", { status: 500 });
  }
}
