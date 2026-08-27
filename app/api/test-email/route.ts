import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await sendEmail({
      to: "orders@freddygraphics.com",
      subject: "Freddy Graphics - SMTP Test",
      html: `
        <div style="font-family:Arial,sans-serif;">
          <h1>SMTP is working!</h1>

          <p>
            This test email was sent successfully from the
            Freddy Graphics Print Shop system.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent.",
    });
  } catch (error) {
    console.error("SMTP test error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Could not send test email.",
      },
      { status: 500 },
    );
  }
}
