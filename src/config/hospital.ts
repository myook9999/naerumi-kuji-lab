export const hospital = {
  branchId: "kuji-byeongdong",
  storeId: "KujiHospital_Store_01",
  name: "쿠지병동",
  ownerName: "쿠지병동 사장님",
  boardSnapshotPath: "branches/kuji-byeongdong/boards/current",
  webRootPath: "web/kuji-byeongdong",
  colors: {
    primary: "#C95F5C",
    background: "#FFF8EF",
    secondary: "#6B4F45",
  },
} as const;

export const treatmentStages = [
  { name: "접수", description: "치료 접수가 완료됐어요", cost: 0, probability: 100 },
  { name: "초진", description: "쿠지 증상을 살펴보는 단계예요", cost: 500, probability: 92 },
  { name: "정밀 검사", description: "더 정확한 처방을 준비해요", cost: 900, probability: 82 },
  { name: "집중 치료", description: "행운 회복을 위한 집중 치료예요", cost: 1400, probability: 70 },
  { name: "회복 관찰", description: "완치 전 마지막 경과 관찰이에요", cost: 2100, probability: 58 },
  { name: "완치", description: "쿠지 행운이 건강하게 회복됐어요", cost: 0, probability: 100 },
] as const;
