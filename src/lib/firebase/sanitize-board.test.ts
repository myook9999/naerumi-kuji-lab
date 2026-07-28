import { describe, expect, it } from "vitest";
import { sanitizeBoardCollection, sanitizeBoardSnapshot } from "./sanitize-board";
import { firebasePaths } from "./paths";

describe("쿠지병동 Firebase 안전 경계", () => {
  it("고정된 쿠지병동 공개 스냅샷만 사용한다", () => {
    expect(firebasePaths.boardSnapshot).toBe("web/kuji-byeongdong/publicBoards");
    expect(Object.values(firebasePaths).join(" ")).not.toContain("ownerApi");
    expect(Object.values(firebasePaths).join(" ")).not.toContain("serverData");
    expect(firebasePaths.webRoot).toBe("web/kuji-byeongdong");
    expect(firebasePaths.winnings).toBe("web/kuji-byeongdong/winnings");
    expect(firebasePaths.shippingAddresses).toBe("web/kuji-byeongdong/shippingAddresses");
  });

  it("공개 화면에 불필요한 원본 필드를 전달하지 않는다", () => {
    const result = sanitizeBoardSnapshot({
      branchId: "other-branch",
      boardName: "테스트 쿠지",
      totalCards: 10,
      openedCount: 4,
      history: [{ customer: "비공개" }],
      coinLogs: [{ createdBy: "비공개" }],
      account: "비공개 계좌",
      prizes: [{ id: "a", name: "A상", img: "image.png", left: true }],
    });
    expect(result.branchId).toBe("kuji-byeongdong");
    expect(result.remainingCards).toBe(6);
    expect(result).not.toHaveProperty("history");
    expect(result).not.toHaveProperty("coinLogs");
    expect(result).not.toHaveProperty("account");
  });

  it("전체판 실시간 스냅샷도 개수 제한과 재정제를 적용한다", () => {
    const result = sanitizeBoardCollection({
      currentIndex: 1,
      featuredIndex: 0,
      sourceUpdatedAt: "2026-07-25T00:00:00.000Z",
      boards: [
        { id: "one", boardName: "첫 판", totalCards: 10, openedCount: 3, customerResults: [{ nickname: "환자", randomGoodsCount: 2, totalDraws: 3, upperPrizes: [{ name: "A상", count: 1 }], account: "제외" }] },
        { id: "two", boardName: "둘째 판", totalCards: 20, openedCount: 5 },
      ],
    });
    expect(result.boards).toHaveLength(2);
    expect(result.currentIndex).toBe(1);
    expect(result.boards[0].customerResults?.[0]).toMatchObject({ nickname: "환자", randomGoodsCount: 2 });
    expect(result.boards[0].customerResults?.[0]).not.toHaveProperty("account");
  });

  it("빈 값이나 중복된 판 ID를 고유한 선택 ID로 보정한다", () => {
    const result = sanitizeBoardCollection({
      boards: [
        { id: "", sourceIndex: 0, boardName: "첫 판", totalCards: 10, openedCount: 1 },
        { id: "", sourceIndex: 0, boardName: "둘째 판", totalCards: 10, openedCount: 2 },
        { id: "same", sourceIndex: 2, boardName: "셋째 판", totalCards: 10, openedCount: 3 },
        { id: "same", sourceIndex: 3, boardName: "넷째 판", totalCards: 10, openedCount: 4 },
      ],
    });
    const ids = result.boards.map((board) => board.id);

    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(result.boards.length);
  });
});
