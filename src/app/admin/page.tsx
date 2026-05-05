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
import { isAuthenticated } from "@/lib/auth";
import { calculateFinalPrice, readProductData } from "@/lib/product-store";

const stats = [
  { label: "Total Orders", value: "0" },
  { label: "Pending", value: "0" },
  { label: "Delivered", value: "0" },
  { label: "Canceled", value: "0" }
];

export default async function AdminHomePage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");
  const product = await readProductData();
  const finalPrice = calculateFinalPrice(product);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-slate-600">Use these controls to update your live landing page content.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <article key={item.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-semibold">Product Settings</h3>
          <form action={updateProductBasics} className="mt-4 space-y-3">
            <input
              name="title"
              defaultValue={product.title}
              placeholder="Product title"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              name="description"
              defaultValue={product.description}
              placeholder="Description"
              className="h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="basePrice"
                type="number"
                defaultValue={product.basePrice}
                placeholder="Base price"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="discountValue"
                type="number"
                defaultValue={product.discountValue}
                placeholder="Discount"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <select
              name="discountType"
              defaultValue={product.discountType}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="none">No discount</option>
              <option value="flat">Flat amount</option>
              <option value="percent">Percent (%)</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="whatsappNumber"
                defaultValue={product.whatsappNumber}
                placeholder="WhatsApp number"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="callNumber"
                defaultValue={product.callNumber}
                placeholder="Call number"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-slate-500">Current final price: ৳{Math.round(finalPrice)}</p>
            <button className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white">
              Save Product
            </button>
          </form>
        </section>
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-semibold">Variant Controls</h3>
          <form action={addVariant} className="mt-3">
            <button className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white">+ Add Color Variant</button>
          </form>
          <div className="mt-3 space-y-4">
            {product.variants.map((variant, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Variant #{idx + 1}</p>
                  <form action={removeVariant}>
                    <input type="hidden" name="variantIndex" value={idx} />
                    <button className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white">Remove</button>
                  </form>
                </div>

                <form action={updateVariantData} className="space-y-2">
                  <input type="hidden" name="variantIndex" value={idx} />
                  <input
                    name="colorName"
                    defaultValue={variant.colorName}
                    placeholder="Color name"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    name="sizes"
                    defaultValue={variant.sizes.join("\n")}
                    placeholder="Sizes, one per line"
                    className="h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    name="images"
                    defaultValue={variant.images.join("\n")}
                    placeholder="Image URLs (optional), one per line"
                    className="h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
                    Save {variant.colorName}
                  </button>
                </form>

                <div className="rounded-md border border-dashed border-slate-300 p-3">
                  <p className="mb-2 text-xs text-slate-500">Upload image for this color variant</p>
                  <form action={uploadVariantImage}>
                    <input type="hidden" name="variantIndex" value={idx} />
                    <input
                      name="imageFile"
                      type="file"
                      accept="image/*"
                      className="mb-2 block w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5"
                    />
                    <button className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white">
                      Upload Image
                    </button>
                  </form>
                </div>

                {variant.images.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs text-slate-500">Image order (first image is hero default)</p>
                    <div className="grid grid-cols-2 gap-3">
                      {variant.images.map((img, imageIndex) => (
                        <div key={`${img}-${imageIndex}`} className="rounded-lg border border-slate-200 p-2">
                          <div className="aspect-square overflow-hidden rounded-md bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={variant.colorName} className="h-full w-full object-cover" />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <form action={moveVariantImage}>
                              <input type="hidden" name="variantIndex" value={idx} />
                              <input type="hidden" name="imageIndex" value={imageIndex} />
                              <input type="hidden" name="direction" value="up" />
                              <button
                                disabled={imageIndex === 0}
                                className="rounded bg-slate-700 px-2 py-1 text-xs text-white disabled:opacity-40"
                              >
                                Up
                              </button>
                            </form>
                            <form action={moveVariantImage}>
                              <input type="hidden" name="variantIndex" value={idx} />
                              <input type="hidden" name="imageIndex" value={imageIndex} />
                              <input type="hidden" name="direction" value="down" />
                              <button
                                disabled={imageIndex === variant.images.length - 1}
                                className="rounded bg-slate-700 px-2 py-1 text-xs text-white disabled:opacity-40"
                              >
                                Down
                              </button>
                            </form>
                            <form action={removeVariantImage}>
                              <input type="hidden" name="variantIndex" value={idx} />
                              <input type="hidden" name="imageIndex" value={imageIndex} />
                              <button className="rounded bg-rose-600 px-2 py-1 text-xs text-white">Delete</button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
