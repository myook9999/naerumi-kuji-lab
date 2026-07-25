import type { BoardCustomerResult, PublicBoardCollectionPreview, PublicBoardSnapshot, PublicPrize } from "@/types/hospital";
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
  const remainingCount = safeNumber(source.remainingCount);
  return {
    id: safeText(source.id, `prize-${index + 1}`),
    name: safeText(source.name, "상품 정보 준비 중"),
    image: safeText(source.image || source.img),
    available: source.available === true || (source.left === true && source.claimed !== true),
    remainingCount,
  };
}

function safeCustomerResult(value: unknown, index: number): BoardCustomerResult {
  const source = record(value);
  const upperPrizes = Array.isArray(source.upperPrizes) ? source.upperPrizes.slice(0, 50).map((item, prizeIndex) => {
    const prize = record(item);
    return { name: safeText(prize.name, `상위상 ${prizeIndex + 1}`), count: Math.max(1, safeNumber(prize.count)) };
  }) : [];
  return {
    id: safeText(source.id, `customer-${index + 1}`),
    nickname: safeText(source.nickname, "이름 미등록").slice(0, 40),
    totalDraws: safeNumber(source.totalDraws),
    randomGoodsCount: safeNumber(source.randomGoodsCount),
    upperPrizes,
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
    id: safeText(source.id),
    sourceIndex: safeNumber(source.sourceIndex),
    isProgramCurrent: source.isProgramCurrent === true,
    branchId: hospital.branchId,
    boardName: safeText(source.boardName, "쿠지판 준비 중"),
    totalCards,
    openedCount,
    remainingCards: Math.max(0, totalCards - openedCount),
    price: safeText(source.price),
    prizes,
    lastOne: rawLastOne ? safePrize(rawLastOne, 0) : null,
    customerResults: Array.isArray(source.customerResults) ? source.customerResults.slice(0, 100).map(safeCustomerResult) : [],
    updatedAt: safeText(source.updatedAt),
  };
}

export function sanitizeBoardCollection(value: unknown): PublicBoardCollectionPreview {
  const source = record(value);
  const boards = Array.isArray(source.boards) ? source.boards.slice(0, 20).map(sanitizeBoardSnapshot) : [];
  const currentIndex = Math.min(Math.max(0, safeNumber(source.currentIndex)), Math.max(0, boards.length - 1));
  const featuredIndex = Math.min(Math.max(0, safeNumber(source.featuredIndex)), Math.max(0, boards.length - 1));
  return { sourceUpdatedAt: safeText(source.sourceUpdatedAt), currentIndex, featuredIndex, boards };
}
