import type {
  BoardCustomerResult, PublicBoardCollectionPreview, PublicBoardSales, PublicBoardSnapshot,
  PublicPrize, PublicSalesDailyBucket, PublicSalesMonthlyBucket,
} from "@/types/hospital";
import { hospital } from "@/config/hospital";

type UnknownRecord = Record<string, unknown>;
function record(value: unknown): UnknownRecord { return value && typeof value === "object" ? value as UnknownRecord : {}; }
function safeText(value: unknown, fallback = "", maxLength = 180) { return typeof value === "string" ? value.slice(0, maxLength) : fallback; }
function safeNumber(value: unknown, max = 1_000_000_000) { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? Math.min(max, Math.floor(parsed)) : 0; }

function safeImageUrl(value: unknown) {
  const text = safeText(value, "", 2048).trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return "";
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "::1") return "";
    if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return "";
    const private172 = host.match(/^172\.(\d{1,3})\./);
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return "";
    return url.toString();
  } catch { return ""; }
}

function safePrize(value: unknown, index: number): PublicPrize {
  const source = record(value);
  return {
    id: safeText(source.id, `prize-${index + 1}`), name: safeText(source.name, `상품 ${index + 1}`),
    image: safeImageUrl(source.image || source.img),
    available: source.available === true || (source.left === true && source.claimed !== true),
    remainingCount: safeNumber(source.remainingCount, 100_000),
  };
}

function safeCustomerResult(value: unknown, index: number): BoardCustomerResult {
  const source = record(value);
  const upperPrizes = Array.isArray(source.upperPrizes) ? source.upperPrizes.slice(0, 50).map((item, prizeIndex) => {
    const prize = record(item);
    return { name: safeText(prize.name, `상위상 ${prizeIndex + 1}`), count: Math.max(1, safeNumber(prize.count, 10_000)) };
  }) : [];
  return { id: safeText(source.id, `customer-${index + 1}`), nickname: safeText(source.nickname, "닉네임 미등록").slice(0, 40), totalDraws: safeNumber(source.totalDraws, 1_000_000), randomGoodsCount: safeNumber(source.randomGoodsCount, 1_000_000), upperPrizes };
}

function safeDailyBucket(value: unknown): PublicSalesDailyBucket | null {
  const source = record(value); const date = safeText(source.date, "", 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? { date, ticketCount: safeNumber(source.ticketCount), grossSales: safeNumber(source.grossSales) } : null;
}
function safeMonthlyBucket(value: unknown): PublicSalesMonthlyBucket | null {
  const source = record(value); const month = safeText(source.month, "", 7);
  return /^\d{4}-\d{2}$/.test(month) ? { month, ticketCount: safeNumber(source.ticketCount), grossSales: safeNumber(source.grossSales) } : null;
}
function safeSales(value: unknown, unitPrice: number, openedCount: number): PublicBoardSales {
  const source = record(value); const trackedTickets = Math.min(openedCount, safeNumber(source.trackedTickets));
  const daily = Array.isArray(source.daily) ? source.daily.slice(-120).map(safeDailyBucket).filter((item): item is PublicSalesDailyBucket => Boolean(item)) : [];
  const monthly = Array.isArray(source.monthly) ? source.monthly.slice(-36).map(safeMonthlyBucket).filter((item): item is PublicSalesMonthlyBucket => Boolean(item)) : [];
  return { unitPrice: safeNumber(source.unitPrice) || unitPrice, ticketCount: openedCount, grossSales: safeNumber(source.grossSales) || unitPrice * openedCount, trackedTickets, trackedGrossSales: safeNumber(source.trackedGrossSales), unclassifiedTickets: Math.max(0, openedCount - trackedTickets), daily, monthly };
}

export function sanitizeBoardSnapshot(value: unknown): PublicBoardSnapshot {
  const source = record(value); const totalCards = safeNumber(source.totalCards, 1_000_000);
  const openedCount = Math.min(totalCards, safeNumber(source.openedCount, 1_000_000));
  const prizes = Array.isArray(source.prizes) ? source.prizes.slice(0, 40).map(safePrize) : [];
  const price = safeText(source.price, "", 40); const unitPrice = safeNumber(price.replace(/[^0-9]/g, ""));
  return {
    id: safeText(source.id), sourceIndex: safeNumber(source.sourceIndex, 1000), isProgramCurrent: source.isProgramCurrent === true,
    branchId: hospital.branchId, boardName: safeText(source.boardName, "쿠지판 준비 중"), totalCards, openedCount,
    remainingCards: Math.max(0, totalCards - openedCount), price, prizes,
    lastOne: source.lastOne ? safePrize(source.lastOne, 0) : null, sales: safeSales(source.sales, unitPrice, openedCount),
    customerResults: Array.isArray(source.customerResults) ? source.customerResults.slice(0, 100).map(safeCustomerResult) : [], updatedAt: safeText(source.updatedAt),
  };
}

export function sanitizeBoardCollection(value: unknown): PublicBoardCollectionPreview {
  const source = record(value);
  const usedBoardIds = new Set<string>();
  const boards = Array.isArray(source.boards) ? source.boards.slice(0, 20).map((value, index) => {
    const board = sanitizeBoardSnapshot(value);
    const baseId = board.id?.trim() || `board-${board.sourceIndex ?? index}`;
    let uniqueId = baseId;
    let duplicate = 1;
    while (usedBoardIds.has(uniqueId)) {
      uniqueId = `${baseId}-${index}-${duplicate}`;
      duplicate += 1;
    }
    usedBoardIds.add(uniqueId);
    return { ...board, id: uniqueId };
  }) : [];
  const currentIndex = Math.min(Math.max(0, safeNumber(source.currentIndex, 1000)), Math.max(0, boards.length - 1));
  const featuredIndex = Math.min(Math.max(0, safeNumber(source.featuredIndex, 1000)), Math.max(0, boards.length - 1));
  return { sourceUpdatedAt: safeText(source.sourceUpdatedAt), currentIndex, featuredIndex, boards };
}
