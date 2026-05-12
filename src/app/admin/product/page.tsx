import { redirect } from "next/navigation";
import {
  addVariant,
  moveVariantImage,
  removeVariant,
  removeVariantImage,
  updateProductBasics,
  updateVariantData,
  uploadVariantImage
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ProductBasicsForm } from "@/components/admin/product-basics-form";
import { isAuthenticated } from "@/lib/auth";
import { readProductData } from "@/lib/product-store";

export default async function AdminProductPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");
  const product = await readProductData();

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">পণ্য সেটিংস</h2>
      <div className="rounded-2xl bg-white p-3 text-xs text-slate-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
        এই পেজে করা পরিবর্তন সাথে সাথে ল্যান্ডিং পেজে দেখাবে।
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <section className="admin-card">
          <ProductBasicsForm product={product} action={updateProductBasics} />
        </section>
        <section className="admin-card">
          <h3 className="font-semibold">কালার/সাইজ কন্ট্রোল</h3>
          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            <p className="font-semibold text-slate-700">কিভাবে কাজ করবেন</p>
            <p className="mt-1">১) আগে কালারের নাম দিন, ২) সাইজ লিখুন (এক লাইন = এক সাইজ), ৩) নিচেই ছবি আপলোড করুন।</p>
            <p className="mt-1">প্রতিটি ভ্যারিয়েন্টের <span className="font-semibold">প্রথম ছবি</span> কাস্টমার পেজে সেই কালারের কভার/ডিফল্ট ছবি হিসেবে দেখাবে।</p>
          </div>
          <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
            বর্তমানে মোট কালার আছে: <span className="font-semibold">{product.variants.length}</span>
          </div>
          <div className="mt-3 space-y-4">
            {product.variants.map((variant, idx) => (
              <details
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
                open={idx === 0}
              >
                <summary className="cursor-pointer list-none p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">ভ্যারিয়েন্ট #{idx + 1} - {variant.colorName}</p>
                      <p className="text-xs text-slate-500">সাইজ: {variant.sizes.join(", ") || "N/A"} | ছবি: {variant.images.length}</p>
                    </div>
                    <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">খুলুন</span>
                  </div>
                </summary>
                <div className="space-y-3 border-t border-white/60 p-3">
                  <div className="flex justify-end">
                    <form action={removeVariant}>
                      <input type="hidden" name="variantIndex" value={idx} />
                      <ConfirmSubmitButton
                        label="মুছুন"
                        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
                        confirmText="এই ভ্যারিয়েন্ট মুছে ফেলতে চান?"
                      />
                    </form>
                  </div>
                  <form action={updateVariantData} className="space-y-2">
                    <input type="hidden" name="variantIndex" value={idx} />
                    <label className="block text-xs font-medium text-slate-600">কালারের নাম</label>
                    <input
                      name="colorName"
                      defaultValue={variant.colorName}
                      placeholder="কালারের নাম"
                      className="admin-input"
                    />
                    <label className="block text-xs font-medium text-slate-600">সাইজ তালিকা</label>
                    <textarea
                      name="sizes"
                      defaultValue={variant.sizes.join("\n")}
                      placeholder="সাইজ (লাইন ধরে লিখুন)"
                      className="admin-input h-20"
                    />
                    <button className="admin-btn-dark">
                      কালার/সাইজ সেভ করুন
                    </button>
                  </form>
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-3">
                    <p className="mb-2 text-xs text-slate-500">এই সেকশন থেকেই ছবি আপলোড করুন</p>
                    <form action={uploadVariantImage}>
                      <input type="hidden" name="variantIndex" value={idx} />
                      <input
                        name="imageFile"
                        type="file"
                        accept="image/*"
                        className="mb-2 block w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5"
                      />
                      <button className="admin-btn-dark">
                        ছবি আপলোড
                      </button>
                    </form>
                  </div>
                  {variant.images.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs text-slate-500">ছবির ক্রম (প্রথম ছবি = কভার/ডিফল্ট)</p>
                      <div className="grid grid-cols-2 gap-3">
                        {variant.images.map((img, imageIndex) => (
                          <div key={`${img}-${imageIndex}`} className="rounded-2xl border border-slate-200 p-2">
                            <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt={variant.colorName} className="h-full w-full object-cover" />
                            </div>
                            {imageIndex === 0 ? (
                              <p className="mt-1 rounded-xl bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                                কভার ছবি
                              </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-1">
                              <form action={moveVariantImage}>
                                <input type="hidden" name="variantIndex" value={idx} />
                                <input type="hidden" name="imageIndex" value={imageIndex} />
                                <input type="hidden" name="direction" value="up" />
                                <button
                                  disabled={imageIndex === 0}
                                  className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                                >
                                  উপরে
                                </button>
                              </form>
                              <form action={moveVariantImage}>
                                <input type="hidden" name="variantIndex" value={idx} />
                                <input type="hidden" name="imageIndex" value={imageIndex} />
                                <input type="hidden" name="direction" value="down" />
                                <button
                                  disabled={imageIndex === variant.images.length - 1}
                                  className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                                >
                                  নিচে
                                </button>
                              </form>
                              <form action={removeVariantImage}>
                                <input type="hidden" name="variantIndex" value={idx} />
                                <input type="hidden" name="imageIndex" value={imageIndex} />
                                <button className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800">
                                  ডিলিট
                                </button>
                              </form>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </details>
            ))}
            <form action={addVariant} className="pt-1">
              <button className="admin-btn-primary">+ নতুন কালার</button>
            </form>
          </div>
        </section>
      </div>
    </section>
  );
}
