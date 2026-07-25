import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  throw new Error("사용법: node scripts/sanitize-kuji-boards-preview.mjs <원본 캐시> <출력 JSON>");
}

const raw = JSON.parse(await readFile(resolve(input), "utf8"));
const boards = Array.isArray(raw.boards) ? raw.boards : [];
const safeText = (value, fallback = "") => typeof value === "string" ? value.slice(0, 180) : fallback;
const safeNumber = (value) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.floor(Number(value)) : 0;
const sourceUpdatedAt = safeText(raw.updatedAt || raw.savedAt);

const publicBoards = boards.map((board, sourceIndex) => {
  const totalCards = safeNumber(board?.totalCards);
  const openedCount = Math.min(totalCards, Array.isArray(board?.opened) ? board.opened.length : safeNumber(board?.openedCount));
  const inventory = Array.isArray(board?.inventory) ? board.inventory.slice(0, 50) : [];
  const prizes = inventory.map((prize, index) => {
    const remainingCount = safeNumber(prize?.count);
    return {
      id: `board-${sourceIndex}-prize-${index}`,
      name: safeText(prize?.name, `상품 ${index + 1}`),
      image: "",
      available: remainingCount > 0,
      remainingCount,
    };
  });
  const lastOne = board?.lastOne && typeof board.lastOne === "object" ? {
    id: `board-${sourceIndex}-last-one`,
    name: safeText(board.lastOne.name, "라스트원 상품"),
    image: "",
    available: openedCount < totalCards,
    remainingCount: openedCount < totalCards ? 1 : 0,
  } : null;
  const history = Array.isArray(board?.history) ? board.history : [];
  const customerMap = new Map();
  for (const entry of history) {
    const nickname = safeText(entry?.nick, "이름 미등록");
    const current = customerMap.get(nickname) ?? { nickname, totalDraws: 0, randomGoodsCount: 0, prizes: new Map() };
    current.totalDraws += 1;
    if (entry?.isWin === true) {
      const prizeName = safeText(entry?.name, "상위상");
      current.prizes.set(prizeName, (current.prizes.get(prizeName) ?? 0) + 1);
    } else {
      current.randomGoodsCount += 1;
    }
    customerMap.set(nickname, current);
  }
  const customerResults = [...customerMap.values()]
    .map((customer) => ({
      id: "",
      nickname: customer.nickname,
      totalDraws: customer.totalDraws,
      randomGoodsCount: customer.randomGoodsCount,
      upperPrizes: [...customer.prizes.entries()].map(([name, count]) => ({ name, count })),
    }))
    .sort((a, b) => (b.upperPrizes.length - a.upperPrizes.length) || (b.totalDraws - a.totalDraws))
    .map((customer, index) => ({ ...customer, id: `board-${sourceIndex}-customer-${index}` }));
  return {
    id: `cache-board-${sourceIndex}`,
    sourceIndex,
    isProgramCurrent: sourceIndex === safeNumber(raw.currentIndex),
    branchId: "kuji-byeongdong",
    boardName: safeText(board?.name, `쿠지판 ${sourceIndex + 1}`),
    totalCards,
    openedCount,
    remainingCards: Math.max(0, totalCards - openedCount),
    price: safeText(board?.price == null ? "" : String(board.price)),
    prizes,
    lastOne,
    customerResults,
    updatedAt: sourceUpdatedAt,
  };
});

const featuredIndex = publicBoards.reduce((best, board, index, list) => {
  const score = (board.remainingCards > 0 && board.boardName.toLowerCase() !== "test" ? 1_000_000 : 0) + board.prizes.length * 1_000 + board.openedCount;
  const bestBoard = list[best];
  const bestScore = (bestBoard.remainingCards > 0 && bestBoard.boardName.toLowerCase() !== "test" ? 1_000_000 : 0) + bestBoard.prizes.length * 1_000 + bestBoard.openedCount;
  return score > bestScore ? index : best;
}, 0);

const result = {
  sourceUpdatedAt,
  currentIndex: Math.min(Math.max(0, safeNumber(raw.currentIndex)), Math.max(0, publicBoards.length - 1)),
  featuredIndex,
  boards: publicBoards,
};
await writeFile(resolve(output), `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`정제 완료: ${publicBoards.length}개 쿠지판 → ${resolve(output)}`);
