// src/app/api/upload/route.js
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// تكوين Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "لم يتم رفع أي ملف" }, { status: 400 });
    }

    // تحويل الملف إلى Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // رفع الصورة إلى Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "quiznest/profiles",
          allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
          transformation: [
            { width: 400, height: 400, crop: "fill" },
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // إنشاء Readable Stream من Buffer
      const Readable = require('stream').Readable;
      const readableStream = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        }
      });

      readableStream.pipe(uploadStream);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}