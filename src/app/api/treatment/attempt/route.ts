import { randomInt } from "node:crypto";
import { treatmentStages } from "@/config/hospital";
import { adminServices, apiError, requireFirebaseUser, safeMember } from "@/lib/firebase/admin";
import { firebasePaths, memberPath } from "@/lib/firebase/paths";
import type { TreatmentResult } from "@/types/hospital";

export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const { database } = adminServices();
    const targetRef = database.ref(memberPath(user.uid));
    const now = new Date().toISOString();
    const roll = randomInt(0, 10000) / 100;
    let failure = "";
    let treatment: TreatmentResult | null = null;

    const result = await targetRef.transaction((current) => {
      if (!current || current.status !== "approved") {
        failure = "관리자 승인 후 치료를 받을 수 있습니다.";
        return;
      }
      const beforeStage = Math.min(5, Math.max(0, Number(current.treatmentStage) || 0));
      if (beforeStage >= treatmentStages.length - 1) {
        failure = "이미 완치 판정을 받았습니다.";
        return;
      }
      const next = treatmentStages[beforeStage + 1];
      const points = Math.max(0, Number(current.points) || 0);
      if (points < next.cost) {
        failure = "치료에 필요한 포인트가 부족합니다.";
        return;
      }
      const success = roll < next.probability;
      const afterStage = success ? beforeStage + 1 : beforeStage;
      treatment = {
        success,
        beforeStage,
        afterStage,
        cost: next.cost,
        points: points - next.cost,
        probability: next.probability,
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
    await database.ref(`${firebasePaths.treatmentLogs}/${user.uid}`).push(treatment);
    return Response.json({ treatment, session: safeMember(user.uid, result.snapshot.val()) });
  } catch (error) {
    return apiError(error);
  }
}
