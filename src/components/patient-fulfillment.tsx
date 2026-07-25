"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, MapPin, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { useHospital } from "@/components/hospital-provider";
import { Badge, Button, Card } from "@/components/ui";
import type { ShippingAddress, ShippingStatus } from "@/types/hospital";

const labels: Record<ShippingStatus, string> = { address_required: "배송지 입력 필요", preparing: "상품 준비 중", shipped: "발송 완료", delivered: "배송 완료" };
const tones: Record<ShippingStatus, "amber" | "blue" | "green" | "gray"> = { address_required: "amber", preparing: "blue", shipped: "green", delivered: "gray" };
const blank: ShippingAddress = { recipient: "", phone: "", postalCode: "", address1: "", address2: "", memo: "", updatedAt: "" };

function AddressForm({ initial }: { initial: ShippingAddress }) {
  const hospital = useHospital();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const update = (field: keyof ShippingAddress, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { updatedAt: _updatedAt, ...input } = form;
      void _updatedAt;
      await hospital.saveShippingAddress(input);
    } catch (error) { toast.error(error instanceof Error ? error.message : "배송지를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <Card className="patient-address-card"><div className="address-card-title"><MapPin/><div><span>MY DELIVERY ADDRESS</span><h3>내 배송지</h3><p>상위상 배송에 사용할 주소이며 사장님과 본인만 확인할 수 있습니다.</p></div></div><form onSubmit={submit}><div className="address-fields two"><label><span>받는 분 *</span><input value={form.recipient} onChange={(event) => update("recipient", event.target.value)} placeholder="이름 또는 닉네임" required/></label><label><span>연락처 *</span><input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="010-0000-0000" required/></label></div><div className="address-fields postal"><label><span>우편번호 *</span><input value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} placeholder="우편번호" required/></label><label><span>기본 주소 *</span><input value={form.address1} onChange={(event) => update("address1", event.target.value)} placeholder="도로명 주소" required/></label></div><div className="address-fields two"><label><span>상세 주소</span><input value={form.address2} onChange={(event) => update("address2", event.target.value)} placeholder="동·호수 등"/></label><label><span>배송 요청사항</span><input value={form.memo} onChange={(event) => update("memo", event.target.value)} placeholder="문 앞에 놓아주세요"/></label></div><div className="address-form-footer"><span><ShieldCheck/>배송 정보는 쿠지 원본 데이터와 분리 저장됩니다.</span><Button type="submit" disabled={busy}>{busy ? "저장 중..." : "배송지 저장"}</Button></div></form></Card>;
}

export function PatientFulfillment() {
  const hospital = useHospital();
  const session = hospital.session;
  const { refreshFulfillment } = hospital;
  useEffect(() => { refreshFulfillment().catch(() => toast.error("내 상위상 정보를 불러오지 못했습니다.")); }, [refreshFulfillment]);
  if (!session || session.role !== "patient") return null;
  const winnings = hospital.winnings.filter((winning) => winning.uid === session.uid);
  const address = hospital.shippingAddresses[session.uid] ?? blank;

  return <section id="my-prizes" className="patient-section fulfillment-patient-section"><div className="hospital-section-title"><span>MY PRIZES & DELIVERY</span><h2>내 상위상·배송</h2><p>내가 받은 상위상만 확인하고 배송지를 직접 관리할 수 있습니다.</p></div><div className="patient-fulfillment-grid"><Card className="my-winning-card"><div className="my-winning-title"><PackageCheck/><div><h3>내 상위상 {winnings.length}건</h3><p>배송 상태는 사장님이 처리하는 즉시 반영됩니다.</p></div></div><div className="my-winning-list">{winnings.map((winning) => <article key={winning.id}><span className="winning-tier">{winning.tier || "상위상"}</span><div><b>{winning.prizeName}</b><small>{winning.boardName} · {new Date(winning.wonAt).toLocaleString("ko-KR")}</small>{winning.shippingStatus === "shipped" && <em><Truck/> {winning.carrier} {winning.trackingNumber}</em>}</div><Badge tone={tones[winning.shippingStatus]}>{winning.shippingStatus === "delivered" && <CheckCircle2/>}{labels[winning.shippingStatus]}</Badge></article>)}{!winnings.length && <div className="patient-empty-prize"><PackageCheck/><b>아직 등록된 상위상이 없어요</b><p>당첨 기록이 연결되면 이곳에 배송 상태와 함께 표시됩니다.</p></div>}</div></Card><AddressForm key={address.updatedAt || "empty"} initial={address}/></div></section>;
}
