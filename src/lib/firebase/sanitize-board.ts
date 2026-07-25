import type { PublicBoardSnapshot, PublicPrize } from "@/types/hospital";
import { hospital } from "@/config/hospital";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.slice(0, 180) : fallback;
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function safePrize(value: unknown, index: number): PublicPrize {
  const source = record(value);
  return {
    id: safeText(source.id, `prize-${index + 1}`),
    name: safeText(source.name, "상품 정보 준비 중"),
    image: safeText(source.img),
    available: source.left === true && source.claimed !== true,
  };
}

export function sanitizeBoardSnapshot(value: unknown): PublicBoardSnapshot {
  const source = record(value);
  const totalCards = safeNumber(source.totalCards);
  const openedCount = Math.min(totalCards, safeNumber(source.openedCount));
  const prizes = Array.isArray(source.prizes)
    ? source.prizes.slice(0, 40).map(safePrize)
    : [];
  const rawLastOne = source.lastOne;

  return {
    branchId: hospital.branchId,
    boardName: safeText(source.boardName, "쿠지판 준비 중"),
    totalCards,
    openedCount,
    remainingCards: Math.max(0, totalCards - openedCount),
    price: safeText(source.price),
    prizes,
    lastOne: rawLastOne ? safePrize(rawLastOne, 0) : null,
    updatedAt: safeText(source.updatedAt),
  };
}
