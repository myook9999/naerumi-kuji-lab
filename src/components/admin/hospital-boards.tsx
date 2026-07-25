"use client";

import Image from "next/image";
import { Activity, Eye, EyeOff, LockKeyhole, RefreshCw, ShieldCheck, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { assets } from "@/config/brand";
import { useHospital } from "@/components/hospital-provider";
import { Badge, Button, Card, Progress } from "@/components/ui";
import { PageHeader, SectionTitle } from "./common";

export function HospitalBoards() {
  const hospital = useHospital();
  const [selectedId, setSelectedId] = useState(hospital.board.id || "");
  const selected = useMemo(() => hospital.boards.find((board) => board.id === selectedId) ?? hospital.board, [hospital.board, hospital.boards, selectedId]);
  const progress = selected.totalCards ? selected.openedCount / selected.totalCards * 100 : 0;
  const openBoards = hospital.boards.filter((board) => board.remainingCards > 0).length;
  const totalRemaining = hospital.boards.reduce((sum, board) => sum + board.remainingCards, 0);

  async function toggle() {
    try { await hospital.setBoardVisible(!hospital.boardVisible); }
    catch (error) { toast.error(error instanceof Error ? error.message : "공개 설정을 바꾸지 못했습니다."); }
  }

  return <>
    <PageHeader title="전체 쿠지판 현황" description="쿠지병동 프로그램의 모든 쿠지판을 한 화면에서 확인하고, 판을 선택해 상품 현황을 자세히 봅니다." actions={<Button variant={hospital.boardVisible ? "ghost" : "primary"} onClick={toggle}>{hospital.boardVisible ? <EyeOff/> : <Eye/>}{hospital.boardVisible ? "환자 화면 숨기기" : "환자 화면 공개하기"}</Button>}/>
    <div className="safety-boundary"><LockKeyhole/><div><b>원본 보호 · 읽기 전용</b><p>이 화면은 로컬 실제 동기화 캐시에서 개인정보와 구매 이력을 제거한 공개 필드만 표시합니다. 쿠지판 생성·수정·삭제, ownerApi, 다른 지점 접근은 없습니다.</p></div><Badge tone="green">10개 판 확인</Badge></div>

    <div className="board-fleet-kpis">
      <Card><small>전체 쿠지판</small><b>{hospital.boards.length}개</b><span>프로그램 저장 목록</span></Card>
      <Card><small>진행 가능한 판</small><b>{openBoards}개</b><span>잔여권 1장 이상</span></Card>
      <Card><small>전체 잔여권</small><b>{totalRemaining.toLocaleString()}장</b><span>모든 판 합계</span></Card>
      <Card><small>자료 기준</small><b>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleDateString("ko-KR") : "확인 중"}</b><span>{hospital.boardConnection === "live" ? "Firebase 실시간" : "실제 캐시 미리보기"}</span></Card>
    </div>

    <Card className="all-boards-card"><SectionTitle title="프로그램 전체 쿠지판" sub="카드를 누르면 아래 상세 상품 현황이 바뀝니다"/><div className="all-board-grid">{hospital.boards.map((board, index) => {
      const boardProgress = board.totalCards ? board.openedCount / board.totalCards * 100 : 0;
      const active = board.id === selected.id;
      return <button key={board.id || `${board.boardName}-${index}`} className={active ? "active" : ""} onClick={() => setSelectedId(board.id || "")}><span><b>#{index + 1} {board.boardName}</b>{board.isProgramCurrent && <Badge tone="red">프로그램 선택</Badge>}</span><strong>{board.remainingCards.toLocaleString()}<small>장 남음</small></strong><Progress value={boardProgress} color={board.remainingCards ? "#C95F5C" : "#9b9996"}/><footer><span>오픈 {board.openedCount.toLocaleString()} / {board.totalCards.toLocaleString()}</span><span>{board.remainingCards ? "진행 가능" : "종료"}</span></footer></button>;
    })}</div></Card>

    <div className="hospital-board-layout">
      <Card className="hospital-board-detail"><div className="hospital-board-cover"><Image src={assets.ticket} alt="쿠지병동 티켓" width={200} height={200}/><span><Activity/> {hospital.boardConnection === "live" ? "Firebase 실시간" : "실제 캐시 미리보기"}</span></div><div className="hospital-board-body"><Badge tone={selected.remainingCards ? "red" : "gray"}>{selected.remainingCards ? "진행 가능한 판" : "종료된 판"}</Badge><h2>{selected.boardName}</h2><p>쿠지병동 전체 목록 #{(selected.sourceIndex ?? 0) + 1} · 읽기 전용 공개 데이터</p><div className="detail-kpis"><div><span>전체</span><b>{selected.totalCards}</b></div><div><span>오픈</span><b>{selected.openedCount}</b></div><div><span>잔여</span><b>{selected.remainingCards}</b></div></div><Progress value={progress} color="#C95F5C"/><div className="board-sync-row"><span>마지막 반영</span><b>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("ko-KR") : "확인 중"}</b></div>{hospital.boardError && <p className="inline-error">{hospital.boardError}</p>}</div></Card>
      <Card><SectionTitle title="사이트 표시 설정" sub="원본 데이터와 분리된 사이트 전용 설정입니다"/><div className="visibility-card"><span className={hospital.boardVisible ? "on" : ""}>{hospital.boardVisible ? <Eye/> : <EyeOff/>}</span><div><b>환자 화면 쿠지판</b><p>{hospital.boardVisible ? "승인 환자에게 전체 현황 공개 중" : "승인 환자 화면에서 숨김"}</p></div><button onClick={toggle}>{hospital.boardVisible ? "공개" : "숨김"}</button></div><div className="source-checks"><p><ShieldCheck/> 쿠지병동 지점 ID 고정</p><p><ShieldCheck/> 고객 대기열·구매 이력 제외</p><p><ShieldCheck/> 계정·당첨 번호·이미지 제외</p><p><ShieldCheck/> 원본 쓰기 코드 없음</p></div><Button variant="ghost" onClick={() => window.location.reload()}><RefreshCw/> 연결 상태 새로 확인</Button></Card>
    </div>
    <Card><SectionTitle title={`${selected.boardName} 상품 현황`} sub={`공개 상품 ${selected.prizes.length}종 · 잔여 수량만 표시`}/><div className="admin-prize-grid">{selected.prizes.map((prize, index) => <article key={prize.id}><span>{String.fromCharCode(65 + Math.min(index, 25))}상</span><Ticket/><b>{prize.name}</b><Badge tone={prize.available ? "green" : "gray"}>{prize.available ? `${prize.remainingCount ?? ""}개 남음` : "소진"}</Badge></article>)}{!selected.prizes.length && <div className="admin-empty"><Ticket/><p>공개된 상품 정보가 없습니다.</p></div>}</div></Card>
    <Card className="admin-board-results"><SectionTitle title={`${selected.boardName} 고객별 뽑기 결과`} sub="닉네임별 상위상과 랜덤굿즈 수량 집계 · 계정/주소/당첨번호 제외"/><div className="board-result-list">{selected.customerResults?.map((customer) => <article key={customer.id}><div className="result-customer"><span>{customer.nickname.slice(0, 1)}</span><div><b>{customer.nickname}</b><small>총 {customer.totalDraws.toLocaleString()}회 뽑기</small></div></div><strong>랜덤굿즈 {customer.randomGoodsCount.toLocaleString()}개</strong><div className="result-upper-prizes">{customer.upperPrizes.length ? customer.upperPrizes.map((prize) => <Badge key={prize.name} tone="red">{prize.name}{prize.count > 1 ? ` ×${prize.count}` : ""}</Badge>) : <Badge tone="gray">상위상 없음</Badge>}</div></article>)}</div>{!selected.customerResults?.length && <div className="admin-empty"><Ticket/><p>이 판의 뽑기 기록이 없습니다.</p></div>}</Card>
  </>;
}
