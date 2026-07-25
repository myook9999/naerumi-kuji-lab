import { describe, expect, it } from "vitest";
import { calculateBoardSettlement, parseWon } from "./sales";

describe("쿠지판 매출·정산 계산", () => {
  it("표시 가격에서 원 단가를 안전하게 읽는다", () => {
    expect(parseWon("8,000원")).toBe(8000);
    expect(parseWon("가격 확인 중")).toBe(0);
  });

  it("기존 공개 스냅샷만으로 예상 매출과 정산액을 계산한다", () => {
    const result = calculateBoardSettlement({
      branchId: "kuji-byeongdong", boardName: "테스트", totalCards: 80, openedCount: 31,
      remainingCards: 49, price: "8,000원", prizes: [], lastOne: null, updatedAt: "",
    });
    expect(result.grossSales).toBe(248000);
    expect(result.estimatedFee).toBe(8680);
    expect(result.estimatedNet).toBe(239320);
    expect(result.sellThrough).toBe(38.75);
  });
});
