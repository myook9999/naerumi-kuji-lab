import { adminServices, apiError, requireFirebaseUser } from "@/lib/firebase/admin";
import { firebasePaths } from "@/lib/firebase/paths";
import { sanitizeTreatmentSettings } from "@/lib/treatment-settings";

export async function GET(request: Request) {
  try {
    await requireFirebaseUser(request);
    const snapshot = await adminServices().database.ref(firebasePaths.treatmentSettings).get();
    return Response.json({ settings: sanitizeTreatmentSettings(snapshot.val()) });
  } catch (error) {
    return apiError(error);
  }
}
