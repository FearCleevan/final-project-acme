"use client";

import { useState } from "react";
import { BiRevision, BiTag, BiEnvelope } from "react-icons/bi";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCrateStore } from "@/store/crateStore";
import FitmentBox from "./FitmentBox";
import NotifyMeForm from "./NotifyMeForm";
import { getColourHex } from '@/lib/cartGrouping'
import type { ReviewSummary } from '@/lib/reviews'

interface ProductInfoProps {
  product: Product;
  reviewSummary?: ReviewSummary;
}

const selectClass =
  "w-full h-[44px] pl-3 pr-8 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron appearance-none focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors cursor-pointer";

export default function ProductInfo({ product, reviewSummary }: ProductInfoProps) {
  const addItem        = useCrateStore((s) => s.addItem);
  const updateQuantity = useCrateStore((s) => s.updateQuantity);
  const items          = useCrateStore((s) => s.items);

  // For colour-variant products each colour is its own cart entry (keyed by variant id)
  const hasColourVariants = product.colorVariants.length >= 1;
  const [selectedVariant, setSelectedVariant] = useState<typeof product.colorVariants[0] | null>(null);
  const [variantError, setVariantError]       = useState(false);

  // Derive price and stock from selected variant when applicable
  const activePrice = hasColourVariants && selectedVariant ? selectedVariant.price : product.price;
  const activeStock = hasColourVariants && selectedVariant ? selectedVariant.stock : product.stockQuantity;
  const activeInStock = hasColourVariants
    ? (selectedVariant ? selectedVariant.stock > 0 : true)
    : product.inStock;

  // For colour-variant products, cart items are keyed by variant id so each colour is separate
  const cartKey = hasColourVariants && selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id;
  const existingQty = useCrateStore((s) =>
    s.items.find((i) => i.product.id === cartKey)?.quantity ?? 0
  );

  const [selectedFinish, setSelectedFinish] = useState(product.finish[0] ?? "");
  const [selectedBurner, setSelectedBurner] = useState(product.burnerSize ?? "");
  const [qty, setQty] = useState(existingQty || 1);
  const [added, setAdded] = useState(false);

  const [multiMode,  setMultiMode]  = useState(false)
  const [multiQtys,  setMultiQtys]  = useState<Map<string, number>>(new Map())

  function setMultiQty(variantId: string, qty: number) {
    setMultiQtys(prev => {
      const next = new Map(prev)
      if (qty === 0) next.delete(variantId)
      else next.set(variantId, qty)
      return next
    })
  }

  const multiCount = Array.from(multiQtys.values()).reduce((s, q) => s + q, 0)
  const multiTotal = product.colorVariants.reduce((s, cv) => {
    return s + (multiQtys.get(cv.id) ?? 0) * cv.price
  }, 0)

  // Sync qty when existingQty changes (e.g. post-hydration or drawer update).
  // React's recommended pattern: track last synced value and setState during render
  // so the reset happens in the same cycle, not as a cascading effect.
  const [lastSyncedQty, setLastSyncedQty] = useState(existingQty);
  if (lastSyncedQty !== existingQty) {
    setLastSyncedQty(existingQty);
    setQty(existingQty > 0 ? existingQty : 1);
  }

  const average = reviewSummary?.average ?? 0
  const count   = reviewSummary?.count ?? 0

  const lineTotal = activePrice * qty;

  function handleAdd() {
    if (hasColourVariants && multiMode) {
      if (multiCount === 0) return
      for (const cv of product.colorVariants) {
        const q = multiQtys.get(cv.id) ?? 0
        if (q === 0) continue
        const cvCartKey = `${product.id}-${cv.id}`
        const existing  = items.find(i => i.product.id === cvCartKey)
        if (existing) {
          updateQuantity(cvCartKey, Math.min(existing.quantity + q, cv.stock))
        } else {
          const cartProduct = {
            ...product,
            id:            cvCartKey,
            variantId:     cv.id,
            price:         cv.price,
            stockQuantity: cv.stock,
          }
          addItem(cartProduct, selectedFinish, selectedBurner, cv.colour, q)
        }
      }
      setMultiQtys(new Map())
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
      return
    }

    // Single-select guard
    if (hasColourVariants && !selectedVariant) {
      setVariantError(true)
      return
    }

    const cartProduct = hasColourVariants && selectedVariant
      ? { ...product, id: cartKey, variantId: selectedVariant.id, price: selectedVariant.price, stockQuantity: selectedVariant.stock }
      : product

    if (existingQty > 0) {
      updateQuantity(cartKey, qty)
    } else {
      addItem(cartProduct, selectedFinish, selectedBurner, selectedVariant?.colour ?? '', qty)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {product.sku && (
          <span className="px-3 py-1 rounded-pill bg-ink-iron text-canvas-heading text-[10px] font-mono uppercase tracking-eyebrow">
            {product.sku}
          </span>
        )}
        {product.patent && (
          <span className="px-3 py-1 rounded-pill border border-ink-rule text-ink-soft text-[10px] font-mono uppercase tracking-eyebrow">
            {product.patent}
          </span>
        )}
        {!product.inStock && (
          <span className="px-3 py-1 rounded-pill bg-error/10 text-error text-[10px] font-mono uppercase tracking-eyebrow">
            Out of stock
          </span>
        )}
        {product.inStock && product.stockQuantity <= 3 && (
          <span className="px-3 py-1 rounded-pill bg-brass/10 text-brass-deep text-[10px] font-mono uppercase tracking-eyebrow">
            Only {product.stockQuantity} left
          </span>
        )}
        {product.soldCount > 0 && (
          <span className="px-3 py-1 rounded-pill bg-green-brand/10 text-green-brand text-[10px] font-mono uppercase tracking-eyebrow">
            {product.soldCount} sold
          </span>
        )}
      </div>

      {/* Name */}
      <h1
        className="font-serif font-medium text-ink-charcoal leading-tight"
        style={{ fontSize: "clamp(28px, 3vw, 48px)" }}
      >
        {product.name}
      </h1>

      <p className="font-sans text-[17px] text-ink-soft leading-relaxed">
        {product.shortDescription}
      </p>

      {/* Star aggregate */}
      {count > 0 && (
        <a href="#reviews" className="flex items-center gap-2 w-fit group">
          <span
            className="flex items-center gap-0.5"
            aria-label={`${average} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <svg
                key={n}
                width={13}
                height={13}
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625L4.5 7.07 2 4.635l3.455-.505L7 1z"
                  fill={n <= Math.round(average) ? "#C29B47" : "none"}
                  stroke={n <= Math.round(average) ? "#C29B47" : "#B8AD9A"}
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </span>
          <span className="text-[12px] font-mono text-brass-deep group-hover:text-brass transition-colors">
            {average.toFixed(1)} · {count} {count === 1 ? "review" : "reviews"}
          </span>
        </a>
      )}

      {/* Price */}
      <div className="pb-4 border-b border-ink-rule">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-[28px] text-brass-deep leading-none">
            {formatPrice(activePrice)}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
            CAD · Free freight over $150
          </span>
        </div>
        <p className="text-[11px] font-mono text-ink-soft mt-1">
          Approx. US ${(activePrice * 0.74).toFixed(2)} · AU $
          {(activePrice * 1.12).toFixed(2)} — prices shown in Canadian dollars
        </p>
      </div>

      {/* Colour variant swatches — single-select mode */}
      {hasColourVariants && !multiMode && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
            Colour{selectedVariant ? ` — ${selectedVariant.colour}` : ' — Select one'}
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {product.colorVariants.map((cv) => (
              <button
                key={cv.id}
                type="button"
                onClick={() => { setSelectedVariant(cv); setVariantError(false) }}
                className={`px-3 py-1.5 text-[13px] font-sans rounded-sm border transition-colors ${
                  selectedVariant?.id === cv.id
                    ? 'border-brass-deep bg-brass/10 text-brass-deep font-medium'
                    : 'border-ink-rule text-ink-iron hover:border-brass hover:bg-brass/5'
                } ${cv.stock === 0 ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {cv.colour}{cv.stock === 0 && ' (sold out)'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setMultiMode(true)
              setVariantError(false)
              if (selectedVariant) setMultiQty(selectedVariant.id, 1)
            }}
            className="text-[11px] font-mono text-brass-deep hover:text-brass transition-colors"
          >
            + Buying multiple colours?
          </button>
        </div>
      )}

      {/* Colour variant table — multi-select mode */}
      {hasColourVariants && multiMode && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
              Colour &amp; Quantity
            </p>
            <button
              type="button"
              onClick={() => { setMultiMode(false); setMultiQtys(new Map()) }}
              className="text-[11px] font-mono text-ink-soft hover:text-ink-iron transition-colors"
            >
              Single colour ✕
            </button>
          </div>
          <div className="border border-ink-rule rounded-sm overflow-hidden">
            {product.colorVariants.map((cv, idx) => {
              const q   = multiQtys.get(cv.id) ?? 0
              const hex = getColourHex(cv.colour)
              return (
                <div
                  key={cv.id}
                  className={`flex items-center gap-3 px-3 py-2.5 ${idx > 0 ? 'border-t border-ink-rule' : ''} ${cv.stock === 0 ? 'opacity-40' : ''}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                    style={{ background: hex }}
                  />
                  <span className="text-[13px] font-sans text-ink-iron flex-1">{cv.colour}</span>
                  {cv.stock === 0 ? (
                    <span className="text-[11px] font-mono text-ink-soft">Sold out</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-0 border border-ink-rule rounded-sm">
                        <button
                          type="button"
                          onClick={() => setMultiQty(cv.id, Math.max(0, q - 1))}
                          className="w-8 h-8 flex items-center justify-center text-ink-iron hover:bg-parchment-2 text-[15px] font-mono border-r border-ink-rule transition-colors"
                          aria-label={`Decrease ${cv.colour} quantity`}
                        >−</button>
                        <span className="w-9 text-center text-[13px] font-mono text-ink-iron tabular-nums">{q}</span>
                        <button
                          type="button"
                          onClick={() => setMultiQty(cv.id, Math.min(cv.stock, q + 1))}
                          disabled={q >= cv.stock}
                          className="w-8 h-8 flex items-center justify-center text-ink-iron hover:bg-parchment-2 text-[15px] font-mono border-l border-ink-rule transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          aria-label={`Increase ${cv.colour} quantity`}
                        >+</button>
                      </div>
                      <span className={`text-[12px] font-mono text-ink-soft w-14 text-right tabular-nums ${q === 0 ? 'invisible' : ''}`}>
                        {formatPrice(cv.price * q)}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Fitment box */}
      <FitmentBox product={product} />

      {/* Variant selectors */}
      {product.finish.length > 0 && (
        <div>
          <label
            htmlFor="finish-select"
            className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2"
          >
            Finish
          </label>
          <div className="relative">
            <select
              id="finish-select"
              value={selectedFinish}
              onChange={(e) => setSelectedFinish(e.target.value)}
              className={selectClass}
            >
              {product.finish.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft text-[11px]">
              ▾
            </span>
          </div>
        </div>
      )}

      {product.burnerSize && (
        <div>
          <label
            htmlFor="burner-select"
            className="block text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2"
          >
            Burner Size
          </label>
          <div className="relative">
            <select
              id="burner-select"
              value={selectedBurner}
              onChange={(e) => setSelectedBurner(e.target.value)}
              className={selectClass}
            >
              {["No. 1", "No. 2", "No. 3", "Universal"]
                .filter((b) => b === product.burnerSize)
                .map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft text-[11px]">
              ▾
            </span>
          </div>
        </div>
      )}

      {/* Quantity stepper — hidden in multi-colour mode and when out of stock */}
      {(!hasColourVariants || !multiMode) && activeInStock && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
              Quantity
            </p>
            {activeInStock && activeStock <= 10 && (
              <p className="text-[11px] font-mono text-brass-deep">
                {activeStock} in stock
              </p>
            )}
          </div>
          <div className="flex items-center gap-0 border border-ink-rule rounded-sm w-fit">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-11 h-11 flex items-center justify-center text-ink-iron hover:bg-parchment-2 transition-colors text-[18px] font-mono border-r border-ink-rule"
              aria-label="Decrease quantity"
            >−</button>
            <span
              className="w-12 text-center text-[15px] font-mono text-ink-iron tabular-nums"
              aria-live="polite"
            >{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(activeStock, q + 1))}
              disabled={qty >= activeStock}
              className="w-11 h-11 flex items-center justify-center text-ink-iron hover:bg-parchment-2 transition-colors text-[18px] font-mono border-l border-ink-rule disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Increase quantity"
            >+</button>
          </div>
        </div>
      )}

      {/* Cart guard — shown when colour-variant product has no selection */}
      {variantError && !multiMode && (
        <p className="text-[13px] font-sans text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
          Please select a colour before adding to your crate.
        </p>
      )}

      {/* Add to crate CTA — or notify-me form when out of stock */}
      {!activeInStock && !multiMode ? (
        <NotifyMeForm
          productHandle={product.slug}
          productTitle={product.name}
        />
      ) : (
        <button
          onClick={handleAdd}
          disabled={hasColourVariants && multiMode ? multiCount === 0 : false}
          className="w-full min-h-15 flex items-center justify-center gap-2 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[17px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
        >
          {added
            ? '✓ Added to your crate'
            : hasColourVariants && multiMode
              ? multiCount > 0
                ? `Add ${multiCount} item${multiCount !== 1 ? 's' : ''} to crate — ${formatPrice(multiTotal)}`
                : 'Select quantities above'
              : `Add to crate — ${formatPrice(lineTotal)}`}
        </button>
      )}

      {/* Trust signals */}
      <div className="space-y-2.5 pt-1">
        {[
          {
            icon: BiRevision,
            text: "30-day return — no questions on whole pieces",
          },
          {
            icon: BiTag,
            text: "Hand-numbered — every piece leaves with a tag",
          },
          {
            icon: BiEnvelope,
            text: "Real receipt — plain paper, real return address",
          },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <Icon
              size={16}
              className="text-ink-soft shrink-0"
              aria-hidden="true"
            />
            <p className="text-[12px] font-sans text-ink-soft">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
