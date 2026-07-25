export const hospital = {
  branchId: "kuji-byeongdong",
  storeId: "KujiHospital_Store_01",
  name: "쿠지병동",
  ownerName: "쿠지병동 사장님",
  boardSnapshotPath: "web/kuji-byeongdong/publicBoards",
  webRootPath: "web/kuji-byeongdong",
  colors: {
    primary: "#C95F5C",
    background: "#FFF8EF",
    secondary: "#6B4F45",
  },
} as const;

export const treatmentStages = [
  { name: "0강 입원 접수", description: "강화 치료를 시작할 준비가 완료됐어요", cost: 0, probability: 100, destroyProbability: 0 },
  { name: "1강 기본 진단", description: "쿠지 증상을 가볍게 확인해요", cost: 500, probability: 95, destroyProbability: 0 },
  { name: "2강 초진 치료", description: "행운 회복을 위한 첫 처방이에요", cost: 700, probability: 90, destroyProbability: 0 },
  { name: "3강 정밀 검사", description: "쿠지 상태를 더 자세히 살펴봐요", cost: 900, probability: 85, destroyProbability: 0 },
  { name: "4강 처방 조정", description: "환자에게 맞는 처방으로 조정해요", cost: 1200, probability: 80, destroyProbability: 0 },
  { name: "5강 집중 치료 I", description: "본격적인 행운 회복 치료를 시작해요", cost: 1600, probability: 75, destroyProbability: 1 },
  { name: "6강 집중 치료 II", description: "더 강한 처방으로 회복을 끌어올려요", cost: 2100, probability: 68, destroyProbability: 2 },
  { name: "7강 회복 유도", description: "쿠지 운을 안정적으로 되살려요", cost: 2700, probability: 60, destroyProbability: 4 },
  { name: "8강 안정화 치료", description: "회복된 행운을 단단히 고정해요", cost: 3400, probability: 52, destroyProbability: 7 },
  { name: "9강 행운 재활", description: "더 높은 행운을 견딜 수 있게 훈련해요", cost: 4300, probability: 44, destroyProbability: 10 },
  { name: "10강 고위험 처방", description: "위험을 감수하고 강한 처방을 시도해요", cost: 5400, probability: 36, destroyProbability: 14 },
  { name: "11강 특수 치료", description: "희귀 처방으로 한계를 넘어가요", cost: 6800, probability: 29, destroyProbability: 19 },
  { name: "12강 기적 회복", description: "기적에 가까운 회복을 유도해요", cost: 8500, probability: 22, destroyProbability: 25 },
  { name: "13강 완치 임박", description: "완치를 앞둔 마지막 고비를 치료해요", cost: 10500, probability: 16, destroyProbability: 32 },
  { name: "14강 최종 관찰", description: "최종 판정을 위한 극한 치료예요", cost: 13000, probability: 11, destroyProbability: 40 },
  { name: "15강 완치 판정", description: "쿠지 행운이 최고 단계로 완치됐어요", cost: 16000, probability: 7, destroyProbability: 50 },
] as const;

export const MAX_TREATMENT_STAGE = treatmentStages.length - 1;

export const defaultTreatmentRates = treatmentStages.map((stage, index) => ({
  stage: index,
  probability: stage.probability,
  destroyProbability: stage.destroyProbability,
}));
