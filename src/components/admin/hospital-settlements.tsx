"use client";

import { Calculator, CircleDollarSign, FileCheck, PackageCheck, Receipt, ShieldCheck, Ticket, TrendingUp } from "lucide-react";
import { useHospital } from "@/components/hospital-provider";
import { Badge, Card, Progress } from "@/components/ui";
import { calculateBoardSettlement, won } from "@/lib/sales";
import { KpiCard, PageHeader, SectionTitle } from "./common";

export function HospitalSettlements() {
  const hospital = useHospital();
  const sales = calculateBoardSettlement(hospital.board);
  const sourceLabel = hospital.firebaseMode ? "Firebase 공개판 기준" : hospital.boardConnection === "preview" ? "실제 캐시 미리보기 기준" : "시연 쿠지판 기준";

  return <>
    <PageHeader title="매출·정산 확인" description="현재 쿠지판의 판매 수량과 가격으로 예상 매출 및 정산액을 확인합니다." actions={<Badge tone={hospital.boardConnection === "live" ? "green" : "amber"}>{sourceLabel}</Badge>}/>
    <div className="kpi-grid six sales-kpis">
      <KpiCard label="현재 예상 매출" value={won(sales.grossSales)} note="오픈 수량 × 판매가" icon={CircleDollarSign}/>
      <KpiCard label="판매 티켓" value={`${sales.soldTickets}장`} note={`전체 ${hospital.board.totalCards}장`} icon={Ticket} tone="blue"/>
      <KpiCard label="판매율" value={`${sales.sellThrough.toFixed(1)}%`} note={`${hospital.board.remainingCards}장 남음`} icon={TrendingUp} tone="orange"/>
      <KpiCard label="예상 수수료" value={won(sales.estimatedFee)} note={`임시 기준 ${sales.feeRate}%`} icon={FileCheck} tone="pink"/>
      <KpiCard label="예상 정산액" value={won(sales.estimatedNet)} note="환불·배송비 제외" icon={Receipt} tone="mint"/>
      <KpiCard label="완판 예상 매출" value={won(sales.projectedTotalSales)} note="전체 수량 판매 기준" icon={PackageCheck} tone="purple"/>
    </div>

    <div className="sales-layout">
      <Card className="sales-board-card">
        <SectionTitle title="현재 쿠지판 매출" sub="쿠지병동 프로그램 공개 스냅샷에서 이미 읽은 값만 사용합니다"/>
        <div className="sales-board-heading"><div><Badge tone="green">판매 진행 중</Badge><h2>{hospital.board.boardName}</h2><p>마지막 반영 {hospital.board.updatedAt ? new Date(hospital.board.updatedAt).toLocaleString("ko-KR") : "확인 중"}</p></div><strong>{won(sales.grossSales)}</strong></div>
        <div className="sales-progress-label"><span>판매 진행률</span><b>{sales.soldTickets} / {hospital.board.totalCards}장</b></div>
        <Progress value={sales.sellThrough} color="#C95F5C"/>
        <div className="sales-board-numbers"><span><small>장당 판매가</small><b>{won(sales.unitPrice)}</b></span><span><small>남은 판매 예상액</small><b>{won(sales.remainingSales)}</b></span><span><small>완판 예상액</small><b>{won(sales.projectedTotalSales)}</b></span></div>
      </Card>

      <Card className="settlement-calculation">
        <SectionTitle title="예상 정산 계산" sub="현재는 수수료 3.5% 임시 기준"/>
        <div className="summary-list"><div><span>쿠지 판매 예상 매출</span><b>{won(sales.grossSales)}</b></div><div><span>예상 결제 수수료</span><b className="danger">-{won(sales.estimatedFee)}</b></div><div><span>환불·취소</span><b className="muted-value">미연동</b></div><div><span>배송비·기타 매출</span><b className="muted-value">미연동</b></div></div>
        <div className="summary-total"><span>현재 예상 정산액</span><strong>{won(sales.estimatedNet)}</strong></div>
        <p className="settlement-caution"><Calculator/> 실제 계약 수수료, 환불, 배송비가 연결되면 최종 정산액이 달라질 수 있습니다.</p>
      </Card>
    </div>

    <Card className="sales-source-card"><ShieldCheck/><div><b>Firebase 추가 부하 없이 계산 중</b><p>새 경로를 구독하지 않고, 쿠지판 화면에서 이미 받은 판매 수량과 가격을 재사용합니다. ownerApi·다른 지점·원본 데이터에는 접근하지 않습니다.</p></div><Badge tone="green">읽기 전용</Badge></Card>
  </>;
}
