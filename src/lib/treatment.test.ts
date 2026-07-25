import { describe, expect, it } from "vitest";
import { MAX_TREATMENT_STAGE, treatmentStages } from "@/config/hospital";
import { clampTreatmentStage, resolveTreatmentOutcome } from "./treatment";
import { defaultTreatmentSettings, validateTreatmentRates } from "./treatment-settings";

describe("15강 강화 치료", () => {
  it("0강을 포함해 최대 15강까지 정의한다", () => {
    expect(MAX_TREATMENT_STAGE).toBe(15);
    expect(treatmentStages).toHaveLength(16);
  });

  it("강화 단계가 높아질수록 성공 확률은 낮아진다", () => {
    const rates = treatmentStages.slice(1).map((stage) => stage.probability);
    expect(rates.every((rate, index) => index === 0 || rate < rates[index - 1])).toBe(true);
  });

  it("1~4강은 파괴되지 않고 5강부터 파괴 확률이 생긴다", () => {
    expect(treatmentStages.slice(1, 5).every((stage) => stage.destroyProbability === 0)).toBe(true);
    expect(treatmentStages.slice(5).every((stage) => stage.destroyProbability > 0)).toBe(true);
  });

  it("성공, 안전 실패, 파괴 결과를 경계값대로 판정한다", () => {
    expect(resolveTreatmentOutcome(9, 35.99)).toMatchObject({ outcome: "success", afterStage: 10 });
    expect(resolveTreatmentOutcome(9, 60)).toMatchObject({ outcome: "failed", afterStage: 9 });
    expect(resolveTreatmentOutcome(9, 40)).toMatchObject({ outcome: "destroyed", afterStage: 0 });
  });

  it("저장된 비정상 단계를 0~15강 범위로 보정한다", () => {
    expect(clampTreatmentStage(-4)).toBe(0);
    expect(clampTreatmentStage(99)).toBe(15);
  });

  it("관리자 변경 확률을 실제 판정에 사용한다", () => {
    const rates = defaultTreatmentSettings.rates.map((rate) => rate.stage === 10 ? { ...rate, probability: 35, destroyProbability: 20 } : { ...rate });
    expect(resolveTreatmentOutcome(9, 34.99, rates)).toMatchObject({ outcome: "success", afterStage: 10 });
    expect(resolveTreatmentOutcome(9, 40, rates)).toMatchObject({ outcome: "destroyed", afterStage: 0 });
  });

  it("확률 합계와 단계별 성공률 감소를 검증한다", () => {
    const invalidSum = defaultTreatmentSettings.rates.map((rate) => rate.stage === 10 ? { ...rate, probability: 80, destroyProbability: 30 } : { ...rate });
    expect(validateTreatmentRates(invalidSum)).toContain("100%");
    const invalidOrder = defaultTreatmentSettings.rates.map((rate) => rate.stage === 2 ? { ...rate, probability: 96 } : { ...rate });
    expect(validateTreatmentRates(invalidOrder)).toContain("이전 단계보다 낮아야");
  });
});
