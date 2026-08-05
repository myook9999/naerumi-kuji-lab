import { describe, expect, it } from "vitest";
import { aggregateDailySales, aggregateMonthlySales, aggregateWeeklySales, calculatePortfolioSettlement } from "./sales";

function boardWithSales(id: string, grossSales: number, ticketCount: number) {
  return {
    id, branchId: "kuji-byeongdong" as const, boardName: id, totalCards: 100, openedCount: ticketCount,
    remainingCards: 100 - ticketCount, price: "1,000원", prizes: [], lastOne: null, updatedAt: "",
    sales: { unitPrice: 1000, ticketCount, grossSales, trackedTickets: ticketCount, trackedGrossSales: grossSales, unclassifiedTickets: 0,
      daily: [{ date: "2026-07-25", ticketCount, grossSales }], monthly: [{ month: "2026-07", ticketCount, grossSales }] },
  };
}

describe("portfolio sales aggregation", () => {
  it("adds each board once for portfolio, daily, and monthly totals", () => {
    const boards = [boardWithSales("A", 3000, 3), boardWithSales("B", 5000, 5)];
    expect(calculatePortfolioSettlement(boards).grossSales).toBe(8000);
    expect(aggregateDailySales(boards)[0]).toEqual({ date: "2026-07-25", ticketCount: 8, grossSales: 8000 });
    expect(aggregateMonthlySales(boards)[0]).toEqual({ month: "2026-07", ticketCount: 8, grossSales: 8000 });
    expect(aggregateWeeklySales(boards)[0]).toEqual({ weekStart: "2026-07-20", ticketCount: 8, grossSales: 8000 });
  });

  it("groups Monday through Sunday into one weekly sales bucket", () => {
    const board = boardWithSales("A", 7000, 7);
    board.sales.daily = [
      { date: "2026-07-20", ticketCount: 2, grossSales: 2000 },
      { date: "2026-07-26", ticketCount: 3, grossSales: 3000 },
      { date: "2026-07-27", ticketCount: 2, grossSales: 2000 },
    ];
    expect(aggregateWeeklySales([board])).toEqual([
      { weekStart: "2026-07-27", ticketCount: 2, grossSales: 2000 },
      { weekStart: "2026-07-20", ticketCount: 5, grossSales: 5000 },
    ]);
  });
});
