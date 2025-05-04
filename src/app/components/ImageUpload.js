// src/components/ImageUpload.js
"use client";

import { useState } from "react";
import Image from "next/image";

export default function ImageUpload({ currentImage, onImageUpload, userId }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      alert('الرجاء اختيار ملف صورة صالح');
      return;
    }

    // التحقق من حجم الملف (5MB كحد أقصى)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      if (userId) formData.append("userId", userId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("فشل رفع الصورة");
      }

      const data = await response.json();
      setPreview(data.url);
      onImageUpload(data.url);

    } catch (error) {
      console.error("خطأ في رفع الصورة:", error);
      alert("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
        {preview ? (
          <Image
            src={preview}
            alt="الصورة الشخصية"
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">لا توجد صورة</span>
          </div>
        )}
      </div>
      <label className={`
        cursor-pointer 
        bg-blue-600 
        text-white 
        px-4 
        py-2 
        rounded-lg 
        hover:bg-blue-700 
        transition-colors
        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        {uploading ? "جاري الرفع..." : "تغيير الصورة"}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}