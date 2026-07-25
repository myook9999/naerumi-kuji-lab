import { MAX_TREATMENT_STAGE, treatmentStages } from "@/config/hospital";
import type { TreatmentRate } from "@/types/hospital";

export type TreatmentOutcome = "success" | "failed" | "destroyed";

export function clampTreatmentStage(value: unknown) {
  return Math.min(MAX_TREATMENT_STAGE, Math.max(0, Number(value) || 0));
}

export function resolveTreatmentOutcome(beforeStage: number, roll: number, rates?: TreatmentRate[]) {
  const safeStage = clampTreatmentStage(beforeStage);
  if (safeStage >= MAX_TREATMENT_STAGE) throw new Error("이미 15강 완치 판정을 받았습니다.");

  const baseTarget = treatmentStages[safeStage + 1];
  const configuredRate = rates?.find((rate) => rate.stage === safeStage + 1);
  const target = {
    ...baseTarget,
    probability: configuredRate?.probability ?? baseTarget.probability,
    destroyProbability: configuredRate?.destroyProbability ?? baseTarget.destroyProbability,
  };
  const normalizedRoll = Math.min(99.9999, Math.max(0, roll));
  const outcome: TreatmentOutcome = normalizedRoll < target.probability
    ? "success"
    : normalizedRoll < target.probability + target.destroyProbability
      ? "destroyed"
      : "failed";

  return {
    outcome,
    afterStage: outcome === "success" ? safeStage + 1 : outcome === "destroyed" ? 0 : safeStage,
    target,
  };
}
