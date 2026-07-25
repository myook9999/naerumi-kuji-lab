"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Coins, Search, UserRoundCheck, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { useHospital } from "@/components/hospital-provider";
import { MAX_TREATMENT_STAGE } from "@/config/hospital";
import { Badge, Button, Card, Modal } from "@/components/ui";
import { PageHeader, SectionTitle } from "./common";
import type { ApprovalStatus, HospitalMember } from "@/types/hospital";

const labels: Record<ApprovalStatus, string> = { pending: "승인 대기", approved: "승인", rejected: "거절" };

export function HospitalMembers() {
  const hospital = useHospital();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ApprovalStatus | "all">("all");
  const [selected, setSelected] = useState<HospitalMember | null>(null);
  const [amount, setAmount] = useState(1000);
  const [memo, setMemo] = useState("방문 적립");
  const [busy, setBusy] = useState(false);

  const { refreshMembers } = hospital;
  useEffect(() => { refreshMembers().catch(() => undefined); }, [refreshMembers]);
  const rows = useMemo(() => hospital.members.filter((member) => (status === "all" || member.status === status) && [member.name, member.loginId].some((value) => value.toLowerCase().includes(query.toLowerCase()))), [hospital.members, query, status]);

  async function approve(member: HospitalMember, next: "approved" | "rejected") {
    try { await hospital.changeMemberStatus(member.uid, next); }
    catch (error) { toast.error(error instanceof Error ? error.message : "승인 상태를 변경하지 못했습니다."); }
  }

  async function savePoints() {
    if (!selected) return;
    setBusy(true);
    try { await hospital.changePoints(selected.uid, amount, memo); setSelected(null); }
    catch (error) { toast.error(error instanceof Error ? error.message : "포인트를 변경하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeader title="환자 승인·포인트" description="가입 신청을 승인하고 환자별 포인트를 지급·차감합니다."/>
    <div className="kpi-strip patient-admin-kpis"><div><span>전체 신청</span><b>{hospital.members.length}명</b></div><div><span>승인 대기</span><b>{hospital.members.filter((member) => member.status === "pending").length}명</b></div><div><span>승인 환자</span><b>{hospital.members.filter((member) => member.status === "approved").length}명</b></div><div><span>총 보유 포인트</span><b>{hospital.members.reduce((sum, member) => sum + member.points, 0).toLocaleString()}P</b></div></div>
    <Card><SectionTitle title="환자 명단" sub={`${rows.length}명 표시 중`}/><div className="toolbar hospital-member-toolbar"><label className="search"><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="닉네임·아이디 검색"/></label><div className="tabs">{(["all", "pending", "approved", "rejected"] as const).map((item) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item === "all" ? "전체" : labels[item]}</button>)}</div></div><div className="table-wrap"><table><thead><tr><th>환자</th><th>로그인 아이디</th><th>신청 상태</th><th>보유 포인트</th><th>강화 단계</th><th>관리</th></tr></thead><tbody>{rows.map((member) => <tr key={member.uid}><td><b>{member.name}</b><small>@{member.loginId}</small></td><td><code>{member.loginId}</code></td><td><Badge tone={member.status === "approved" ? "green" : member.status === "pending" ? "amber" : "red"}>{labels[member.status]}</Badge></td><td><b>{member.points.toLocaleString()}P</b></td><td><b>{Math.min(MAX_TREATMENT_STAGE, member.treatmentStage)}강</b> / 15강</td><td><div className="member-actions">{member.status === "pending" && <><Button onClick={() => approve(member, "approved")}><UserRoundCheck/>승인</Button><Button variant="ghost" onClick={() => approve(member, "rejected")}><UserRoundX/>거절</Button></>}<Button variant="ghost" disabled={member.status !== "approved"} onClick={() => { setSelected(member); setAmount(1000); setMemo("방문 적립"); }}><Coins/>포인트</Button></div></td></tr>)}</tbody></table></div></Card>
    <Modal open={!!selected} onClose={() => setSelected(null)} title="환자 포인트 처방">
      {selected && <div className="point-modal"><div className="point-patient"><span>{selected.name.slice(0, 1)}</span><div><b>{selected.name}</b><small>현재 {selected.points.toLocaleString()}P</small></div></div><label>변경 포인트<input type="number" step="100" value={amount} onChange={(event) => setAmount(Number(event.target.value))}/><small>지급은 양수, 차감은 음수로 입력하세요.</small></label><div className="quick-points">{[500, 1000, 3000, -500].map((value) => <button className={amount === value ? "active" : ""} onClick={() => setAmount(value)} key={value}>{value > 0 ? "+" : ""}{value.toLocaleString()}P</button>)}</div><label>처방 사유<input value={memo} onChange={(event) => setMemo(event.target.value)} maxLength={100}/></label><div className="point-preview"><span>변경 후 예상 잔액</span><b>{Math.max(0, selected.points + amount).toLocaleString()}P</b></div><Button onClick={savePoints} disabled={busy || !memo.trim() || amount === 0 || selected.points + amount < 0}><Check/>{busy ? "기록 중..." : "포인트 반영"}</Button></div>}
    </Modal>
  </>;
}
