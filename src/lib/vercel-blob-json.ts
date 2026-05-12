import { get, put } from "@vercel/blob";

/** Pathnames are stable keys in your Blob store (not public URLs). */
export const PRODUCT_JSON_BLOB_PATH = "glamora/product.json";
export const ORDERS_JSON_BLOB_PATH = "glamora/orders.json";

export function useBlobJsonPersistence(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function readTextBlob(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: "public" });
  if (!result || result.statusCode === 304) return null;
  if (!result.stream) return null;
  return await new Response(result.stream).text();
}

export async function writeTextBlob(pathname: string, body: string): Promise<void> {
  await put(pathname, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8"
  });
}
