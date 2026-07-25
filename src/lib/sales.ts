import type { PublicBoardSnapshot, PublicSalesDailyBucket, PublicSalesMonthlyBucket } from "@/types/hospital";

export function parseWon(value: string) { const amount = Number(value.replace(/[^0-9]/g, "")); return Number.isFinite(amount) ? amount : 0; }
export function calculateBoardSettlement(board: PublicBoardSnapshot, feeRate = 3.5) {
  const unitPrice = board.sales?.unitPrice || parseWon(board.price); const soldTickets = Math.max(0, board.openedCount);
  const grossSales = board.sales?.grossSales ?? unitPrice * soldTickets; const estimatedFee = Math.round(grossSales * feeRate / 100);
  const estimatedNet = grossSales - estimatedFee; const projectedTotalSales = unitPrice * Math.max(0, board.totalCards);
  const remainingSales = unitPrice * Math.max(0, board.remainingCards); const sellThrough = board.totalCards ? soldTickets / board.totalCards * 100 : 0;
  return { unitPrice, soldTickets, grossSales, estimatedFee, estimatedNet, projectedTotalSales, remainingSales, sellThrough, feeRate };
}
export function calculatePortfolioSettlement(boards: PublicBoardSnapshot[], feeRate = 3.5) {
  const boardRows = boards.map((board) => ({ board, ...calculateBoardSettlement(board, feeRate) }));
  const grossSales = boardRows.reduce((sum, item) => sum + item.grossSales, 0); const soldTickets = boardRows.reduce((sum, item) => sum + item.soldTickets, 0);
  const estimatedFee = Math.round(grossSales * feeRate / 100); const estimatedNet = grossSales - estimatedFee;
  const unclassifiedTickets = boards.reduce((sum, board) => sum + (board.sales?.unclassifiedTickets ?? board.openedCount), 0);
  return { boardRows, grossSales, soldTickets, estimatedFee, estimatedNet, unclassifiedTickets, feeRate };
}
export function aggregateDailySales(boards: PublicBoardSnapshot[]): PublicSalesDailyBucket[] {
  const totals = new Map<string, PublicSalesDailyBucket>();
  boards.forEach((board) => board.sales?.daily.forEach((item) => { const current = totals.get(item.date) ?? { date: item.date, ticketCount: 0, grossSales: 0 }; current.ticketCount += item.ticketCount; current.grossSales += item.grossSales; totals.set(item.date, current); }));
  return [...totals.values()].sort((a, b) => b.date.localeCompare(a.date));
}
export function aggregateMonthlySales(boards: PublicBoardSnapshot[]): PublicSalesMonthlyBucket[] {
  const totals = new Map<string, PublicSalesMonthlyBucket>();
  boards.forEach((board) => board.sales?.monthly.forEach((item) => { const current = totals.get(item.month) ?? { month: item.month, ticketCount: 0, grossSales: 0 }; current.ticketCount += item.ticketCount; current.grossSales += item.grossSales; totals.set(item.month, current); }));
  return [...totals.values()].sort((a, b) => b.month.localeCompare(a.month));
}
export function kstDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}
export function won(value: number) { return `${Math.round(value).toLocaleString("ko-KR")}원`; }
