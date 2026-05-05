"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { readProductData, writeProductData } from "@/lib/product-store";

function parseLines(input: string): string[] {
  return input
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function updateProductBasics(formData: FormData) {
  const data = await readProductData();
  data.title = String(formData.get("title") ?? "").trim();
  data.description = String(formData.get("description") ?? "").trim();
  data.basePrice = Number(formData.get("basePrice") ?? 0);
  data.discountType = String(formData.get("discountType") ?? "none") as "none" | "flat" | "percent";
  data.discountValue = Number(formData.get("discountValue") ?? 0);
  data.whatsappNumber = String(formData.get("whatsappNumber") ?? "").trim();
  data.callNumber = String(formData.get("callNumber") ?? "").trim();

  await writeProductData(data);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateVariantData(formData: FormData) {
  const data = await readProductData();
  const variantIndex = Number(formData.get("variantIndex") ?? 0);
  const colorName = String(formData.get("colorName") ?? "").trim();
  const sizes = parseLines(String(formData.get("sizes") ?? ""));
  const images = parseLines(String(formData.get("images") ?? ""));

  if (!data.variants[variantIndex]) return;
  data.variants[variantIndex] = { colorName, sizes, images };
  await writeProductData(data);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function addVariant() {
  const data = await readProductData();
  data.variants.push({
    colorName: `Color ${data.variants.length + 1}`,
    sizes: ["M", "L"],
    images: []
  });
  await writeProductData(data);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removeVariant(formData: FormData) {
  const data = await readProductData();
  const variantIndex = Number(formData.get("variantIndex") ?? -1);
  if (variantIndex < 0 || variantIndex >= data.variants.length) return;
  if (data.variants.length <= 1) return;

  data.variants.splice(variantIndex, 1);
  await writeProductData(data);
  revalidatePath("/");
  revalidatePath("/admin");
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadVariantImage(formData: FormData) {
  const data = await readProductData();
  const variantIndex = Number(formData.get("variantIndex") ?? -1);
  const file = formData.get("imageFile");
  if (variantIndex < 0 || variantIndex >= data.variants.length) return;
  if (!(file instanceof File) || file.size === 0) return;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${safeFileName(file.name)}`;
  const fullPath = path.join(uploadDir, fileName);
  await fs.writeFile(fullPath, bytes);

  data.variants[variantIndex].images.push(`/uploads/${fileName}`);
  await writeProductData(data);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removeVariantImage(formData: FormData) {
  const data = await readProductData();
  const variantIndex = Number(formData.get("variantIndex") ?? -1);
  const imageIndex = Number(formData.get("imageIndex") ?? -1);

  if (variantIndex < 0 || variantIndex >= data.variants.length) return;
  if (imageIndex < 0 || imageIndex >= data.variants[variantIndex].images.length) return;

  const [removed] = data.variants[variantIndex].images.splice(imageIndex, 1);
  if (removed?.startsWith("/uploads/")) {
    const localPath = path.join(process.cwd(), "public", removed.replace(/^\//, ""));
    try {
      await fs.unlink(localPath);
    } catch {
      // File may already be removed; ignore and continue.
    }
  }

  await writeProductData(data);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function moveVariantImage(formData: FormData) {
  const data = await readProductData();
  const variantIndex = Number(formData.get("variantIndex") ?? -1);
  const imageIndex = Number(formData.get("imageIndex") ?? -1);
  const direction = String(formData.get("direction") ?? "");

  if (variantIndex < 0 || variantIndex >= data.variants.length) return;

  const images = data.variants[variantIndex].images;
  if (imageIndex < 0 || imageIndex >= images.length) return;

  const targetIndex = direction === "up" ? imageIndex - 1 : imageIndex + 1;
  if (targetIndex < 0 || targetIndex >= images.length) return;

  const temp = images[targetIndex];
  images[targetIndex] = images[imageIndex];
  images[imageIndex] = temp;

  await writeProductData(data);
  revalidatePath("/");
  revalidatePath("/admin");
}
