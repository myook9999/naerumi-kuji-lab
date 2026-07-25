import { z } from "zod";
import { adminServices, apiError, requireHospitalOwner } from "@/lib/firebase/admin";
import { firebasePaths } from "@/lib/firebase/paths";

export async function GET(request: Request) {
  try {
    await requireHospitalOwner(request);
    const snapshot = await adminServices().database.ref(`${firebasePaths.settings}/boardVisible`).get();
    return Response.json({ boardVisible: snapshot.exists() ? snapshot.val() === true : true });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireHospitalOwner(request);
    const parsed = z.object({ boardVisible: z.boolean() }).safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "공개 설정을 확인해 주세요." }, { status: 400 });
    await adminServices().database.ref(`${firebasePaths.settings}/boardVisible`).set(parsed.data.boardVisible);
    await adminServices().database.ref(`${firebasePaths.settings}/updatedBy`).set(owner.uid);
    await adminServices().database.ref(`${firebasePaths.settings}/updatedAt`).set(new Date().toISOString());
    return Response.json(parsed.data);
  } catch (error) {
    return apiError(error);
  }
}
