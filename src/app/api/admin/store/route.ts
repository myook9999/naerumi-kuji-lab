import { z } from "zod";
import { adminServices, apiError, requireHospitalOwner } from "@/lib/firebase/admin";
import { firebasePaths } from "@/lib/firebase/paths";
import { safePointPurchase, safeStoreImageUrl, safeStoreProduct, validateStoreProductDraft } from "@/lib/store";

const productFields = {
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).default(""),
  imageUrl: z.string().trim().max(2048).default("").refine((value) => !value || Boolean(safeStoreImageUrl(value)), "공개 HTTP/HTTPS 이미지 링크를 입력해 주세요."),
  pricePoints: z.number().int().min(1).max(10_000_000),
  stock: z.number().int().min(0).max(100_000),
  active: z.boolean(),
};
const createSchema = z.object(productFields);
const updateSchema = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/), ...productFields });

function entries(raw: unknown) {
  return raw && typeof raw === "object" ? Object.entries(raw as Record<string, unknown>) : [];
}

export async function GET(request: Request) {
  try {
    await requireHospitalOwner(request);
    const { database } = adminServices();
    const [productsSnapshot, purchasesSnapshot] = await Promise.all([
      database.ref(firebasePaths.storeProducts).get(),
      database.ref(firebasePaths.storePurchases).orderByChild("createdAt").limitToLast(200).get(),
    ]);
    const products = entries(productsSnapshot.val()).map(([id, value]) => safeStoreProduct(id, value)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const purchases = entries(purchasesSnapshot.val()).map(([id, value]) => safePointPurchase(id, value)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Response.json({ products, purchases });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireHospitalOwner(request);
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "상품 정보를 확인해 주세요." }, { status: 400 });
    const input = validateStoreProductDraft(parsed.data);
    const ref = adminServices().database.ref(firebasePaths.storeProducts).push();
    if (!ref.key) return Response.json({ error: "상품 번호를 만들지 못했습니다." }, { status: 500 });
    const now = new Date().toISOString();
    const product = { ...input, createdAt: now, updatedAt: now, createdBy: owner.uid, updatedBy: owner.uid };
    await ref.set(product);
    return Response.json({ product: safeStoreProduct(ref.key, product) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireHospitalOwner(request);
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "상품 정보를 확인해 주세요." }, { status: 400 });
    const input = validateStoreProductDraft(parsed.data);
    const ref = adminServices().database.ref(`${firebasePaths.storeProducts}/${parsed.data.id}`);
    const snapshot = await ref.get();
    if (!snapshot.exists()) return Response.json({ error: "수정할 상품을 찾을 수 없습니다." }, { status: 404 });
    const current = snapshot.val() as Record<string, unknown>;
    const product = { ...current, ...input, updatedAt: new Date().toISOString(), updatedBy: owner.uid };
    await ref.set(product);
    return Response.json({ product: safeStoreProduct(parsed.data.id, product) });
  } catch (error) {
    return apiError(error);
  }
}