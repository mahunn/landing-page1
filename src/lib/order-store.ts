import { promises as fs } from "fs";
import path from "path";
import {
  ORDERS_JSON_BLOB_PATH,
  readTextBlob,
  useBlobJsonPersistence,
  writeTextBlob
} from "@/lib/vercel-blob-json";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "canceled";

export type OrderData = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productTitle: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note: string;
  status: OrderStatus;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

async function ensureOrdersFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ORDERS_FILE);
  } catch {
    await fs.writeFile(ORDERS_FILE, "[]", "utf-8");
  }
}

async function readOrdersFromDisk(): Promise<OrderData[] | null> {
  try {
    const content = await fs.readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(content) as OrderData[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
}

export async function readOrders(): Promise<OrderData[]> {
  if (useBlobJsonPersistence()) {
    const fromBlob = await readTextBlob(ORDERS_JSON_BLOB_PATH);
    if (fromBlob) {
      try {
        const parsed = JSON.parse(fromBlob) as OrderData[];
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Corrupt blob: fall through.
      }
    }
    const fromDisk = await readOrdersFromDisk();
    if (fromDisk) return fromDisk;
    return [];
  }

  await ensureOrdersFile();
  const content = await fs.readFile(ORDERS_FILE, "utf-8");
  try {
    const parsed = JSON.parse(content) as OrderData[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await fs.writeFile(ORDERS_FILE, "[]", "utf-8");
    return [];
  }
}

export async function writeOrders(orders: OrderData[]): Promise<void> {
  const json = JSON.stringify(orders, null, 2);
  if (useBlobJsonPersistence()) {
    await writeTextBlob(ORDERS_JSON_BLOB_PATH, json);
    return;
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Vercel: add BLOB_READ_WRITE_TOKEN (Storage → Blob). The server filesystem is read-only, so order writes require Blob."
    );
  }
  await ensureOrdersFile();
  await fs.writeFile(ORDERS_FILE, json, "utf-8");
}

export async function createOrder(
  payload: Omit<OrderData, "id" | "status" | "createdAt">
): Promise<OrderData> {
  const orders = await readOrders();
  const order: OrderData = {
    ...payload,
    id: `HEN-${Math.floor(10000 + Math.random() * 90000)}`,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  await writeOrders(orders);
  return order;
}
