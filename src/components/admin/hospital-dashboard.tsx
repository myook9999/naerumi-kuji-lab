"use client";

import Link from "next/link";
import { Activity, CircleCheck, Clock3, HeartPulse, ShieldCheck, Ticket, Users } from "lucide-react";
import { treatmentStages } from "@/config/hospital";
import { useHospital } from "@/components/hospital-provider";
import { Badge, Card, Progress } from "@/components/ui";
import { KpiCard, PageHeader, SectionTitle } from "./common";

export function HospitalDashboard() {
  const hospital = useHospital();
  const pending = hospital.members.filter((member) => member.status === "pending");
  const approved = hospital.members.filter((member) => member.status === "approved");
  const progress = hospital.board.totalCards ? hospital.board.openedCount / hospital.board.totalCards * 100 : 0;

  return <>
    <PageHeader title="쿠지병동 운영실" description="한 지점의 환자, 포인트, 치료 상태와 쿠지판을 안전하게 확인합니다." actions={<Badge tone={hospital.firebaseMode ? "green" : "amber"}>{hospital.firebaseMode ? "Firebase 운영 모드" : "안전한 시연 모드"}</Badge>}/>
    <div className="kpi-grid hospital-kpis">
      <KpiCard label="승인 환자" value={`${approved.length}명`} note="쿠지판 입장 가능" icon={Users}/>
      <KpiCard label="승인 대기" value={`${pending.length}명`} note="사장님 확인 필요" icon={Clock3} tone="orange"/>
      <KpiCard label="남은 쿠지" value={`${hospital.board.remainingCards}장`} note={`총 ${hospital.board.totalCards}장`} icon={Ticket} tone="blue"/>
      <KpiCard label="치료 중" value={`${approved.filter((member) => member.treatmentStage > 0 && member.treatmentStage < 5).length}명`} note="포인트 치료 환자" icon={HeartPulse} tone="pink"/>
    </div>
    <div className="hospital-admin-grid">
      <Card className="hospital-board-summary">
        <SectionTitle title="실시간 쿠지판 상태" sub="쿠지병동 공개 스냅샷 1개만 구독합니다" action={<Link href="/admin/kuji-boards">상세 보기</Link>}/>
        <div className="board-summary-main"><div className="board-pulse"><Activity/><span>{hospital.boardConnection === "live" ? "LIVE" : hospital.boardConnection.toUpperCase()}</span></div><div><Badge tone="green">현재 진료 중</Badge><h3>{hospital.board.boardName}</h3><p>{hospital.board.price || "가격 확인 중"}</p></div></div>
        <div className="admin-board-numbers"><span><small>처방 완료</small><b>{hospital.board.openedCount}장</b></span><span><small>남은 수량</small><b>{hospital.board.remainingCards}장</b></span><span><small>전체 수량</small><b>{hospital.board.totalCards}장</b></span></div>
        <Progress value={progress} color="#C95F5C"/><p className="read-only-note"><ShieldCheck/> 원본 쿠지판은 읽기 전용입니다. 이 사이트에서 수정·삭제하지 않습니다.</p>
      </Card>
      <Card><SectionTitle title="가입 승인 대기" sub={`${pending.length}명의 환자가 기다리고 있어요`} action={<Link href="/admin/members">전체 관리</Link>}/><div className="pending-list">{pending.slice(0, 4).map((member) => <article key={member.uid}><span>{member.name.slice(0, 1)}</span><div><b>{member.name}</b><small>@{member.loginId}</small></div><Badge tone="amber">대기</Badge></article>)}{!pending.length && <div className="admin-empty"><CircleCheck/><p>대기 중인 가입 신청이 없습니다.</p></div>}</div></Card>
    </div>
    <Card><SectionTitle title="환자 치료 현황" sub="승인 환자의 현재 치료 단계를 확인합니다" action={<Link href="/admin/treatment">치료 현황 보기</Link>}/><div className="treatment-overview">{approved.slice(0, 6).map((member) => <article key={member.uid}><span>{member.name.slice(0, 1)}</span><div><b>{member.name}</b><small>{treatmentStages[member.treatmentStage].name}</small></div><Progress value={member.treatmentStage / 5 * 100} color="#C95F5C"/><strong>{member.points.toLocaleString()}P</strong></article>)}</div></Card>
  </>;
}