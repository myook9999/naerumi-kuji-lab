"use client";

import { useEffect, useState } from "react";
import { Bomb, CircleCheck, History, RotateCcw, Save, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { defaultTreatmentRates, MAX_TREATMENT_STAGE, treatmentStages } from "@/config/hospital";
import { useHospital } from "@/components/hospital-provider";
import { Badge, Button, Card, Progress } from "@/components/ui";
import type { TreatmentRate } from "@/types/hospital";
import { PageHeader, SectionTitle } from "./common";

export function HospitalTreatment() {
  const hospital = useHospital();
  const approved = hospital.members.filter((member) => member.status === "approved");
  const [rates, setRates] = useState<TreatmentRate[]>(hospital.treatmentSettings.rates.map((rate) => ({ ...rate })));
  const [notice, setNotice] = useState(hospital.treatmentSettings.notice);
  const [busy, setBusy] = useState(false);
  const { refreshTreatmentAdmin } = hospital;

  useEffect(() => {
    refreshTreatmentAdmin().then((settings) => {
      if (!settings) return;
      setRates(settings.rates.map((rate) => ({ ...rate })));
      setNotice(settings.notice);
    }).catch(() => toast.error("강화 설정과 로그를 불러오지 못했습니다."));
  }, [refreshTreatmentAdmin]);

  function updateRate(stage: number, field: "probability" | "destroyProbability", value: number) {
    setRates((current) => current.map((rate) => rate.stage === stage ? { ...rate, [field]: Math.min(100, Math.max(0, Math.round(value || 0))) } : rate));
  }

  async function save() {
    setBusy(true);
    try { await hospital.saveTreatmentSettings(rates, notice); }
    catch (error) { toast.error(error instanceof Error ? error.message : "강화 확률을 저장하지 못했습니다."); }
    finally { setBusy(false); }
  }

  function resetRates() {
    setRates(defaultTreatmentRates.map((rate) => ({ ...rate })));
    setNotice("기본 15강 강화 확률표로 변경될 예정입니다.");
  }

  return <>
    <PageHeader title="강화 치료 관리" description="0~15강 확률을 설정하고 고객 공시와 실제 강화 결과를 확인합니다." actions={<Badge tone={hospital.firebaseMode ? "green" : "amber"}>{hospital.firebaseMode ? "Firebase 운영 설정" : "시연 설정"}</Badge>}/>
    <Card className="treatment-policy"><div><Stethoscope/><span><small>안전 구간</small><b>1~4강 파괴 없음</b></span></div><div><Bomb/><span><small>파괴 규칙</small><b>파괴 시 0강 초기화</b></span></div><div><CircleCheck/><span><small>공개 원칙</small><b>변경 즉시 고객 공시</b></span></div></Card>

    <Card className="enhancement-settings-card">
      <SectionTitle title="단계별 강화 확률 설정" sub="성공률과 파괴율의 합은 100% 이하여야 하며 나머지는 단계 유지 확률입니다." action={<Button variant="ghost" onClick={resetRates}><RotateCcw/>기본값 불러오기</Button>}/>
      <div className="enhancement-rate-head"><span>강화 단계</span><span>필요 포인트</span><span>성공률</span><span>유지율</span><span>파괴율</span></div>
      <div className="enhancement-rate-list">{treatmentStages.slice(1).map((stage, offset) => {
        const level = offset + 1;
        const rate = rates.find((item) => item.stage === level) ?? defaultTreatmentRates[level];
        const keep = Math.max(0, 100 - rate.probability - rate.destroyProbability);
        return <div key={stage.name} className={rate.probability + rate.destroyProbability > 100 ? "invalid" : ""}><div><b>{stage.name}</b><small>{stage.description}</small></div><strong>{stage.cost.toLocaleString()}P</strong><label><input aria-label={`${level}강 성공률`} type="number" min="0" max="100" value={rate.probability} onChange={(event) => updateRate(level, "probability", Number(event.target.value))}/><span>%</span></label><b className="keep-rate">{keep}%</b><label className="destroy-input"><input aria-label={`${level}강 파괴율`} type="number" min="0" max="100" value={rate.destroyProbability} onChange={(event) => updateRate(level, "destroyProbability", Number(event.target.value))}/><span>%</span></label></div>;
      })}</div>
      <div className="enhancement-notice-editor"><label><b>고객 화면 변경 공지</b><textarea value={notice} onChange={(event) => setNotice(event.target.value)} maxLength={200} placeholder="확률 변경 사유와 적용 내용을 고객에게 안내해 주세요."/><small>{notice.length}/200자 · 저장 시 고객 치료실에 변경 시각과 함께 표시됩니다.</small></label><Button onClick={save} disabled={busy || notice.trim().length < 2}><Save/>{busy ? "저장 중..." : "확률 저장 및 고객 공시"}</Button></div>
    </Card>

    <Card className="enhancement-log-card">
      <SectionTitle title="최근 강화 로그" sub={`최근 ${hospital.treatmentLogs.length}건 · 운영 모드는 최대 100건만 조회해 부하를 제한합니다`} action={<Button variant="ghost" onClick={() => refreshTreatmentAdmin().catch(() => toast.error("로그를 새로고침하지 못했습니다."))}><History/>새로고침</Button>}/>
      <div className="table-wrap"><table><thead><tr><th>시각</th><th>환자</th><th>도전</th><th>사용 포인트</th><th>적용 확률</th><th>결과</th></tr></thead><tbody>{hospital.treatmentLogs.map((log) => <tr key={log.id}><td>{new Date(log.createdAt).toLocaleString("ko-KR")}</td><td><b>{log.name}</b><small>@{log.loginId}</small></td><td>{log.beforeStage}강 → {Math.min(MAX_TREATMENT_STAGE, log.beforeStage + 1)}강</td><td>{log.cost.toLocaleString()}P</td><td><small>성공 {log.probability}%</small><small className={log.destroyProbability ? "danger" : ""}>파괴 {log.destroyProbability}%</small></td><td><Badge tone={log.outcome === "success" ? "green" : log.outcome === "destroyed" ? "red" : "amber"}>{log.outcome === "success" ? `${log.afterStage}강 성공` : log.outcome === "destroyed" ? "파괴 · 0강" : `${log.afterStage}강 유지`}</Badge></td></tr>)}</tbody></table></div>
      {!hospital.treatmentLogs.length && <div className="admin-empty"><History/><p>아직 기록된 강화 로그가 없습니다.</p></div>}
    </Card>

    <div className="hospital-admin-grid treatment-admin-grid">
      <Card><SectionTitle title="강화 단계 분포" sub={`승인 환자 ${approved.length}명 기준`}/><div className="stage-distribution">{treatmentStages.map((stage, index) => { const count = approved.filter((member) => member.treatmentStage === index).length; return <div key={stage.name}><span><b>{index}강</b><small>{count}명</small></span><Progress value={approved.length ? count / approved.length * 100 : 0} color="#C95F5C"/></div>; })}</div></Card>
      <Card><SectionTitle title="환자별 강화 현황" sub="포인트는 환자 승인·포인트 메뉴에서 관리합니다"/><div className="treatment-patient-compact">{approved.map((member) => { const stage = Math.min(MAX_TREATMENT_STAGE, member.treatmentStage); return <article key={member.uid}><span>{member.name.slice(0, 1)}</span><div><b>{member.name}</b><small>@{member.loginId}</small></div><Badge tone={stage === MAX_TREATMENT_STAGE ? "green" : "red"}>{stage}강</Badge><strong>{member.points.toLocaleString()}P</strong></article>; })}</div></Card>
    </div>
  </>;
}
