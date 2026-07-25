"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Bomb, CircleCheck, Clock3, HeartPulse, LogOut, Megaphone, ShieldCheck, Sparkles, Ticket, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { assets } from "@/config/brand";
import { MAX_TREATMENT_STAGE, treatmentStages } from "@/config/hospital";
import { useHospital } from "@/components/hospital-provider";
import { HospitalAuth } from "@/components/hospital-auth";
import { Badge, Button, Card, Progress } from "@/components/ui";

function WaitingRoom({ rejected = false }: { rejected?: boolean }) {
  const hospital = useHospital();
  return <main className="hospital-waiting"><Card><Image src={assets.logo} alt="쿠지병동" width={110} height={110}/>{rejected ? <UserRoundCheck className="waiting-icon rejected"/> : <Clock3 className="waiting-icon"/>}<Badge tone={rejected ? "red" : "amber"}>{rejected ? "가입 확인 필요" : "승인 대기"}</Badge><h1>{rejected ? "가입 신청을 다시 확인해 주세요" : "사장님이 접수 내용을 확인 중이에요"}</h1><p>{rejected ? "입력 정보 확인이 필요해 현재 입장이 제한되었습니다." : "승인되면 쿠지판과 포인트 치료실을 이용할 수 있습니다. 잠시만 기다려 주세요."}</p><Button variant="ghost" onClick={() => hospital.logout()}>다른 계정으로 로그인</Button></Card></main>;
}

