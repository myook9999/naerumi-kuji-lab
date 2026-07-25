import { randomInt } from "node:crypto";
import { MAX_TREATMENT_STAGE } from "@/config/hospital";
import { adminServices, apiError, requireFirebaseUser, safeMember } from "@/lib/firebase/admin";
import { firebasePaths, memberPath } from "@/lib/firebase/paths";
import { clampTreatmentStage, resolveTreatmentOutcome } from "@/lib/treatment";
import { sanitizeTreatmentSettings } from "@/lib/treatment-settings";
import type { TreatmentResult } from "@/types/hospital";

export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const { database } = adminServices();
    const targetRef = database.ref(memberPath(user.uid));
    const settingsSnapshot = await database.ref(firebasePaths.treatmentSettings).get();
    const settings = sanitizeTreatmentSettings(settingsSnapshot.val());
    const now = new Date().toISOString();
    const roll = randomInt(0, 10000) / 100;
    let failure = "";
    let treatment: TreatmentResult | null = null;

    const result = await targetRef.transaction((current) => {
      if (!current || current.status !== "approved") {
        failure = "관리자 승인 후 치료를 받을 수 있습니다.";
        return;
      }
      const beforeStage = clampTreatmentStage(current.treatmentStage);
      if (beforeStage >= MAX_TREATMENT_STAGE) {
        failure = "이미 15강 완치 판정을 받았습니다.";
        return;
      }
      const { outcome, afterStage, target: next } = resolveTreatmentOutcome(beforeStage, roll, settings.rates);
      const points = Math.max(0, Number(current.points) || 0);
      if (points < next.cost) {
        failure = "치료에 필요한 포인트가 부족합니다.";
        return;
      }
      treatment = {
        outcome,
        success: outcome === "success",
        destroyed: outcome === "destroyed",
        beforeStage,
        afterStage,
        cost: next.cost,
        points: points - next.cost,
        probability: next.probability,
        destroyProbability: next.destroyProbability,
        createdAt: now,
      };
      return {
        ...current,
        points: points - next.cost,
        treatmentStage: afterStage,
        lastTreatmentAt: now,
        updatedAt: now,
      };
    });

    if (failure) return Response.json({ error: failure }, { status: 400 });
    if (!result.committed || !treatment) {
      return Response.json({ error: "치료 기록이 저장되지 않았습니다." }, { status: 409 });
    }
    const treatmentLog = treatment as TreatmentResult;
    const session = safeMember(user.uid, result.snapshot.val());
    await database.ref(firebasePaths.treatmentLogs).push({ ...treatmentLog, uid: user.uid, loginId: session.loginId, name: session.name });
    return Response.json({ treatment: treatmentLog, session });
  } catch (error) {
    return apiError(error);
  }
}
