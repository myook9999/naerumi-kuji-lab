"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CircleDollarSign, FileClock, Receipt, ShieldCheck, Ticket, TrendingUp, WalletCards } from "lucide-react";
import { useHospital } from "@/components/hospital-provider";
import { Badge, Card, Progress } from "@/components/ui";
import { aggregateDailySales, aggregateMonthlySales, calculateBoardSettlement, calculatePortfolioSettlement, kstDateKey, won } from "@/lib/sales";
import { KpiCard, PageHeader, SectionTitle } from "./common";

export function HospitalSettlements() {
  const hospital = useHospital();
  const [selectedId, setSelectedId] = useState(hospital.board.id || "");
  const selected = hospital.boards.find((board) => board.id === selectedId) ?? hospital.board;
  const portfolio = useMemo(() => calculatePortfolioSettlement(hospital.boards), [hospital.boards]);
  const selectedSales = calculateBoardSettlement(selected);
  const daily = useMemo(() => aggregateDailySales(hospital.boards), [hospital.boards]);
  const monthly = useMemo(() => aggregateMonthlySales(hospital.boards), [hospital.boards]);
  const todayKey = kstDateKey(); const monthKey = todayKey.slice(0, 7);
  const today = daily.find((item) => item.date === todayKey) ?? { ticketCount: 0, grossSales: 0 };
  const thisMonth = monthly.find((item) => item.month === monthKey) ?? { ticketCount: 0, grossSales: 0 };
  const maxDaily = Math.max(1, ...daily.slice(0, 14).map((item) => item.grossSales));
  const sourceLabel = hospital.boardConnection === "live" ? "Firebase 실시간" : hospital.boardConnection === "preview" ? "실제 캐시 미리보기" : "연결 확인 중";

  return <>
    <PageHeader title="매출·정산 센터" description="전체 쿠지판 총합부터 판별, 월별, 일별 매출까지 한 화면에서 확인합니다." actions={<Badge tone={hospital.boardConnection === "live" ? "green" : "amber"}>{sourceLabel}</Badge>}/>
    <div className="kpi-grid six sales-kpis sales-kpis-primary">
      <KpiCard label="전체 누적 예상매출" value={won(portfolio.grossSales)} note={`${hospital.boards.length}개 쿠지판 총합`} icon={CircleDollarSign}/>
      <KpiCard label="전체 예상 정산액" value={won(portfolio.estimatedNet)} note={`임시 수수료 ${portfolio.feeRate}% 반영`} icon={Receipt} tone="mint"/>
      <KpiCard label="이번 달 매출" value={won(thisMonth.grossSales)} note={`${thisMonth.ticketCount.toLocaleString()}장 · ${monthKey}`} icon={CalendarDays} tone="blue"/>
      <KpiCard label="오늘 매출" value={won(today.grossSales)} note={`${today.ticketCount.toLocaleString()}장 · ${todayKey}`} icon={TrendingUp} tone="orange"/>
      <KpiCard label="전체 판매 티켓" value={`${portfolio.soldTickets.toLocaleString()}장`} note="모든 판의 오픈 수량" icon={Ticket} tone="purple"/>
      <KpiCard label="과거 날짜 미분류" value={`${portfolio.unclassifiedTickets.toLocaleString()}장`} note="1.0.7 이전 판매분" icon={FileClock} tone="pink"/>
    </div>

    <Card className="sales-board-table-card"><SectionTitle title="쿠지판별 매출" sub="판을 누르면 아래 상세 정산이 바뀝니다"/><div className="sales-board-table">
      <div className="sales-table-head"><span>쿠지판</span><span>판매</span><span>누적 매출</span><span>예상 정산</span><span>진행률</span></div>
      {portfolio.boardRows.map((row, index) => <button type="button" key={row.board.id || `${row.board.boardName}-${index}`} className={row.board.id === selected.id ? "active" : ""} onClick={() => setSelectedId(row.board.id || "")}><span className="sales-board-name"><small>#{index + 1}</small><b>{row.board.boardName}</b>{row.board.isProgramCurrent && <Badge tone="red">현재 판</Badge>}</span><span>{row.soldTickets.toLocaleString()}장</span><strong>{won(row.grossSales)}</strong><span>{won(row.estimatedNet)}</span><span className="sales-row-progress"><Progress value={row.sellThrough} color="#C95F5C"/><small>{row.sellThrough.toFixed(1)}%</small></span></button>)}
    </div></Card>

    <div className="sales-layout sales-detail-layout"><Card className="sales-board-card"><SectionTitle title={`${selected.boardName} 상세`} sub="선택한 쿠지판의 누적 판매 기준"/>
      <div className="sales-board-heading"><div><Badge tone={selected.remainingCards ? "green" : "gray"}>{selected.remainingCards ? "판매 진행 중" : "종료"}</Badge><h2>{selected.boardName}</h2><p>마지막 반영 {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("ko-KR") : "확인 중"}</p></div><strong>{won(selectedSales.grossSales)}</strong></div>
      <div className="sales-progress-label"><span>판매 진행률</span><b>{selectedSales.soldTickets.toLocaleString()} / {selected.totalCards.toLocaleString()}장</b></div><Progress value={selectedSales.sellThrough} color="#C95F5C"/>
      <div className="sales-board-numbers"><span><small>장당 판매가</small><b>{won(selectedSales.unitPrice)}</b></span><span><small>남은 판매 예상액</small><b>{won(selectedSales.remainingSales)}</b></span><span><small>완판 예상 매출</small><b>{won(selectedSales.projectedTotalSales)}</b></span></div>
    </Card><Card className="settlement-calculation"><SectionTitle title="선택 판 예상 정산" sub="현재는 수수료 3.5% 임시 기준"/>
      <div className="summary-list"><div><span>누적 예상 매출</span><b>{won(selectedSales.grossSales)}</b></div><div><span>예상 결제 수수료</span><b className="danger">-{won(selectedSales.estimatedFee)}</b></div><div><span>판매 티켓</span><b>{selectedSales.soldTickets.toLocaleString()}장</b></div><div><span>날짜 미분류</span><b>{(selected.sales?.unclassifiedTickets ?? selected.openedCount).toLocaleString()}장</b></div></div><div className="summary-total"><span>현재 예상 정산액</span><strong>{won(selectedSales.estimatedNet)}</strong></div>
    </Card></div>

    <div className="sales-period-grid"><Card className="sales-period-card"><SectionTitle title="일일 매출" sub="최근 14일 · 한국시간 기준"/><div className="sales-bars">{daily.slice(0, 14).map((item) => <div key={item.date}><span className="sales-bar-label"><b>{item.date.slice(5)}</b><small>{item.ticketCount}장</small></span><span className="sales-bar-track"><i style={{ width: `${Math.max(2, item.grossSales / maxDaily * 100)}%` }}/></span><strong>{won(item.grossSales)}</strong></div>)}{!daily.length && <div className="sales-empty-period"><CalendarDays/><p>1.0.7 업데이트 이후 새 판매분부터 일일 매출이 표시됩니다.</p></div>}</div></Card>
      <Card className="sales-period-card"><SectionTitle title="월 매출" sub="최근 12개월 · 새 추적 판매분"/><div className="monthly-sales-list">{monthly.slice(0, 12).map((item) => <div key={item.month}><span><b>{item.month}</b><small>{item.ticketCount.toLocaleString()}장 판매</small></span><strong>{won(item.grossSales)}</strong></div>)}{!monthly.length && <div className="sales-empty-period"><WalletCards/><p>새 판매 데이터가 쌓이면 월별 합계가 자동으로 표시됩니다.</p></div>}</div></Card>
    </div>
    <Card className="sales-source-card"><ShieldCheck/><div><b>안전한 공개 스냅샷 기준</b><p>ownerApi나 다른 지점 데이터는 읽지 않습니다. 프로그램이 쿠지병동 전용 공개 경로에 보낸 수량·가격·집계만 사용하며, 기존 날짜 없는 판매분은 전체 누적에는 포함하고 일·월 매출에서는 ‘과거 날짜 미분류’로 분리합니다.</p></div><Badge tone="green">읽기 전용</Badge></Card>
  </>;
}
