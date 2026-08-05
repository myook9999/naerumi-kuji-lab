import { createHash } from "node:crypto";
import { z } from "zod";
import { adminServices, apiError, requireFirebaseUser, safeMember } from "@/lib/firebase/admin";
import { firebasePaths, memberPath } from "@/lib/firebase/paths";
import { checkPointPurchase, safePointPurchase, safeStoreProduct } from "@/lib/store";
import type { PointPurchase } from "@/types/hospital";

type UnknownRecord = Record<string, unknown>;
function record(value: unknown): UnknownRecord { return value && typeof value === "object" ? value as UnknownRecord : {}; }

const schema = z.object({
  productId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  quantity: z.number().int().min(1).max(10),
  requestId: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
});

export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "상품과 구매 수량을 확인해 주세요." }, { status: 400 });
    const { database } = adminServices();
    const productRef = database.ref(`${firebasePaths.storeProducts}/${parsed.data.productId}`);
    const customerRef = database.ref(memberPath(user.uid));
    const purchaseId = createHash("sha256").update(`${user.uid}:${parsed.data.requestId}`).digest("hex");
    const purchaseRef = database.ref(`${firebasePaths.storePurchases}/${purchaseId}`);
    const existingPurchase = await purchaseRef.get();
    if (existingPurchase.exists()) {
      const [productSnapshot, memberSnapshot] = await Promise.all([productRef.get(), customerRef.get()]);
      return Response.json({ purchase: safePointPurchase(purchaseId, existingPurchase.val()), product: safeStoreProduct(parsed.data.productId, productSnapshot.val()), session: safeMember(user.uid, memberSnapshot.val()) });
    }

    let failure = "";
    let reservation: { quantity: number; unitPrice: number; totalPoints: number } | null = null;
    const now = new Date().toISOString();
    const productResult = await productRef.transaction((current) => {
      if (!current) { failure = "구매할 상품을 찾을 수 없습니다."; return; }
      const rawProduct = record(current);
      const reservations = record(rawProduct.pointStoreReservations);
      const existing = record(reservations[parsed.data.requestId]);
      if (existing.totalPoints) {
        reservation = { quantity: Number(existing.quantity), unitPrice: Number(existing.unitPrice), totalPoints: Number(existing.totalPoints) };
        return current;
      }
      const product = safeStoreProduct(parsed.data.productId, rawProduct);
      const check = checkPointPurchase(product, parsed.data.quantity, Number.MAX_SAFE_INTEGER);
      if (!check.ok) { failure = check.error; return; }
      reservation = { quantity: parsed.data.quantity, unitPrice: product.pricePoints, totalPoints: check.totalPoints };
      return { ...rawProduct, stock: product.stock - parsed.data.quantity, updatedAt: now, pointStoreReservations: { ...reservations, [parsed.data.requestId]: { ...reservation, uid: user.uid, createdAt: now } } };
    });
    if (failure) return Response.json({ error: failure }, { status: 400 });
    if (!productResult.committed || !reservation) return Response.json({ error: "상품 재고를 확보하지 못했습니다." }, { status: 409 });
    const reserved = reservation as { quantity: number; unitPrice: number; totalPoints: number };

    const releaseReservation = async () => {
      await productRef.transaction((current) => {
        if (!current) return current;
        const rawProduct = record(current);
        const reservations = record(rawProduct.pointStoreReservations);
        if (!reservations[parsed.data.requestId]) return current;
        const remaining = { ...reservations };
        delete remaining[parsed.data.requestId];
        return { ...rawProduct, stock: Math.max(0, Number(rawProduct.stock) || 0) + reserved.quantity, pointStoreReservations: remaining, updatedAt: new Date().toISOString() };
      });
    };

    let memberFailure = "";
    const memberResult = await customerRef.transaction((current) => {
      if (!current || current.status !== "approved") { memberFailure = "승인된 고객만 포인트 상점을 이용할 수 있습니다."; return; }
      const rawMember = record(current);
      const requests = record(rawMember.pointStorePurchases);
      if (requests[parsed.data.requestId]) return current;
      const points = Math.max(0, Number(rawMember.points) || 0);
      if (points < reserved.totalPoints) { memberFailure = "보유 포인트가 부족합니다."; return; }
      return { ...rawMember, points: points - reserved.totalPoints, pointStorePurchases: { ...requests, [parsed.data.requestId]: { purchaseId, productId: parsed.data.productId, quantity: reserved.quantity, totalPoints: reserved.totalPoints, createdAt: now } }, updatedAt: now };
    });
    if (memberFailure || !memberResult.committed) {
      await releaseReservation();
      return Response.json({ error: memberFailure || "포인트를 차감하지 못했습니다." }, { status: memberFailure ? 400 : 409 });
    }

    const product = safeStoreProduct(parsed.data.productId, productResult.snapshot.val());
    const session = safeMember(user.uid, memberResult.snapshot.val());
    const purchase: Omit<PointPurchase, "id"> = { requestId: parsed.data.requestId, uid: user.uid, loginId: session.loginId, customerName: session.name, productId: product.id, productName: product.name, imageUrl: product.imageUrl, quantity: reserved.quantity, unitPrice: reserved.unitPrice, totalPoints: reserved.totalPoints, createdAt: now };
    await purchaseRef.set(purchase);
    await productRef.transaction((current) => {
      if (!current) return current;
      const rawProduct = record(current);
      const reservations = { ...record(rawProduct.pointStoreReservations) };
      delete reservations[parsed.data.requestId];
      return { ...rawProduct, pointStoreReservations: reservations };
    });
    const finalProduct = await productRef.get();
    return Response.json({ purchase: safePointPurchase(purchaseId, purchase), product: safeStoreProduct(parsed.data.productId, finalProduct.val()), session });
  } catch (error) {
    return apiError(error);
  }
}