"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Minus, Plus, ReceiptText, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useHospital } from "@/components/hospital-provider";
import { StoreProductImage } from "@/components/store-product-image";
import { Badge, Button, Card, Modal } from "@/components/ui";
import type { StoreProduct } from "@/types/hospital";

export function PatientPointStore() {
  const hospital = useHospital();
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const { refreshStore } = hospital;
  useEffect(() => { refreshStore().catch((error) => toast.error(error instanceof Error ? error.message : "포인트 상점을 불러오지 못했습니다.")); }, [refreshStore]);
  const session = hospital.session;
  const products = hospital.storeProducts.filter((product) => product.active);
  const myPurchases = useMemo(() => hospital.pointPurchases.filter((purchase) => purchase.uid === session?.uid).slice(0, 12), [hospital.pointPurchases, session?.uid]);
  if (!session || session.role !== "patient") return null;
  const total = selected ? selected.pricePoints * quantity : 0;

  function open(product: StoreProduct) { setSelected(product); setQuantity(1); }
  async function purchase() {
    if (!selected) return;
    setBusy(true);
    try { await hospital.purchaseProduct(selected.id, quantity); setSelected(null); setQuantity(1); }
    catch (error) { toast.error(error instanceof Error ? error.message : "포인트 상품을 구매하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <section id="point-store" className="patient-section point-store-section"><div className="point-store-shell"><div className="hospital-section-title"><span>POINT STORE</span><h2>쿠지병동 포인트 상점</h2><p>사장님이 등록한 상품을 보유 포인트로 구매할 수 있습니다.</p></div><div className="point-store-balance"><Coins/><span><small>현재 사용 가능한 포인트</small><b>{session.points.toLocaleString()}P</b></span><p>구매가 완료되면 포인트와 재고가 즉시 차감됩니다.</p></div>
    <div className="patient-point-product-grid">{products.map((product) => <Card className="patient-point-product" key={product.id}><StoreProductImage src={product.imageUrl} alt={product.name}/><div><span><Badge tone={product.stock ? "green" : "gray"}>{product.stock ? `재고 ${product.stock.toLocaleString()}개` : "품절"}</Badge></span><h3>{product.name}</h3><p>{product.description || "포인트 교환 상품입니다."}</p><strong>{product.pricePoints.toLocaleString()}P</strong><Button onClick={() => open(product)} disabled={!product.stock || session.points < product.pricePoints}><ShoppingBag/>{!product.stock ? "품절" : session.points < product.pricePoints ? "포인트 부족" : "포인트로 구매"}</Button></div></Card>)}{!products.length && <Card className="point-store-empty"><ShoppingBag/><b>현재 판매 중인 상품이 없습니다.</b><p>사장님이 상품을 준비하면 이곳에 표시됩니다.</p></Card>}</div>
    <Card className="patient-purchase-history"><div className="patient-purchase-title"><div><span>MY POINT ORDERS</span><h3>최근 포인트 구매 내역</h3></div><ReceiptText/></div>{myPurchases.length ? <div>{myPurchases.map((purchase) => <article key={purchase.id}><StoreProductImage compact src={purchase.imageUrl} alt=""/><span><b>{purchase.productName}</b><small>{purchase.quantity}개 · {purchase.createdAt ? new Date(purchase.createdAt).toLocaleString("ko-KR") : "방금"}</small></span><strong>-{purchase.totalPoints.toLocaleString()}P</strong></article>)}</div> : <p className="patient-purchase-empty">아직 구매한 포인트 상품이 없습니다.</p>}</Card>
    <Modal open={!!selected} onClose={() => !busy && setSelected(null)} title="포인트 상품 구매 확인">{selected && <div className="point-buy-modal"><StoreProductImage src={selected.imageUrl} alt={selected.name}/><div className="point-buy-summary"><Badge tone="green">재고 {selected.stock.toLocaleString()}개</Badge><h3>{selected.name}</h3><p>{selected.description}</p><strong>{selected.pricePoints.toLocaleString()}P</strong></div><div className="point-quantity"><span>구매 수량</span><div><button type="button" aria-label="수량 줄이기" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus/></button><b>{quantity}</b><button type="button" aria-label="수량 늘리기" onClick={() => setQuantity((value) => Math.min(10, selected.stock, value + 1))}><Plus/></button></div></div><div className="point-buy-total"><span><small>총 사용 포인트</small><b>{total.toLocaleString()}P</b></span><span><small>구매 후 잔액</small><b>{Math.max(0, session.points - total).toLocaleString()}P</b></span></div><Button onClick={purchase} disabled={busy || quantity > selected.stock || total > session.points}>{busy ? "구매 처리 중..." : `${total.toLocaleString()}P로 구매 확정`}</Button></div>}</Modal>
  </div></section>;
}