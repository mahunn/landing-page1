import { promises as fs } from "fs";
import path from "path";

export type ProductVariant = {
  colorName: string;
  sizes: string[];
  images: string[];
};

export type ProductData = {
  title: string;
  description: string;
  basePrice: number;
  discountType: "none" | "flat" | "percent";
  discountValue: number;
  whatsappNumber: string;
  callNumber: string;
  variants: ProductVariant[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "product.json");

const defaultData: ProductData = {
  title: "Premium Gown One Piece",
  description: "Soft premium fabric gown with elegant finish.",
  basePrice: 1750,
  discountType: "flat",
  discountValue: 80,
  whatsappNumber: "8801700000000",
  callNumber: "8801700000000",
  variants: [
    {
      colorName: "Navy Blue",
      sizes: ["M", "L", "XL"],
      images: [
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop"
      ]
    },
    {
      colorName: "Olive Green",
      sizes: ["M", "L", "XL"],
      images: [
        "https://images.unsplash.com/photo-1495385794356-15371f348c31?q=80&w=1200&auto=format&fit=crop"
      ]
    }
  ]
};

export function calculateFinalPrice(data: ProductData): number {
  if (data.discountType === "flat") return Math.max(0, data.basePrice - data.discountValue);
  if (data.discountType === "percent")
    return Math.max(0, data.basePrice - (data.basePrice * data.discountValue) / 100);
  return data.basePrice;
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
  }
}

export async function readProductData(): Promise<ProductData> {
  await ensureDataFile();
  const content = await fs.readFile(DATA_FILE, "utf-8");
  try {
    return JSON.parse(content) as ProductData;
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
    return defaultData;
  }
}

export async function writeProductData(data: ProductData): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}
