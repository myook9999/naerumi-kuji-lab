import { z } from "zod";
import { adminServices, apiError, requireHospitalOwner } from "@/lib/firebase/admin";
import { firebasePaths } from "@/lib/firebase/paths";
import { sanitizeTreatmentSettings, validateTreatmentRates } from "@/lib/treatment-settings";
import type { TreatmentLog, TreatmentRate } from "@/types/hospital";

const rateSchema = z.object({ stage: z.number().int().min(0).max(15), probability: z.number().int().min(0).max(100), destroyProbability: z.number().int().min(0).max(100) });
const settingsSchema = z.object({ rates: z.array(rateSchema).length(16), notice: z.string().trim().min(2).max(200) });

export async function GET(request: Request) {
  try {
    await requireHospitalOwner(request);
    const { database } = adminServices();
    const [settingsSnapshot, logsSnapshot] = await Promise.all([
      database.ref(firebasePaths.treatmentSettings).get(),
      database.ref(firebasePaths.treatmentLogs).orderByChild("createdAt").limitToLast(100).get(),
    ]);
    const settings = sanitizeTreatmentSettings(settingsSnapshot.val());
    const rawLogs = logsSnapshot.val() as Record<string, Omit<TreatmentLog, "id">> | null;
    const logs = Object.entries(rawLogs || {}).map(([id, log]) => ({ id, ...log })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Response.json({ settings, logs });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireHospitalOwner(request);
    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "강화 확률과 공지 내용을 다시 확인해 주세요." }, { status: 400 });
    const validationError = validateTreatmentRates(parsed.data.rates as TreatmentRate[]);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });
    const settings = { ...parsed.data, updatedAt: new Date().toISOString(), updatedBy: owner.uid };
    await adminServices().database.ref(firebasePaths.treatmentSettings).set(settings);
    return Response.json({ settings: sanitizeTreatmentSettings(settings) });
  } catch (error) {
    return apiError(error);
  }
}
