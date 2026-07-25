"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, MapPin, PackageCheck, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";
import { useHospital } from "@/components/hospital-provider";
import { Badge, Button, Card } from "@/components/ui";
import type { CustomerWinning, ShippingAddress, ShippingStatus } from "@/types/hospital";
import { PageHeader, SectionTitle } from "./common";

const statusLabels: Record<ShippingStatus, string> = {
  address_required: "배송지 필요",
  preparing: "상품 준비 중",
  shipped: "발송 완료",
  delivered: "배송 완료",
};

function statusTone(status: ShippingStatus): "amber" | "blue" | "green" | "gray" {
  return status === "address_required" ? "amber" : status === "preparing" ? "blue" : status === "shipped" ? "green" : "gray";
}

function ShipmentRow({ winning, address }: { winning: CustomerWinning; address?: ShippingAddress }) {
  const hospital = useHospital();
  const [status, setStatus] = useState<ShippingStatus>(winning.shippingStatus);
  const [carrier, setCarrier] = useState(winning.carrier || "");
  const [tracking, setTracking] = useState(winning.trackingNumber || "");
  const [busy, setBusy] = useState(false);
  const hasAddress = Boolean(address?.recipient && address.address1);

  async function save() {
    setBusy(true);
    try { await hospital.updateShipment(winning.id, status, carrier, tracking); }
    catch (error) { toast.error(error instanceof Error ? error.message : "배송 상태를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <article className="fulfillment-row">
    <div className="fulfillment-prize"><span>{winning.tier || "상위상"}</span><div><b>{winning.prizeName}</b><small>{winning.boardName} · {new Date(winning.wonAt).toLocaleString("ko-KR")}</small></div></div>
    <div className="fulfillment-customer"><b>{winning.name}</b><small>@{winning.loginId}</small></div>
    <div className={hasAddress ? "fulfillment-address" : "fulfillment-address missing"}><MapPin/><span>{hasAddress ? <><b>{address?.recipient} · {address?.phone}</b><small>[{address?.postalCode}] {address?.address1} {address?.address2}</small>{address?.memo && <em>요청: {address.memo}</em>}</> : <><b>배송지 미입력</b><small>고객 입력을 기다리고 있습니다.</small></>}</span></div>
    <div className="shipment-editor"><select aria-label={`${winning.name} 배송 상태`} value={status} onChange={(event) => setStatus(event.target.value as ShippingStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input aria-label={`${winning.name} 택배사`} value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="택배사"/><input aria-label={`${winning.name} 운송장 번호`} value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="운송장 번호"/><Button onClick={save} disabled={busy}>{busy ? "저장 중" : "반영"}</Button></div>
  </article>;
}

export function HospitalFulfillment() {
  const hospital = useHospital();
  const { refreshFulfillment } = hospital;
  const counts = hospital.winnings.reduce<Record<ShippingStatus, number>>((result, winning) => { result[winning.shippingStatus] += 1; return result; }, { address_required: 0, preparing: 0, shipped: 0, delivered: 0 });

  useEffect(() => { refreshFulfillment().catch(() => toast.error("배송 기록을 불러오지 못했습니다.")); }, [refreshFulfillment]);

  return <>
    <PageHeader title="상위상·배송 관리" description="누가 어떤 상위상을 받았는지 확인하고, 배송지 확인부터 발송·배송 완료까지 관리합니다." actions={<Button variant="ghost" onClick={() => refreshFulfillment().catch(() => toast.error("배송 기록을 새로고침하지 못했습니다."))}><RefreshCw/>새로고침</Button>}/>
    <div className="fulfillment-kpis">
      <Card><PackageCheck/><span><small>전체 상위상</small><b>{hospital.winnings.length}건</b></span></Card>
      <Card><MapPin/><span><small>배송지 필요</small><b>{counts.address_required}건</b></span></Card>
      <Card><ClipboardCheck/><span><small>상품 준비 중</small><b>{counts.preparing}건</b></span></Card>
      <Card><Truck/><span><small>발송·완료</small><b>{counts.shipped + counts.delivered}건</b></span></Card>
    </div>
    <Card className="fulfillment-card"><SectionTitle title="고객별 배송 처리" sub="배송 개인정보는 고객 본인과 쿠지병동 사장님에게만 표시됩니다"/><div className="fulfillment-legend">{Object.entries(statusLabels).map(([status, label]) => <Badge key={status} tone={statusTone(status as ShippingStatus)}>{label} {counts[status as ShippingStatus]}</Badge>)}</div><div className="fulfillment-list">{hospital.winnings.map((winning) => <ShipmentRow key={winning.id} winning={winning} address={hospital.shippingAddresses[winning.uid]}/>)}</div>{!hospital.winnings.length && <div className="admin-empty"><PackageCheck/><p>아직 연결된 상위상 당첨 기록이 없습니다.</p></div>}</Card>
  </>;
}
