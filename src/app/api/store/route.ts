import { adminServices, apiError, getHospitalSession, requireFirebaseUser } from "@/lib/firebase/admin";
import { firebasePaths } from "@/lib/firebase/paths";
import { safePointPurchase, safeStoreProduct } from "@/lib/store";

function entries(raw: unknown) {
  return raw && typeof raw === "object" ? Object.entries(raw as Record<string, unknown>) : [];
}

export async function GET(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const session = await getHospitalSession(user.uid, user.email || "");
    if (!session || session.role !== "patient" || session.status !== "approved") {
      return Response.json({ error: "승인된 고객만 포인트 상점을 이용할 수 있습니다." }, { status: 403 });
    }
    const { database } = adminServices();
    const [productsSnapshot, purchasesSnapshot] = await Promise.all([
      database.ref(firebasePaths.storeProducts).get(),
      database.ref(firebasePaths.storePurchases).orderByChild("uid").equalTo(user.uid).limitToLast(50).get(),
    ]);
    const products = entries(productsSnapshot.val()).map(([id, value]) => safeStoreProduct(id, value)).filter((product) => product.active).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const purchases = entries(purchasesSnapshot.val()).map(([id, value]) => safePointPurchase(id, value)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Response.json({ products, purchases });
  } catch (error) {
    return apiError(error);
  }
}