import { z } from "zod";
import { adminServices, apiError, requireFirebaseUser, safeMember } from "@/lib/firebase/admin";
import { memberPath } from "@/lib/firebase/paths";

const schema = z.object({
  loginId: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{4,24}$/),
  nickname: z.string().trim().min(2).max(12),
});

export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || !user.email) return Response.json({ error: "가입 정보를 다시 확인해 주세요." }, { status: 400 });
    const expectedEmail = `${parsed.data.loginId}@members.kujihospital.local`;
    if (user.email.toLowerCase() !== expectedEmail) return Response.json({ error: "로그인 아이디가 인증 계정과 일치하지 않습니다." }, { status: 400 });

    const now = new Date().toISOString();
    const memberRef = adminServices().database.ref(memberPath(user.uid));
    const result = await memberRef.transaction((current) => current ? { ...current, name: parsed.data.nickname, updatedAt: now } : {
      loginId: parsed.data.loginId,
      email: user.email,
      name: parsed.data.nickname,
      phone: "",
      status: "pending",
      points: 0,
      treatmentStage: 0,
      createdAt: now,
      updatedAt: now,
    });
    return Response.json({ member: safeMember(user.uid, result.snapshot.val()) });
  } catch (error) {
    return apiError(error);
  }
}