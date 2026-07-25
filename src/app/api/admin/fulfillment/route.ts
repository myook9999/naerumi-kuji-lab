import { z } from "zod";
import { adminServices, apiError, requireHospitalOwner } from "@/lib/firebase/admin";
import { safeShippingAddress, safeWinning } from "@/lib/firebase/fulfillment";
import { firebasePaths, winningPath } from "@/lib/firebase/paths";

const shipmentSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  shippingStatus: z.enum(["address_required", "preparing", "shipped", "delivered"]),
  carrier: z.string().trim().max(40).default(""),
  trackingNumber: z.string().trim().max(60).default(""),
});

export async function GET(request: Request) {
  try {
    await requireHospitalOwner(request);
    const { database } = adminServices();
    const [winningsSnapshot, addressesSnapshot] = await Promise.all([
      database.ref(firebasePaths.winnings).orderByChild("wonAt").limitToLast(200).get(),
      database.ref(firebasePaths.shippingAddresses).orderByKey().limitToLast(200).get(),
    ]);
    const rawWinnings = winningsSnapshot.val() as Record<string, unknown> | null;
    const rawAddresses = addressesSnapshot.val() as Record<string, unknown> | null;
    const winnings = Object.entries(rawWinnings || {}).map(([id, value]) => safeWinning(id, value));
    winnings.sort((a, b) => b.wonAt.localeCompare(a.wonAt));
    const addresses = Object.fromEntries(Object.entries(rawAddresses || {}).map(([uid, value]) => [uid, safeShippingAddress(value)]));
    return Response.json({ winnings, addresses });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireHospitalOwner(request);
    const parsed = shipmentSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "배송 상태와 운송장 정보를 확인해 주세요." }, { status: 400 });
    if (parsed.data.shippingStatus === "shipped" && (!parsed.data.carrier || !parsed.data.trackingNumber)) {
      return Response.json({ error: "발송 완료 처리에는 택배사와 운송장 번호가 필요합니다." }, { status: 400 });
    }
    const ref = adminServices().database.ref(winningPath(parsed.data.id));
    let missing = false;
    const now = new Date().toISOString();
    const result = await ref.transaction((current) => {
      if (!current) { missing = true; return; }
      return {
        ...current,
        shippingStatus: parsed.data.shippingStatus,
        carrier: parsed.data.carrier || null,
        trackingNumber: parsed.data.trackingNumber || null,
        shippedAt: parsed.data.shippingStatus === "shipped" ? (current.shippedAt || now) : (parsed.data.shippingStatus === "delivered" ? current.shippedAt || now : null),
        fulfillmentUpdatedAt: now,
      };
    });
    if (missing || !result.committed) return Response.json({ error: "당첨 기록을 찾을 수 없습니다." }, { status: 404 });
    return Response.json({ winning: safeWinning(parsed.data.id, result.snapshot.val()) });
  } catch (error) {
    return apiError(error);
  }
}
