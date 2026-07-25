"use client";

import Image from "next/image";
import { Activity, Eye, EyeOff, LockKeyhole, RefreshCw, ShieldCheck, Ticket } from "lucide-react";
import { toast } from "sonner";
import { assets } from "@/config/brand";
import { useHospital } from "@/components/hospital-provider";
import { Badge, Button, Card, Progress } from "@/components/ui";
import { PageHeader, SectionTitle } from "./common";

export function HospitalBoards() {
  const hospital = useHospital();
  const progress = hospital.board.totalCards ? hospital.board.openedCount / hospital.board.totalCards * 100 : 0;
  async function toggle() {
    try { await hospital.setBoardVisible(!hospital.boardVisible); }
    catch (error) { toast.error(error instanceof Error ? error.message : "공개 설정을 바꾸지 못했습니다."); }
  }
  return <>
    <PageHeader title="쿠지판 모니터" description="쿠지병동 프로그램이 만든 공개용 현황만 실시간으로 확인합니다." actions={<Button variant={hospital.boardVisible ? "ghost" : "primary"} onClick={toggle}>{hospital.boardVisible ? <EyeOff/> : <Eye/>}{hospital.boardVisible ? "환자 화면 숨기기" : "환자 화면 공개하기"}</Button>}/>
    <div className="safety-boundary"><LockKeyhole/><div><b>원본 보호 모드</b><p>이 화면에는 쿠지판 생성·수정·삭제 기능이 없습니다. ownerApi, serverData, 다른 지점 데이터에는 접근하지 않습니다.</p></div><Badge tone="green">READ ONLY</Badge></div>
    <div className="hospital-board-layout">
      <Card className="hospital-board-detail"><div className="hospital-board-cover"><Image src={assets.ticket} alt="쿠지병동 티켓" width={200} height={200}/><span><Activity/> {hospital.boardConnection === "live" ? "Firebase 실시간" : hospital.boardConnection === "demo" ? "시연 데이터" : "연결 확인"}</span></div><div className="hospital-board-body"><Badge tone="red">현재 쿠지판</Badge><h2>{hospital.board.boardName}</h2><p>고정 소스: branches/kuji-byeongdong/boards/current</p><div className="detail-kpis"><div><span>전체</span><b>{hospital.board.totalCards}</b></div><div><span>오픈</span><b>{hospital.board.openedCount}</b></div><div><span>잔여</span><b>{hospital.board.remainingCards}</b></div></div><Progress value={progress} color="#C95F5C"/><div className="board-sync-row"><span>마지막 반영</span><b>{hospital.board.updatedAt ? new Date(hospital.board.updatedAt).toLocaleString("ko-KR") : "확인 중"}</b></div>{hospital.boardError && <p className="inline-error">{hospital.boardError}</p>}</div></Card>
      <Card><SectionTitle title="사이트 표시 설정" sub="원본 데이터와 분리된 사이트 전용 설정입니다"/><div className="visibility-card"><span className={hospital.boardVisible ? "on" : ""}>{hospital.boardVisible ? <Eye/> : <EyeOff/>}</span><div><b>환자 화면 쿠지판</b><p>{hospital.boardVisible ? "승인 환자에게 공개 중" : "승인 환자 화면에서 숨김"}</p></div><button onClick={toggle}>{hospital.boardVisible ? "공개" : "숨김"}</button></div><div className="source-checks"><p><ShieldCheck/> 쿠지병동 지점 ID 고정</p><p><ShieldCheck/> 실시간 리스너 1개만 사용</p><p><ShieldCheck/> 필요한 공개 필드만 정제</p><p><ShieldCheck/> 원본 쓰기 코드 없음</p></div><Button variant="ghost" onClick={() => window.location.reload()}><RefreshCw/> 연결 상태 새로 확인</Button></Card>
    </div>
    <Card><SectionTitle title="상품 처방 현황" sub="공개 스냅샷에 포함된 상품 상태"/><div className="admin-prize-grid">{hospital.board.prizes.map((prize, index) => <article key={prize.id}><span>{String.fromCharCode(65 + index)}상</span><Ticket/><b>{prize.name}</b><Badge tone={prize.available ? "green" : "gray"}>{prize.available ? "남음" : "소진"}</Badge></article>)}{!hospital.board.prizes.length && <div className="admin-empty"><Ticket/><p>공개된 상품 정보가 없습니다.</p></div>}</div></Card>
  </>;
}
