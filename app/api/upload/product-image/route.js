export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "products",
            resource_type: "image",
          },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          },
        )
        .end(buffer);
    });

    return Response.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        error: err.message,
      },
      {
        status: 500,
      },
    );
  }
}
