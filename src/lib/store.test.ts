import { describe, expect, it } from "vitest";
import { checkPointPurchase, safeStoreImageUrl, safeStoreProduct, validateStoreProductDraft } from "./store";
import { firebasePaths } from "./firebase/paths";

const product = safeStoreProduct("product-1", { name: "행운 상품", description: "설명", imageUrl: "https://example.com/item.jpg", pricePoints: 3000, stock: 5, active: true });

describe("포인트 상점 안전 규칙", () => {
  it("쿠지 프로그램 경로와 분리된 사이트 전용 하위 경로만 사용한다", () => {
    expect(firebasePaths.storeProducts).toBe("web/kuji-byeongdong/storeProducts");
    expect(firebasePaths.storePurchases).toBe("web/kuji-byeongdong/storePurchases");
    expect(`${firebasePaths.storeProducts} ${firebasePaths.storePurchases}`).not.toMatch(/ownerApi|serverData|publicBoards/);
  });

  it("공개 이미지 링크와 자체 에셋만 허용한다", () => {
    expect(safeStoreImageUrl("https://example.com/item.jpg")).toBe("https://example.com/item.jpg");
    expect(safeStoreImageUrl("/assets/kuji-hospital/ticket.png")).toBe("/assets/kuji-hospital/ticket.png");
    expect(safeStoreImageUrl("http://127.0.0.1/private.jpg")).toBe("");
    expect(safeStoreImageUrl("http://192.168.0.10/private.jpg")).toBe("");
    expect(safeStoreImageUrl("data:image/png;base64,test")).toBe("");
    expect(safeStoreImageUrl("https://user:pass@example.com/item.jpg")).toBe("");
  });

  it("상품 입력 가격과 재고를 검증한다", () => {
    expect(validateStoreProductDraft({ name: "행운 상품", description: "설명", imageUrl: "https://example.com/item.jpg", pricePoints: 3000, stock: 5, active: true })).toMatchObject({ pricePoints: 3000, stock: 5 });
    expect(() => validateStoreProductDraft({ name: "행운 상품", description: "", imageUrl: "http://localhost/item.jpg", pricePoints: 3000, stock: 5, active: true })).toThrow("공개 HTTP/HTTPS");
  });

  it("재고와 포인트가 충분할 때만 구매 금액을 계산한다", () => {
    expect(checkPointPurchase(product, 2, 10000)).toEqual({ ok: true, totalPoints: 6000, remainingPoints: 4000 });
    expect(checkPointPurchase(product, 6, 10000)).toMatchObject({ ok: false, error: "상품 재고가 부족합니다." });
    expect(checkPointPurchase(product, 2, 5000)).toMatchObject({ ok: false, error: "보유 포인트가 부족합니다." });
  });
});