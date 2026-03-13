import { supabase } from "./supabase-browser";
import { v4 as uuidv4 } from "uuid";

/**
 * Compress a File/Blob to WebP format using Canvas API.
 * Returns a new File with .webp extension.
 */
export async function compressToWebP(
  file: File | Blob,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = { width: img.width, height: img.height };

        // Scale down if exceeds max dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx!.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image to WebP"));
              return;
            }
            const webpFile = new File([blob], `${uuidv4()}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload a file to Supabase Storage.
 * Compresses to WebP by default before uploading.
 */
export async function uploadImage(
  file: File,
  folder: string = "quiz_images"
): Promise<string | null> {
  try {
    // Validate file
    if (!file) {
      console.error("No file provided");
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      console.error("File too large:", file.size);
      alert("File terlalu besar. Maksimal 10MB.");
      return null;
    }

    if (!file.type.startsWith("image/")) {
      console.error("Invalid file type:", file.type);
      alert("File harus berupa gambar (PNG, JPG, GIF, WebP).");
      return null;
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
      console.error("Supabase not configured properly");
      alert("Konfigurasi Supabase belum lengkap. Silakan hubungi administrator.");
      return null;
    }

    // Compress to WebP (unless already webp and small enough)
    let uploadFile: File;
    if (file.type === "image/webp" && file.size < 2 * 1024 * 1024) {
      uploadFile = file;
    } else {
      uploadFile = await compressToWebP(file);
      console.log(`Compressed: ${file.size} bytes → ${uploadFile.size} bytes (WebP)`);
    }

    // Generate file path — just the filename, no subfolder prefix
    // because bucket name already separates the storage
    const fileName = `${uuidv4()}.webp`;

    // Determine bucket
    const bucketName = folder === "avatars" ? "avatars" : "quiz_images";

    console.log(`Uploading to bucket "${bucketName}", path: "${fileName}"`);

    // Upload the file
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, uploadFile, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("Error uploading image:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      if (error.message?.includes("Bucket not found")) {
        alert("Storage bucket belum dibuat. Silakan hubungi administrator untuk setup storage.");
      } else if (error.message?.includes("Insufficient permissions")) {
        alert("Tidak memiliki izin untuk upload gambar. Silakan login ulang.");
      } else if (error.message?.includes("File already exists")) {
        alert("File dengan nama yang sama sudah ada. Silakan coba lagi.");
      } else {
        alert("Gagal upload gambar: " + (error.message || "Unknown error"));
      }
      return null;
    }

    console.log("Upload successful:", data);

    // Get the public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;
    console.log("Public URL:", publicUrl);

    return publicUrl || null;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    alert("Terjadi kesalahan saat upload gambar. Silakan coba lagi.");
    return null;
  }
}

export function getImageNameFromUrl(url: string | null): string {
  if (!url) return "No image";

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];

    return fileName.split(".")[0].substring(0, 8) + "...";
  } catch (e) {
    return "Invalid URL";
  }
}
