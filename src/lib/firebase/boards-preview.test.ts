import { describe, expect, it } from "vitest";
import preview from "@/data/kuji-byeongdong-boards-preview.json";
import type { PublicBoardCollectionPreview } from "@/types/hospital";

const collection = preview as PublicBoardCollectionPreview;

describe("쿠지병동 전체판 공개 정제", () => {
  it("실제 캐시의 전체 10개 판과 판별 고객 결과를 포함한다", () => {
    expect(collection.boards).toHaveLength(10);
    expect(collection.boards[1].boardName).toBe("1000장 2탄");
    expect(collection.boards[0].customerResults).toHaveLength(7);
    expect(collection.boards[0].customerResults?.reduce((sum, customer) => sum + customer.randomGoodsCount, 0)).toBe(285);
  });

  it("원본 고위험 필드를 공개 JSON에 포함하지 않는다", () => {
    const serialized = JSON.stringify(collection);
    for (const field of ["history", "customerQueue", "account", "pool", "opened", "num", "time", "winNum", "phone", "address"]) {
      expect(serialized).not.toContain(`"${field}"`);
    }
  });
});
