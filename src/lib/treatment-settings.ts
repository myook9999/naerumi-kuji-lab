import { defaultTreatmentRates, MAX_TREATMENT_STAGE } from "@/config/hospital";
import type { TreatmentRate, TreatmentSettings } from "@/types/hospital";

export const defaultTreatmentSettings: TreatmentSettings = {
  rates: defaultTreatmentRates.map((rate) => ({ ...rate })),
  notice: "기본 15강 강화 확률표가 적용 중입니다.",
  updatedAt: "",
};

export function validateTreatmentRates(rates: TreatmentRate[]) {
  if (rates.length !== MAX_TREATMENT_STAGE + 1) return "0강부터 15강까지 모든 확률이 필요합니다.";
  for (let stage = 0; stage <= MAX_TREATMENT_STAGE; stage += 1) {
    const rate = rates.find((item) => item.stage === stage);
    if (!rate) return `${stage}강 확률이 없습니다.`;
    if (!Number.isInteger(rate.probability) || rate.probability < 0 || rate.probability > 100) return `${stage}강 성공률을 확인해 주세요.`;
    if (!Number.isInteger(rate.destroyProbability) || rate.destroyProbability < 0 || rate.destroyProbability > 100) return `${stage}강 파괴율을 확인해 주세요.`;
    if (rate.probability + rate.destroyProbability > 100) return `${stage}강 성공률과 파괴율의 합은 100% 이하여야 합니다.`;
    if (stage > 0) {
      const previous = rates.find((item) => item.stage === stage - 1);
      if (previous && rate.probability >= previous.probability) return "상위 강화 단계의 성공률은 이전 단계보다 낮아야 합니다.";
    }
  }
  const start = rates.find((item) => item.stage === 0);
  if (!start || start.probability !== 100 || start.destroyProbability !== 0) return "0강 시작 단계는 성공률 100%, 파괴율 0%로 고정됩니다.";
  return "";
}

export function sanitizeTreatmentSettings(raw: unknown): TreatmentSettings {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const source = Array.isArray(value.rates) ? value.rates : [];
  const rates = defaultTreatmentSettings.rates.map((fallback) => {
    const candidate = source.find((item) => item && typeof item === "object" && Number((item as Record<string, unknown>).stage) === fallback.stage) as Record<string, unknown> | undefined;
    return candidate ? {
      stage: fallback.stage,
      probability: Math.round(Number(candidate.probability)),
      destroyProbability: Math.round(Number(candidate.destroyProbability)),
    } : { ...fallback };
  });
  return validateTreatmentRates(rates) ? { ...defaultTreatmentSettings } : {
    rates,
    notice: String(value.notice || defaultTreatmentSettings.notice).slice(0, 200),
    updatedAt: String(value.updatedAt || ""),
  };
}
