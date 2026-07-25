import { describe, expect, it } from "vitest";
import { sanitizeBoardSnapshot } from "./sanitize-board";
import { firebasePaths } from "./paths";

describe("쿠지병동 Firebase 안전 경계", () => {
  it("고정된 쿠지병동 공개 스냅샷만 사용한다", () => {
    expect(firebasePaths.boardSnapshot).toBe("branches/kuji-byeongdong/boards/current");
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
});
