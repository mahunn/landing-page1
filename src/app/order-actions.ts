"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createOrder } from "@/lib/order-store";
import { calculateFinalPrice, readProductData } from "@/lib/product-store";

const orderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerAddress: z.string().min(5),
  color: z.string().min(1),
  size: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
  deliveryZone: z.enum(["inside", "outside"]).optional(),
  note: z.string().optional()
});

export async function placeOrderAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const parsed = orderSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerAddress: formData.get("customerAddress"),
    color: formData.get("color"),
    size: formData.get("size"),
    quantity: formData.get("quantity"),
    deliveryZone: formData.get("deliveryZone") ?? undefined,
    note: formData.get("note")
  });

  if (!parsed.success) return { error: "Please fill all required order fields correctly." };

  try {
    const product = await readProductData();
    const unitPrice = calculateFinalPrice(product);
    const totalPrice = unitPrice * parsed.data.quantity;

    const deliveryLine =
      parsed.data.deliveryZone === "inside"
        ? "ডেলিভারি: ঢাকা সিটির ভিতরে (৮০ টাকা)"
        : parsed.data.deliveryZone === "outside"
          ? "ডেলিভারি: ঢাকা সিটির বাইরে (১৫০ টাকা)"
          : "";
    const noteParts = [deliveryLine, parsed.data.note].filter((part) => part && String(part).trim().length > 0);

    const order = await createOrder({
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      customerAddress: parsed.data.customerAddress,
      productTitle: product.title,
      selectedColor: parsed.data.color,
      selectedSize: parsed.data.size,
      quantity: parsed.data.quantity,
      unitPrice,
      totalPrice,
      note: noteParts.join("\n")
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: `Order placed successfully: ${order.id}` };
  } catch (err) {
    console.error("[placeOrderAction]", err);
    const raw = err instanceof Error ? err.message : "";
    if (raw.includes("BLOB_READ_WRITE_TOKEN") || raw.includes("read-only")) {
      return {
        error:
          "অর্ডার সংরক্ষণ করা যাচ্ছে না: সার্ভারে স্টোরেজ সেট করা হয়নি। সাইট মালিককে জানান (Vercel এ BLOB_READ_WRITE_TOKEN যোগ করতে হবে)।"
      };
    }
    if (raw.includes("Blob") || raw.includes("blob")) {
      return {
        error:
          "অর্ডার সংরক্ষণ করা যায়নি (স্টোরেজ)। একটু পরে আবার চেষ্টা করুন। যদি সমস্যা থাকে, সাইট মালিককে জানান।"
      };
    }
    return {
      error: "অর্ডার সংরক্ষণ করা যায়নি। একটু পরে আবার চেষ্টা করুন।"
    };
  }
}
