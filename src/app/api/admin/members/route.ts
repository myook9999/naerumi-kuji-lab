import { z } from "zod";
import { adminServices, apiError, requireHospitalOwner, safeMember } from "@/lib/firebase/admin";
import { firebasePaths, memberPath } from "@/lib/firebase/paths";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), uid: z.string().min(1), status: z.enum(["approved", "rejected"]) }),
  z.object({ action: z.literal("points"), uid: z.string().min(1), amount: z.number().int().min(-1000000).max(1000000), memo: z.string().trim().min(2).max(100) }),
]);

export async function GET(request: Request) {
  try {
    await requireHospitalOwner(request);
    const snapshot = await adminServices().database.ref(firebasePaths.members).get();
    const value = snapshot.val() as Record<string, unknown> | null;
    const members = Object.entries(value || {}).map(([uid, member]) => safeMember(uid, member));
    members.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Response.json({ members });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireHospitalOwner(request);
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "변경 내용을 다시 확인해 주세요." }, { status: 400 });

    const { database } = adminServices();
    const targetRef = database.ref(memberPath(parsed.data.uid));
    let failure = "";
    const now = new Date().toISOString();
    const result = await targetRef.transaction((current) => {
      if (!current) {
        failure = "회원을 찾을 수 없습니다.";
        return;
      }
      if (parsed.data.action === "status") {
        return {
          ...current,
          status: parsed.data.status,
          approvedAt: parsed.data.status === "approved" ? now : current.approvedAt || null,
          updatedAt: now,
        };
      }
      const nextPoints = (Number(current.points) || 0) + parsed.data.amount;
      if (nextPoints < 0) {
        failure = "보유 포인트보다 많이 차감할 수 없습니다.";
        return;
      }
      return { ...current, points: nextPoints, updatedAt: now };
    });
    if (failure) return Response.json({ error: failure }, { status: 400 });
    if (!result.committed) return Response.json({ error: "변경 사항이 저장되지 않았습니다." }, { status: 409 });

    if (parsed.data.action === "points") {
      await database.ref(`${firebasePaths.pointLogs}/${parsed.data.uid}`).push({
        amount: parsed.data.amount,
        memo: parsed.data.memo,
        createdAt: now,
        createdBy: owner.uid,
      });
    }
    return Response.json({ member: safeMember(parsed.data.uid, result.snapshot.val()) });
  } catch (error) {
    return apiError(error);
  }
}
