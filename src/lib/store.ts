import type { PointPurchase, StoreProduct, StoreProductDraft } from "@/types/hospital";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safeInteger(value: unknown, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, max) : 0;
}

export function safeStoreImageUrl(value: unknown) {
  const input = text(value, 2048);
  if (!input) return "";
  if (input.startsWith("/assets/") && !input.includes("..")) return input;
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return "";
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!host || host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "::1") return "";
    if (/^(127|10|192\.168|169\.254)\./.test(host)) return "";
    const private172 = host.match(/^172\.(\d{1,3})\./);
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return "";
    if (/^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)) return "";
    if (host.includes(":") && (/^f[cd]/.test(host) || /^fe[89ab]/.test(host))) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function validateStoreProductDraft(input: StoreProductDraft) {
  const name = input.name.trim();
  const description = input.description.trim();
  const requestedImage = input.imageUrl.trim();
  const imageUrl = safeStoreImageUrl(requestedImage);
  if (name.length < 2 || name.length > 60) throw new Error("상품명은 2~60자로 입력해 주세요.");
  if (description.length > 240) throw new Error("상품 설명은 240자 이하로 입력해 주세요.");
  if (requestedImage && !imageUrl) throw new Error("이미지는 공개 HTTP/HTTPS 링크를 입력해 주세요.");
  if (!Number.isInteger(input.pricePoints) || input.pricePoints < 1 || input.pricePoints > 10_000_000) throw new Error("상품 가격은 1~10,000,000P 정수로 입력해 주세요.");
  if (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > 100_000) throw new Error("재고는 0~100,000개 정수로 입력해 주세요.");
  return { name, description, imageUrl, pricePoints: input.pricePoints, stock: input.stock, active: input.active };
}

export function safeStoreProduct(id: string, raw: unknown): StoreProduct {
  const value = record(raw);
  return {
    id: text(id || value.id, 128),
    name: text(value.name, 60) || "이름 미등록 상품",
    description: text(value.description, 240),
    imageUrl: safeStoreImageUrl(value.imageUrl),
    pricePoints: safeInteger(value.pricePoints, 10_000_000),
    stock: safeInteger(value.stock, 100_000),
    active: value.active === true,
    createdAt: text(value.createdAt, 40),
    updatedAt: text(value.updatedAt, 40),
  };
}

export function safePointPurchase(id: string, raw: unknown): PointPurchase {
  const value = record(raw);
  return {
    id: text(id || value.id, 128),
    requestId: text(value.requestId, 128),
    uid: text(value.uid, 128),
    loginId: text(value.loginId, 40),
    customerName: text(value.customerName, 40),
    productId: text(value.productId, 128),
    productName: text(value.productName, 60),
    imageUrl: safeStoreImageUrl(value.imageUrl),
    quantity: Math.max(1, safeInteger(value.quantity, 10)),
    unitPrice: safeInteger(value.unitPrice, 10_000_000),
    totalPoints: safeInteger(value.totalPoints, 100_000_000),
    createdAt: text(value.createdAt, 40),
  };
}

export function checkPointPurchase(product: StoreProduct, quantity: number, memberPoints: number) {
  if (!product.active) return { ok: false as const, error: "현재 판매하지 않는 상품입니다." };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return { ok: false as const, error: "구매 수량은 1~10개로 선택해 주세요." };
  if (product.stock < quantity) return { ok: false as const, error: "상품 재고가 부족합니다." };
  const totalPoints = product.pricePoints * quantity;
  if (product.pricePoints < 1 || memberPoints < totalPoints) return { ok: false as const, error: "보유 포인트가 부족합니다." };
  return { ok: true as const, totalPoints, remainingPoints: memberPoints - totalPoints };
}