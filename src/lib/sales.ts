import type { PublicBoardSnapshot } from "@/types/hospital";

export function parseWon(value: string) {
  const amount = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function calculateBoardSettlement(board: PublicBoardSnapshot, feeRate = 3.5) {
  const unitPrice = parseWon(board.price);
  const soldTickets = Math.max(0, board.openedCount);
  const grossSales = unitPrice * soldTickets;
  const estimatedFee = Math.round(grossSales * feeRate / 100);
  const estimatedNet = grossSales - estimatedFee;
  const projectedTotalSales = unitPrice * Math.max(0, board.totalCards);
  const remainingSales = unitPrice * Math.max(0, board.remainingCards);
  const sellThrough = board.totalCards ? soldTickets / board.totalCards * 100 : 0;

  return { unitPrice, soldTickets, grossSales, estimatedFee, estimatedNet, projectedTotalSales, remainingSales, sellThrough, feeRate };
}

export function won(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}
