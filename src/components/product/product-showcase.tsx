"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { placeOrderAction } from "@/app/order-actions";
import { formatBdLocalDisplay, toBdInternationalDigits } from "@/lib/phone-bd";
import type { ProductData } from "@/lib/product-store";
import { trackPurchase } from "@/components/meta-pixel";
import { getDisplayImageUrl } from "@/lib/image-helper";
import type { OrderItem } from "@/lib/order-store";

function toMoney(amount: number): string {
  return `৳${Math.round(amount)}`;
}

function finalPrice(data: ProductData): number {
  if (data.discountType === "flat") return Math.max(0, data.basePrice - data.discountValue);
  if (data.discountType === "percent")
    return Math.max(0, data.basePrice - (data.basePrice * data.discountValue) / 100);
  return data.basePrice;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function toBanglaDigits(n: number): string {
  const map: Record<string, string> = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯"
  };
  return String(n)
    .split("")
    .map((d) => map[d] ?? d)
    .join("");
}

export function ProductShowcase({ product }: { product: ProductData }) {
  const companyName = "Glamora";
  const phoneSource = product.whatsappNumber || product.callNumber;
  const contactDigits = useMemo(() => toBdInternationalDigits(phoneSource), [phoneSource]);
  const displayContact = useMemo(() => formatBdLocalDisplay(phoneSource), [phoneSource]);
  const [variantIndex, setVariantIndex] = useState(0);
  const [size, setSize] = useState(product.variants[0]?.sizes[0] ?? "");
  const [imageIndex, setImageIndex] = useState(0);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  // Multiple items ordering states
  const [items, setItems] = useState<OrderItem[]>([]);
  const [activeQuantity, setActiveQuantity] = useState(1);
  const [addNotice, setAddNotice] = useState<string | null>(null);

  const currentVariant = product.variants[variantIndex];
  const images = currentVariant?.images ?? [];
  const activeImage = images[imageIndex] ?? "";

  // Reset active quantity and size when color changes
  useEffect(() => {
    setSize(currentVariant?.sizes[0] ?? "");
    setImageIndex(0);
    setActiveQuantity(1);
  }, [variantIndex, currentVariant?.sizes]);

  const discountedPrice = useMemo(() => finalPrice(product), [product]);
  const savedAmount = Math.max(0, product.basePrice - discountedPrice);
  const percentOff =
    product.discountType === "percent"
      ? Math.round(product.discountValue)
      : product.discountType === "flat" && product.basePrice > 0
        ? Math.round((product.discountValue / product.basePrice) * 100)
        : 0;

  const discountBadgeBn =
    product.discountType === "percent"
      ? `-${toBanglaDigits(Math.round(product.discountValue))}% ছাড়`
      : product.discountType === "flat" && savedAmount > 0
        ? `-${toBanglaDigits(percentOff)}% ছাড়`
        : "";

  const currentSelection = useMemo(() => ({
    color: currentVariant?.colorName || "",
    size: size,
    quantity: activeQuantity
  }), [currentVariant?.colorName, size, activeQuantity]);

  const displayItems = useMemo(() => {
    return items.length > 0 ? items : [currentSelection];
  }, [items, currentSelection]);

  const totalQuantity = useMemo(() => {
    return displayItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [displayItems]);

  const totalPrice = useMemo(() => {
    return discountedPrice * totalQuantity;
  }, [discountedPrice, totalQuantity]);

  const whatsappLink = useMemo(() => {
    const itemSummaryText = displayItems
      .map((item) => `${item.color} (${item.size}) - ${item.quantity}টি`)
      .join(", ");
    return `https://wa.me/${contactDigits}?text=${encodeURIComponent(
      `অর্ডার করতে চাই: ${product.title} — [ ${itemSummaryText} ]`
    )}`;
  }, [contactDigits, product.title, displayItems]);
  const callLink = `tel:+${contactDigits}`;
  const [orderState, orderAction, orderPending] = useActionState(placeOrderAction, {});

  const handleAddItem = () => {
    if (!size) return;
    const activeColor = currentVariant?.colorName || "";
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.color === activeColor && item.size === size);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + activeQuantity };
        return next;
      }
      return [...prev, { color: activeColor, size, quantity: activeQuantity }];
    });
    setAddNotice(`"${activeColor} (${size})" কার্টে যোগ করা হয়েছে!`);
    setActiveQuantity(1);
    setTimeout(() => setAddNotice(null), 3000);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateItemQty = (idx: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const nextQty = next[idx].quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      next[idx] = { ...next[idx], quantity: nextQty };
      return next;
    });
  };

  useEffect(() => {
    if (orderState.success && orderState.purchaseDetails) {
      trackPurchase({
        eventId: orderState.purchaseDetails.eventId,
        value: orderState.purchaseDetails.value,
        currency: orderState.purchaseDetails.currency,
        contentName: orderState.purchaseDetails.contentName,
        numItems: orderState.purchaseDetails.numItems
      });
    }
  }, [orderState]);

  const featureLines = useMemo(() => {
    return product.description
      .split(/[\n.]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
  }, [product.description]);

  const reviewCountBn = toBanglaDigits(Math.max(product.reviews.length * 15, 45));
  const displayedReviews = product.reviews.slice(0, 3);
  const reviewCardTones = ["bg-amber-50", "bg-sky-50", "bg-violet-50"] as const;

  const goPrevImage = () => {
    if (images.length === 0) return;
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };
  const goNextImage = () => {
    if (images.length === 0) return;
    setImageIndex((i) => (i + 1) % images.length);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-100 via-stone-50 to-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-violet-200/60 bg-gradient-to-b from-white to-violet-50/90 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_6px_20px_-8px_rgba(91,33,182,0.12)] backdrop-blur-md">
        <div className="container-page flex min-h-14 items-center justify-between gap-3 py-2.5">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt={companyName}
              className="h-10 w-10 rounded-full object-cover shadow-md ring-2 ring-white ring-offset-2 ring-offset-violet-100"
            />
            <p className="font-display text-lg font-semibold tracking-tight text-violet-800">{companyName}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={callLink}
              className="hidden items-center gap-1.5 text-sm text-slate-600 transition hover:text-violet-800 sm:flex"
            >
              <span aria-hidden>📞</span>
              <span className="font-medium tabular-nums">{displayContact}</span>
            </a>
            <a
              href={whatsappLink}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-black/15 transition hover:bg-[#20BD5A] hover:shadow-lg"
            >
              <WhatsAppIcon className="h-5 w-5 shrink-0 text-white" />
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      <section className="container-page pb-32 pt-6 md:pb-28 md:pt-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
          {/* Left: sticky gallery */}
          <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
            <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-100 md:p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
                {activeImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getDisplayImageUrl(activeImage)}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">কোনো ছবি নেই</div>
                )}
                {discountBadgeBn ? (
                  <span className="absolute left-3 top-3 rounded-lg bg-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                    {discountBadgeBn}
                  </span>
                ) : null}
                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goPrevImage}
                      className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-lg text-slate-800 shadow-md ring-1 ring-slate-200 hover:bg-white"
                      aria-label="আগের ছবি"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={goNextImage}
                      className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-lg text-slate-800 shadow-md ring-1 ring-slate-200 hover:bg-white"
                      aria-label="পরের ছবি"
                    >
                      ›
                    </button>
                  </>
                ) : null}
                {images.length > 0 ? (
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
                    {toBanglaDigits(imageIndex + 1)}/{toBanglaDigits(images.length)}
                  </span>
                ) : null}
              </div>

              {product.variants.length > 0 ? (
                <div className="relative mt-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
                    {product.variants.flatMap((variant, vIdx) =>
                      variant.images.map((img, imgIdx) => {
                        const selected = vIdx === variantIndex && imgIdx === imageIndex;
                        return (
                          <button
                            key={`${vIdx}-${imgIdx}`}
                            type="button"
                            onClick={() => {
                              setVariantIndex(vIdx);
                              setImageIndex(imgIdx);
                            }}
                            className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                              selected ? "border-violet-500 shadow-md ring-2 ring-violet-100" : "border-slate-200 opacity-90 hover:opacity-100"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getDisplayImageUrl(img)} alt={variant.colorName} className="h-full w-full object-cover" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          {/* Right: details + selection + form */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-100 md:p-6">
              <p className="text-sm font-semibold text-violet-600">{companyName}</p>
              <h1 className="font-display mt-1 text-2xl font-bold leading-tight text-slate-900 md:text-3xl">{product.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-orange-400">
                <span className="text-base tracking-tight">★★★★★</span>
                <span className="text-sm text-slate-500">({reviewCountBn} রিভিউ)</span>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                {product.discountType !== "none" ? (
                  <p className="text-lg text-slate-400 line-through">{toMoney(product.basePrice)}</p>
                ) : null}
                <p className="text-3xl font-bold text-violet-600 md:text-4xl">{toMoney(discountedPrice)}</p>
                {product.discountType === "percent" ? (
                  <span className="rounded-md bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">-{toBanglaDigits(Math.round(product.discountValue))}%</span>
                ) : savedAmount > 0 ? (
                  <span className="rounded-md bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">ছাড়</span>
                ) : null}
              </div>
              {savedAmount > 0 ? (
                <p className="mt-1 text-xs text-slate-500">আপনি সাশ্রয় করছেন {toMoney(savedAmount)}</p>
              ) : null}

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-900">
                <span>✓</span>
                <span>স্টকে আছে</span>
              </div>

              {featureLines.length > 0 ? (
                <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
                  {featureLines.map((line) => (
                    <li key={line} className="flex gap-2 text-sm text-slate-700">
                      <span className="shrink-0 text-violet-500" aria-hidden>
                        👗
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <a
                href="#order-form"
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3.5 text-base font-bold text-white shadow-md shadow-orange-900/15 transition hover:bg-orange-400"
              >
                <span aria-hidden>🛒</span>
                অর্ডার করুন
              </a>

              <div className="mt-4 flex justify-center">
                <a
                  href={callLink}
                  aria-label={`কল করুন ${displayContact}`}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-700 px-3.5 py-2 pl-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
                >
                  <svg className="h-4 w-4 shrink-0 text-orange-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                    />
                  </svg>
                  <span className="tabular-nums leading-none">{displayContact}</span>
                </a>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-4">
                {[
                  { icon: "🚚", label: "সারাদেশে ডেলিভারি" },
                  { icon: "💵", label: "ক্যাশ অন ডেলিভারি" },
                  { icon: "✓", label: "১০০% অরিজিনাল" },
                  { icon: "↻", label: "সহজ এক্সচেঞ্জ" }
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-xl" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Color / size */}
            <div className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-100 md:p-6">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  🎨
                </span>
                <div>
                  <p className="text-base font-bold text-slate-900">রঙ ও সাইজ সিলেক্ট করুন</p>
                  <p className="text-xs text-slate-500">একটি রঙ সিলেক্ট করুন, তারপর সাইজ বেছে নিন</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {product.variants.map((variant, idx) => {
                  const previewImage = variant.images[0];
                  const selected = idx === variantIndex;
                  return (
                    <button
                      type="button"
                      key={`${variant.colorName}-${idx}`}
                      onClick={() => {
                        setVariantIndex(idx);
                        setImageIndex(0);
                      }}
                      className={`flex min-h-[4.5rem] w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                        selected ? "border-violet-500 bg-violet-50/60 ring-2 ring-violet-100" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                          selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white"
                        }`}
                        aria-hidden
                      >
                        {selected ? "✓" : ""}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{variant.colorName}</p>
                        <p className="text-xs text-slate-500">
                          {product.discountType !== "none" ? (
                            <>
                              <span className="line-through">{toMoney(product.basePrice)}</span>{" "}
                              <span className="font-semibold text-violet-600">{toMoney(discountedPrice)}</span>
                            </>
                          ) : (
                            <span className="font-semibold text-violet-600">{toMoney(discountedPrice)}</span>
                          )}
                        </p>
                      </div>
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {previewImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getDisplayImageUrl(previewImage)} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-800">সাইজ</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {currentVariant?.sizes.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`min-h-12 min-w-[3rem] rounded-xl border-2 px-4 py-2 text-sm font-bold transition ${
                      s === size ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm font-semibold text-slate-800">পরিমাণ</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-slate-800 tabular-nums">
                      {activeQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveQuantity((q) => q + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!size}
                    className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-900/10 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ➕ কার্টে যোগ করুন
                  </button>
                </div>
                {addNotice ? (
                  <p className="mt-3 text-center text-xs font-semibold text-teal-600 bg-teal-50 py-1.5 px-3 rounded-xl border border-teal-100 transition duration-300">
                    ✓ {addNotice}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Order form */}
            <form
              id="order-form"
              action={orderAction}
              className="space-y-4 rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-100 md:p-6"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span aria-hidden>📦</span>
                <p className="text-lg font-bold text-slate-900">অর্ডার করুন</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    আপনার নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="customerName"
                    placeholder="আপনার পূর্ণ নাম"
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    মোবাইল নাম্বার <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="customerPhone"
                    placeholder="01XXXXXXXXX"
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  পূর্ণ ঠিকানা <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="customerAddress"
                  placeholder="বাড়ি, রোড, এলাকা, থানা, জেলা"
                  className="h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                  required
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  ডেলিভারি এরিয়া <span className="text-red-500">*</span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50">
                    <input type="radio" name="deliveryZone" value="outside" defaultChecked className="h-4 w-4 accent-violet-600" required />
                    <span className="text-sm font-medium text-slate-800">ঢাকা সিটির বাইরে (১৫০ টাকা)</span>
                  </label>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50">
                    <input type="radio" name="deliveryZone" value="inside" className="h-4 w-4 accent-violet-600" />
                    <span className="text-sm font-medium text-slate-800">ঢাকা সিটির ভিতরে (৮০ টাকা)</span>
                  </label>
                </div>
              </div>

              <input type="hidden" name="items" value={JSON.stringify(items)} />
              <input type="hidden" name="color" value={displayItems[0]?.color || ""} />
              <input type="hidden" name="size" value={displayItems[0]?.size || ""} />
              <input type="hidden" name="quantity" value={totalQuantity} />
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">নোট (ঐচ্ছিক)</label>
                  <input
                    name="note"
                    placeholder="বিশেষ নির্দেশনা"
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* Items List (only shown if they have explicitly added items) */}
              {items.length > 0 ? (
                <div className="rounded-2xl border border-violet-100 bg-violet-50/20 p-4">
                  <p className="text-sm font-bold text-slate-800 mb-3">অর্ডারকৃত আইটেমসমূহ:</p>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={`${item.color}-${item.size}-${idx}`} className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{item.color}</p>
                          <p className="text-xs text-slate-500">সাইজ: {item.size}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-slate-800 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="ml-2 rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                            aria-label="মুছে ফেলুন"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-800">অর্ডার সামারি</p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <li key={idx} className="flex justify-between border-b border-slate-200/50 pb-1.5 last:border-0 last:pb-0">
                        <span>{item.color} ({item.size}) x{item.quantity}</span>
                        <span className="font-semibold text-slate-900">{toMoney(discountedPrice * item.quantity)}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        রঙ: <span className="font-medium text-slate-900">{currentVariant?.colorName}</span>
                      </li>
                      <li>
                        সাইজ: <span className="font-medium text-slate-900">{size || "—"}</span>
                      </li>
                      <li>
                        ইউনিট মূল্য: <span className="font-medium text-slate-900">{toMoney(discountedPrice)}</span>
                      </li>
                    </>
                  )}
                  <li className="flex justify-between pt-2 font-bold text-slate-900 border-t border-slate-200">
                    <span>মোট পরিমাণ:</span>
                    <span>{toBanglaDigits(totalQuantity)} পিস</span>
                  </li>
                  <li className="flex justify-between font-bold text-violet-700 text-base">
                    <span>সর্বমোট মূল্য:</span>
                    <span>{toMoney(totalPrice)}</span>
                  </li>
                </ul>
                {!size && items.length === 0 ? (
                  <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <span aria-hidden>⚠️</span>
                    অনুগ্রহ করে সাইজ সিলেক্ট করুন
                  </p>
                ) : null}
              </div>

              {orderState.error ? <p className="text-sm text-red-600">{orderState.error}</p> : null}
              {orderState.success ? <p className="text-sm text-teal-700">{orderState.success}</p> : null}

              <button
                type="submit"
                disabled={orderPending || (!size && items.length === 0)}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-base font-bold text-white shadow-md shadow-indigo-900/20 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden>✓</span>
                {orderPending ? "প্রক্রিয়াধীন..." : "অর্ডার কনফার্ম করুন"}
              </button>
              <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                <span aria-hidden>🔒</span>
                আপনার তথ্য সম্পূর্ণ সুরক্ষিত
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ + reviews: full-width band at bottom */}
      <div className="w-full border-t border-slate-200 bg-slate-100">
        <div className="container-page mx-auto max-w-6xl space-y-8 py-10 pb-28 md:space-y-10 md:py-14 md:pb-14">
          <section className="w-full rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-100 md:p-8 lg:p-10">
            <h2 className="text-center text-lg font-bold text-slate-900 md:text-xl">
              <span className="text-violet-600" aria-hidden>
                ❓
              </span>{" "}
              সাধারণ প্রশ্নাবলী
            </h2>
            <div className="mx-auto mt-6 w-full max-w-4xl space-y-2 md:mt-8">
              {product.faqs.map((item, idx) => (
                <div key={`${item.question}-${idx}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setFaqOpenIndex((prev) => (prev === idx ? null : idx))}
                    className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3.5 text-left md:px-5 md:py-4"
                  >
                    <span className="text-sm font-semibold text-slate-800 md:text-base">{item.question}</span>
                    <span className="shrink-0 text-slate-400">{faqOpenIndex === idx ? "⌃" : "⌄"}</span>
                  </button>
                  {faqOpenIndex === idx ? (
                    <p className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600 md:px-5 md:text-base">
                      {item.answer}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {displayedReviews.length > 0 ? (
            <section className="w-full rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-100 md:p-8 lg:p-10">
              <h2 className="text-center text-lg font-bold text-slate-900 md:text-xl">
                <span className="text-orange-400" aria-hidden>
                  ⭐
                </span>{" "}
                গ্রাহক মতামত
              </h2>
              <div className="mt-6 grid w-full gap-4 sm:grid-cols-2 md:mt-8 lg:grid-cols-3">
                {displayedReviews.map((rev, idx) => (
                  <article
                    key={`${rev.author}-${idx}`}
                    className={`flex flex-col rounded-2xl border border-slate-100 p-4 md:p-5 ${reviewCardTones[idx % reviewCardTones.length]}`}
                  >
                    <p className="text-orange-400">{Array.from({ length: Math.min(5, rev.rating) }).map(() => "★").join("")}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 md:text-base">খুবই সন্তুষ্ট!</p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-700 md:text-[15px]">{rev.text}</p>
                    <p className="mt-4 text-xs font-semibold text-slate-600 md:text-sm">
                      — {rev.author}, {rev.location}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* Stats strip — full width above footer (reference layout) */}
          <div className="w-full rounded-2xl bg-white px-4 py-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 md:rounded-3xl md:px-8 md:py-10">
            <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 text-center md:gap-8">
              <div>
                <p className="text-2xl font-bold text-violet-600 md:text-3xl">৫.০</p>
                <p className="mt-1 text-xs font-medium text-slate-600 md:text-sm">গড় রেটিং</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-600 md:text-3xl">১২০০+</p>
                <p className="mt-1 text-xs font-medium text-slate-600 md:text-sm">সন্তুষ্ট গ্রাহক</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-600 md:text-3xl">৯৯%</p>
                <p className="mt-1 text-xs font-medium text-slate-600 md:text-sm">ইতিবাচক রিভিউ</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Site footer */}
      <footer className="relative w-full overflow-hidden border-t border-white/[0.06] bg-gradient-to-b from-slate-950 via-[#0d1320] to-[#080c14] pb-24 text-white md:pb-0">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.14), transparent 55%)"
          }}
        />
        <div className="container-page relative mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
            <div className="max-w-lg">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.jpeg"
                  alt=""
                  className="h-12 w-12 rounded-full object-cover shadow-lg ring-2 ring-white/15 ring-offset-2 ring-offset-slate-950"
                />
                <div>
                  <p className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">{companyName}</p>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">Premium fashion</p>
                </div>
              </div>

              <a
                href={callLink}
                className="group mt-8 inline-flex items-center gap-3 text-base font-medium tracking-tight text-white transition hover:text-orange-200"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/35 transition group-hover:bg-orange-500/30">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                    />
                  </svg>
                </span>
                <span className="tabular-nums">{displayContact}</span>
              </a>

              <p className="mt-6 max-w-md text-sm font-light leading-relaxed text-slate-400 md:text-[15px]">
                ক্যাশ অন ডেলিভারি <span className="mx-2 text-slate-600">|</span> সারাদেশে ডেলিভারি
              </p>

              <div className="mt-10 h-px w-16 bg-gradient-to-r from-orange-400/70 to-transparent" aria-hidden />

              <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-600">
                © {new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end lg:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-slate-500">Developed by</p>
              <a
                href="https://mahinahmad.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex max-w-sm items-center gap-4 rounded-2xl border border-transparent bg-transparent p-0 transition lg:ml-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400/60"
              >
                <div className="min-w-0 flex-1 text-left lg:text-right">
                  <p className="font-display text-lg font-semibold text-red-400 transition group-hover:text-red-300">
                    Mahin Ahmad
                  </p>
                  <p className="mt-0.5 text-xs font-medium tracking-wide text-red-500/85 transition group-hover:text-red-400">
                    mahinahmad.com
                  </p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://mahinahmad.com/profile.jpg"
                  alt="Mahin Ahmad"
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-red-500/20 transition group-hover:ring-red-400/45"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <a
        href={whatsappLink}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_32px_rgba(37,211,102,0.45)] ring-2 ring-white/90 transition hover:scale-105 hover:bg-[#20BD5A] hover:shadow-[0_12px_40px_rgba(37,211,102,0.55)] md:bottom-8"
        aria-label="WhatsApp এ চ্যাট করুন"
      >
        <WhatsAppIcon className="h-8 w-8" />
      </a>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 p-3 backdrop-blur-md md:hidden">
        <div className="container-page flex gap-2">
          <a
            href="#order-form"
            className="min-h-12 flex-1 rounded-2xl bg-orange-500 px-3 py-3 text-center text-sm font-bold text-white shadow-md"
          >
            অর্ডার করুন
          </a>
          <a
            href={whatsappLink}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 py-3 text-center text-sm font-bold text-white shadow-md"
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" />
            WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