export function HospitalStorefront() {
  const hospital = useHospital();
  const [treating, setTreating] = useState(false);
  const [result, setResult] = useState<string>("");
  const session = hospital.session;

  if (!hospital.ready) return <main className="hospital-loading"><HeartPulse/><p>병동 기록을 확인하고 있어요...</p></main>;
  if (!session) return <HospitalAuth mode="login"/>;
  if (session.role === "owner") return <main className="hospital-waiting"><Card><Image src={assets.logo} alt="쿠지병동" width={110} height={110}/><h1>사장님 계정입니다</h1><p>관리자 병동에서 환자와 쿠지판을 관리해 주세요.</p><Link className="hospital-primary-link" href="/admin/dashboard">관리자 병동으로 이동</Link></Card></main>;
  if (session.status !== "approved") return <WaitingRoom rejected={session.status === "rejected"}/>;

  const currentStage = Math.min(MAX_TREATMENT_STAGE, Math.max(0, session.treatmentStage));
  const stage = treatmentStages[currentStage];
  const nextStage = treatmentStages[Math.min(MAX_TREATMENT_STAGE, currentStage + 1)];
  const nextRate = hospital.treatmentSettings.rates[Math.min(MAX_TREATMENT_STAGE, currentStage + 1)] ?? nextStage;
  const progress = hospital.board.totalCards ? hospital.board.openedCount / hospital.board.totalCards * 100 : 0;

  async function treat() {
    setTreating(true);
    setResult("");
    try {
      const outcome = await hospital.runTreatment();
      const message = outcome.outcome === "success"
        ? `${treatmentStages[outcome.afterStage].name} 강화 치료에 성공했어요!`
        : outcome.outcome === "destroyed"
          ? "강화 치료가 파괴되어 0강 입원 접수로 돌아갔어요."
          : `${outcome.beforeStage}강을 안전하게 유지했어요. 다시 도전해 보세요.`;
      setResult(message);
      toast[outcome.success ? "success" : "error"](message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "치료를 진행하지 못했습니다.");
    } finally {
      setTreating(false);
    }
  }

  return <main className="patient-app">
    <header className="patient-header"><Link href="/patient" className="hospital-wordmark"><Image src={assets.logo} alt="쿠지병동" width={58} height={58}/><span><b>쿠지병동</b><small>PATIENT WARD</small></span></Link><nav><a href="#chart">쿠지판</a><a href="#treatment">치료실</a><span><b>{session.name}</b> 환자님</span><button onClick={() => hospital.logout()} aria-label="로그아웃"><LogOut/></button></nav></header>
    <section className="patient-hero"><div><Badge tone="green"><CircleCheck/> 입원 승인 완료</Badge><p>환자번호 {session.uid.slice(0, 8).toUpperCase()}</p><h1>{session.name} 환자님,<br/>오늘의 쿠지 상태를 확인해 볼까요?</h1><div className="patient-vitals"><span><small>보유 포인트</small><b>{session.points.toLocaleString()}P</b></span><span><small>현재 치료 단계</small><b>{stage.name}</b></span><span><small>쿠지 잔여권</small><b>{hospital.board.remainingCards}장</b></span></div></div><Image src={assets.logo} alt="쿠지병동" width={280} height={280}/></section>

    <section id="chart" className="patient-section"><div className="hospital-section-title"><span>LIVE KUJI CHART</span><h2>실시간 쿠지 차트</h2><p>쿠지병동 프로그램에서 필요한 공개 정보만 읽어옵니다.</p></div>
      {!hospital.boardVisible ? <Card className="board-hidden"><Clock3/><h3>현재 쿠지판 진료가 잠시 중단됐어요</h3><p>사장님이 다시 공개하면 자동으로 표시됩니다.</p></Card> : <Card className="patient-board-card"><div className="board-visual"><Image src={assets.ticket} alt="쿠지 티켓" width={190} height={190}/><Badge tone={hospital.boardConnection === "live" ? "green" : "amber"}>{hospital.boardConnection === "live" ? "실시간 연동" : hospital.boardConnection === "preview" ? "실제 캐시 미리보기" : hospital.boardConnection === "demo" ? "시연 데이터" : "연결 확인 중"}</Badge></div><div className="board-chart-content"><span>현재 진료 중</span><h3>{hospital.board.boardName}</h3><p>{hospital.board.price || "가격 정보 확인 중"} · 총 {hospital.board.totalCards}장</p><div className="chart-numbers"><strong>{hospital.board.remainingCards}<small>장 남음</small></strong><span>{hospital.board.openedCount}장 처방 완료</span></div><Progress value={progress} color="#C95F5C"/><footer><span>마지막 반영</span><b>{hospital.board.updatedAt ? new Date(hospital.board.updatedAt).toLocaleString("ko-KR") : "확인 중"}</b></footer>{hospital.boardConnection === "preview" && <p className="inline-preview-note">2026년 7월 3일 실제 동기화 캐시의 개인정보 제거 미리보기입니다.</p>}{hospital.boardError && <p className="inline-error">{hospital.boardError}</p>}</div></Card>}
      <div className="prize-prescriptions">{hospital.board.prizes.slice(0, 4).map((prize, index) => <article key={prize.id}><span>{String.fromCharCode(65 + index)} 처방</span><Ticket/><b>{prize.name}</b><Badge tone={prize.available ? "green" : "gray"}>{prize.available ? "처방 가능" : "처방 완료"}</Badge></article>)}{hospital.board.lastOne && <article className="last-one"><span>LAST 처방</span><Sparkles/><b>{hospital.board.lastOne.name}</b><Badge tone="red">라스트원</Badge></article>}</div>
    </section>

    <section id="treatment" className="patient-section treatment-section"><div className="hospital-section-title"><span>POINT TREATMENT</span><h2>15단계 포인트 강화 치료실</h2><p>1~4강은 안전 구간이며, 5강부터 실패 시 표시된 확률로 0강까지 초기화될 수 있습니다.</p></div><div className="treatment-notice"><Megaphone/><div><b>강화 확률 공시</b><p>{hospital.treatmentSettings.notice}</p></div><span>{hospital.treatmentSettings.updatedAt ? new Date(hospital.treatmentSettings.updatedAt).toLocaleString("ko-KR") : "기본 확률표"}</span></div><div className="treatment-grid"><Card className="treatment-machine"><div className="treatment-orb"><HeartPulse/><small>CURRENT CARE</small><b>{stage.name}</b><span>{stage.description}</span></div><div className="treatment-metrics"><span><small>다음 강화</small><b>{currentStage >= MAX_TREATMENT_STAGE ? "완치" : nextStage.name}</b></span><span><small>필요 포인트</small><b>{currentStage >= MAX_TREATMENT_STAGE ? "-" : `${nextStage.cost.toLocaleString()}P`}</b></span><span><small>성공 확률</small><b>{currentStage >= MAX_TREATMENT_STAGE ? "완료" : `${nextRate.probability}%`}</b></span><span className="danger"><small>파괴 확률</small><b>{currentStage >= MAX_TREATMENT_STAGE ? "-" : `${nextRate.destroyProbability}%`}</b></span></div>{currentStage < MAX_TREATMENT_STAGE && <p className={`treatment-risk ${nextRate.destroyProbability ? "danger" : "safe"}`}>{nextRate.destroyProbability ? <Bomb/> : <ShieldCheck/>}{nextRate.destroyProbability ? `파괴 시 0강으로 돌아갑니다. 현재 파괴 확률은 ${nextRate.destroyProbability}%입니다.` : "현재는 파괴되지 않는 안전 강화 구간입니다."}</p>}{result && <p className="treatment-result"><Sparkles/>{result}</p>}<Button onClick={treat} disabled={treating || currentStage >= MAX_TREATMENT_STAGE || session.points < nextStage.cost}>{treating ? "강화 치료 기록 중..." : currentStage >= MAX_TREATMENT_STAGE ? "15강 완치 판정 완료" : `${nextStage.name} 도전하기`}</Button></Card><Card className="care-path"><h3>나의 0~15강 치료 경로</h3>{treatmentStages.map((item, index) => <div key={item.name} className={index <= currentStage ? "done" : index === currentStage + 1 ? "next" : ""}><i>{index < currentStage ? <CircleCheck/> : index}</i><span><b>{item.name}</b><small>{item.description}</small></span>{index === currentStage && <Badge tone="red">현재</Badge>}</div>)}</Card></div></section>
    <footer className="hospital-public-footer"><Image src={assets.logo} alt="" width={40} height={40}/><b>쿠지병동</b><span>쿠지병동 환자 전용 서비스 · 원본 쿠지판은 읽기 전용으로 보호됩니다.</span></footer>
  </main>;
}
