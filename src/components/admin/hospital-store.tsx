"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Coins, PackagePlus, Pencil, ReceiptText, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useHospital } from "@/components/hospital-provider";
import { StoreProductImage } from "@/components/store-product-image";
import { Badge, Button, Card, Modal } from "@/components/ui";
import { PageHeader, SectionTitle } from "./common";
import type { StoreProduct, StoreProductDraft } from "@/types/hospital";

const emptyDraft: StoreProductDraft = { name: "", description: "", imageUrl: "", pricePoints: 1000, stock: 1, active: true };

export function HospitalStore() {
  const hospital = useHospital();
  const [draft, setDraft] = useState<StoreProductDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const { refreshStore } = hospital;
  useEffect(() => { refreshStore().catch((error) => toast.error(error instanceof Error ? error.message : "상점 정보를 불러오지 못했습니다.")); }, [refreshStore]);

  const activeCount = hospital.storeProducts.filter((product) => product.active).length;
  const totalStock = hospital.storeProducts.reduce((sum, product) => sum + product.stock, 0);
  const spentPoints = hospital.pointPurchases.reduce((sum, purchase) => sum + purchase.totalPoints, 0);
  const purchases = useMemo(() => hospital.pointPurchases.slice(0, 100), [hospital.pointPurchases]);

  function edit(product: StoreProduct) {
    setDraft({ id: product.id, name: product.name, description: product.description, imageUrl: product.imageUrl, pricePoints: product.pricePoints, stock: product.stock, active: product.active });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    try { await hospital.saveStoreProduct(draft); setDraft(null); }
    catch (error) { toast.error(error instanceof Error ? error.message : "상품을 저장하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeader title="포인트 상점 관리" description="사장님만 상품을 등록·수정하며, 고객은 보유 포인트로 구매합니다." actions={<Button onClick={() => setDraft({ ...emptyDraft })}><PackagePlus/>새 상품 등록</Button>}/>
    <div className="kpi-strip point-store-kpis"><div><span>등록 상품</span><b>{hospital.storeProducts.length}개</b></div><div><span>판매 중</span><b>{activeCount}개</b></div><div><span>전체 재고</span><b>{totalStock.toLocaleString()}개</b></div><div><span>구매 사용 포인트</span><b>{spentPoints.toLocaleString()}P</b></div></div>
    <Card className="admin-point-store-card"><SectionTitle title="판매 상품" sub="이미지는 파일 업로드 없이 공개 이미지 링크로 표시됩니다."/>
      <div className="admin-point-product-grid">{hospital.storeProducts.map((product) => <article key={product.id}><StoreProductImage src={product.imageUrl} alt={product.name}/><div className="admin-point-product-body"><span><Badge tone={product.active ? "green" : "gray"}>{product.active ? "판매 중" : "판매 중지"}</Badge><small>재고 {product.stock.toLocaleString()}개</small></span><h3>{product.name}</h3><p>{product.description || "상품 설명이 없습니다."}</p><strong>{product.pricePoints.toLocaleString()}P</strong><Button variant="ghost" onClick={() => edit(product)}><Pencil/>상품 수정</Button></div></article>)}{!hospital.storeProducts.length && <div className="point-store-empty"><ShoppingBag/><b>등록된 상품이 없습니다.</b><p>새 상품 등록 버튼으로 첫 포인트 상품을 등록해 주세요.</p></div>}</div>
    </Card>
    <Card className="point-purchase-admin-card"><SectionTitle title="최근 포인트 구매" sub={`${purchases.length}건 표시`}/>{purchases.length ? <div className="point-purchase-table"><div className="point-purchase-head"><span>고객</span><span>상품</span><span>수량</span><span>사용 포인트</span><span>구매일</span></div>{purchases.map((purchase) => <div key={purchase.id}><span><b>{purchase.customerName}</b><small>@{purchase.loginId}</small></span><span className="point-purchase-product"><StoreProductImage compact src={purchase.imageUrl} alt=""/><b>{purchase.productName}</b></span><span>{purchase.quantity}개</span><strong>{purchase.totalPoints.toLocaleString()}P</strong><time>{purchase.createdAt ? new Date(purchase.createdAt).toLocaleString("ko-KR") : "확인 중"}</time></div>)}</div> : <div className="point-store-empty compact"><ReceiptText/><p>아직 포인트 구매 내역이 없습니다.</p></div>}</Card>
    <Modal open={!!draft} onClose={() => !busy && setDraft(null)} title={draft?.id ? "포인트 상품 수정" : "새 포인트 상품 등록"}>
      {draft && <form className="point-product-form" onSubmit={submit}><label>상품명<input aria-label="상품명" required minLength={2} maxLength={60} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="고객에게 표시할 상품명"/></label><label>상품 설명<textarea aria-label="상품 설명" maxLength={240} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="상품 구성과 수령 안내를 입력하세요."/></label><label>이미지 링크<input aria-label="이미지 링크" type="url" maxLength={2048} value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} placeholder="https://example.com/product.jpg"/><small>HTTP/HTTPS 공개 이미지 주소만 허용합니다. 이미지 파일은 서버에 복사하지 않습니다.</small></label>{draft.imageUrl && <div className="point-image-preview"><StoreProductImage src={draft.imageUrl} alt="상품 이미지 미리보기"/><span>이미지 링크 미리보기</span></div>}<div className="point-product-form-row"><label>가격(P)<input aria-label="가격(P)" type="number" min={1} max={10000000} step={1} value={draft.pricePoints} onChange={(event) => setDraft({ ...draft, pricePoints: Number(event.target.value) })}/></label><label>재고<input aria-label="재고" type="number" min={0} max={100000} step={1} value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })}/></label></div><label className="point-product-active"><input aria-label="판매 상태" type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })}/><span><b>고객 상점에 판매</b><small>체크를 끄면 고객 화면에서 숨겨집니다.</small></span></label><Button type="submit" disabled={busy}><Coins/>{busy ? "저장 중..." : draft.id ? "상품 수정 저장" : "상품 등록"}</Button></form>}
    </Modal>
  </>;
}