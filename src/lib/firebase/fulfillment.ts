import type { CustomerWinning, ShippingAddress, ShippingStatus } from "@/types/hospital";

type UnknownRecord = Record<string, unknown>;
const statuses: ShippingStatus[] = ["address_required", "preparing", "shipped", "delivered"];

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function safeShippingAddress(raw: unknown): ShippingAddress {
  const value = record(raw);
  return {
    recipient: text(value.recipient, 40),
    phone: text(value.phone, 30),
    postalCode: text(value.postalCode, 12),
    address1: text(value.address1, 120),
    address2: text(value.address2, 120),
    memo: text(value.memo, 120),
    updatedAt: text(value.updatedAt, 40),
  };
}

export function safeWinning(id: string, raw: unknown): CustomerWinning {
  const value = record(raw);
  const shippingStatus = statuses.includes(value.shippingStatus as ShippingStatus)
    ? value.shippingStatus as ShippingStatus
    : "address_required";
  return {
    id,
    uid: text(value.uid, 128),
    loginId: text(value.loginId, 40),
    name: text(value.name, 40),
    boardName: text(value.boardName, 180),
    prizeName: text(value.prizeName, 180),
    tier: text(value.tier, 30),
    wonAt: text(value.wonAt, 40),
    shippingStatus,
    carrier: text(value.carrier, 40) || undefined,
    trackingNumber: text(value.trackingNumber, 60) || undefined,
    shippedAt: text(value.shippedAt, 40) || undefined,
  };
}
