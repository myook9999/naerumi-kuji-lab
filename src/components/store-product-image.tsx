"use client";

import { ImageOff, ShoppingBag } from "lucide-react";

export function StoreProductImage({ src, alt, compact = false }: { src?: string; alt: string; compact?: boolean }) {
  if (!src) return <span className={`point-product-image empty ${compact ? "compact" : ""}`}><ImageOff/></span>;
  return <span className={`point-product-image ${compact ? "compact" : ""}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(event) => event.currentTarget.parentElement?.classList.add("failed")}/>
    <span className="point-product-image-fallback"><ShoppingBag/></span>
  </span>;
}