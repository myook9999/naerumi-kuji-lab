import { apiError, getHospitalSession, requireFirebaseUser } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const session = await getHospitalSession(user.uid, user.email || "");
    if (!session) {
      return Response.json({ error: "가입 신청 정보를 찾을 수 없습니다." }, { status: 404 });
    }
    return Response.json({ session });
  } catch (error) {
    return apiError(error);
  }
}
