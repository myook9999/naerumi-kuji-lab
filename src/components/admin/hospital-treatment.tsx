"use client";

import { CircleCheck, HeartPulse, Stethoscope } from "lucide-react";
import { treatmentStages } from "@/config/hospital";
import { useHospital } from "@/components/hospital-provider";
import { Badge, Card, Progress } from "@/components/ui";
import { PageHeader, SectionTitle } from "./common";

export function HospitalTreatment() {
  const hospital = useHospital();
  const approved = hospital.members.filter((member) => member.status === "approved");

  return <>
    <PageHeader title="환자 치료 현황" description="쿠지병동 포인트 치료의 단계와 환자별 진행 상태를 확인합니다."/>
    <Card className="treatment-policy"><div><Stethoscope/><span><small>치료 원칙</small><b>실패해도 단계 하락 없음</b></span></div><div><HeartPulse/><span><small>최종 단계</small><b>회복 관찰 후 완치</b></span></div><div><CircleCheck/><span><small>기록 방식</small><b>서버 트랜잭션 저장</b></span></div></Card>
    <div className="hospital-admin-grid treatment-admin-grid">
      <Card><SectionTitle title="단계별 치료 처방" sub="포인트 비용과 치료 성공률"/><div className="admin-care-path">{treatmentStages.map((stage, index) => <article key={stage.name}><i>{index === 5 ? <CircleCheck/> : index + 1}</i><div><b>{stage.name}</b><small>{stage.description}</small></div><span><b>{stage.cost ? `${stage.cost.toLocaleString()}P` : "-"}</b><small>{stage.probability}%</small></span></article>)}</div></Card>
      <Card><SectionTitle title="치료 단계 분포" sub={`승인 환자 ${approved.length}명 기준`}/><div className="stage-distribution">{treatmentStages.map((stage, index) => { const count = approved.filter((member) => member.treatmentStage === index).length; return <div key={stage.name}><span><b>{stage.name}</b><small>{count}명</small></span><Progress value={approved.length ? count / approved.length * 100 : 0} color="#C95F5C"/></div>; })}</div></Card>
    </div>
    <Card><SectionTitle title="환자별 치료 차트" sub="포인트 지급은 환자 승인·포인트 메뉴에서 관리합니다"/><div className="treatment-patient-grid">{approved.map((member) => <article key={member.uid}><span>{member.name.slice(0, 1)}</span><div><b>{member.name}</b><small>@{member.loginId}</small></div><Badge tone={member.treatmentStage === 5 ? "green" : "red"}>{treatmentStages[member.treatmentStage].name}</Badge><Progress value={member.treatmentStage / 5 * 100} color="#C95F5C"/><strong>{member.points.toLocaleString()}P</strong></article>)}</div></Card>
  </>;
}