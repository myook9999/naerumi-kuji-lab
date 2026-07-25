import { z } from "zod";
import { adminServices, apiError, requireFirebaseUser } from "@/lib/firebase/admin";
import { safeShippingAddress, safeWinning } from "@/lib/firebase/fulfillment";
import { firebasePaths, shippingAddressPath } from "@/lib/firebase/paths";

const addressSchema = z.object({
  recipient: z.string().trim().min(2).max(40),
  phone: z.string().trim().min(8).max(30),
  postalCode: z.string().trim().min(3).max(12),
  address1: z.string().trim().min(5).max(120),
  address2: z.string().trim().max(120).default(""),
  memo: z.string().trim().max(120).default(""),
});

export async function GET(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const { database } = adminServices();
    const [addressSnapshot, winningsSnapshot] = await Promise.all([
      database.ref(shippingAddressPath(user.uid)).get(),
      database.ref(firebasePaths.winnings).orderByChild("uid").equalTo(user.uid).limitToLast(100).get(),
    ]);
    const rawWinnings = winningsSnapshot.val() as Record<string, unknown> | null;
    const winnings = Object.entries(rawWinnings || {}).map(([id, value]) => safeWinning(id, value));
    winnings.sort((a, b) => b.wonAt.localeCompare(a.wonAt));
    return Response.json({ address: safeShippingAddress(addressSnapshot.val()), winnings });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const parsed = addressSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "받는 분과 배송지 정보를 정확히 입력해 주세요." }, { status: 400 });
    const address = { ...parsed.data, updatedAt: new Date().toISOString() };
    await adminServices().database.ref(shippingAddressPath(user.uid)).set(address);
    return Response.json({ address });
  } catch (error) {
    return apiError(error);
  }
}
