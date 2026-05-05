"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductData } from "@/lib/product-store";

function toMoney(amount: number): string {
  return `৳${Math.round(amount)}`;
}

function finalPrice(data: ProductData): number {
  if (data.discountType === "flat") return Math.max(0, data.basePrice - data.discountValue);
  if (data.discountType === "percent")
    return Math.max(0, data.basePrice - (data.basePrice * data.discountValue) / 100);
  return data.basePrice;
}

export function ProductShowcase({ product }: { product: ProductData }) {
  const [variantIndex, setVariantIndex] = useState(0);
  const [size, setSize] = useState(product.variants[0]?.sizes[0] ?? "");
  const [imageIndex, setImageIndex] = useState(0);

  const currentVariant = product.variants[variantIndex];
  const images = currentVariant?.images ?? [];
  const activeImage = images[imageIndex] ?? "";

  useEffect(() => {
    setSize(currentVariant?.sizes[0] ?? "");
    setImageIndex(0);
  }, [variantIndex, currentVariant?.sizes]);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(id);
  }, [images]);

  const discountedPrice = useMemo(() => finalPrice(product), [product]);
  const savedAmount = Math.max(0, product.basePrice - discountedPrice);
  const discountLabel =
    product.discountType === "percent"
      ? `${Math.round(product.discountValue)}% OFF`
      : product.discountType === "flat"
        ? `SAVE ${toMoney(product.discountValue)}`
        : "";
  const whatsappLink = `https://wa.me/${product.whatsappNumber}?text=${encodeURIComponent(
    `Hello, I want to order ${product.title} in ${currentVariant?.colorName ?? ""} (${size}).`
  )}`;
  const callLink = `tel:${product.callNumber}`;

  return (
    <main className="min-h-screen">
      <section className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="aspect-[4/5] overflow-hidden rounded-xl bg-slate-100">
              {activeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeImage} alt={product.title} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <p className="mt-3 text-sm text-slate-500">Image changes automatically every 3 seconds.</p>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-brand-600">Single Product Landing</p>
              <h1 className="mt-2 text-3xl font-bold">{product.title}</h1>
              <p className="mt-3 text-slate-600">{product.description}</p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Price</p>
              {product.discountType !== "none" ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                    {discountLabel}
                  </span>
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                    Now {toMoney(discountedPrice)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-semibold">{toMoney(discountedPrice)}</p>
                {product.discountType !== "none" ? (
                  <p className="text-sm text-slate-500 line-through">{toMoney(product.basePrice)}</p>
                ) : null}
              </div>
              {savedAmount > 0 ? <p className="mt-1 text-xs text-slate-500">You save {toMoney(savedAmount)}</p> : null}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={variant.colorName}
                    className={`rounded-full border px-4 py-1.5 text-sm ${
                      idx === variantIndex
                        ? "border-brand-700 bg-brand-600 text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                    onClick={() => setVariantIndex(idx)}
                  >
                    {variant.colorName}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Size</p>
              <div className="flex flex-wrap gap-2">
                {currentVariant?.sizes.map((s) => (
                  <button
                    key={s}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      s === size ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"
                    }`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <a href={whatsappLink} className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white">
                WhatsApp
              </a>
              <a href={callLink} className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white">
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
