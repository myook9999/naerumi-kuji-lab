"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, ClipboardList, HeartPulse, LayoutDashboard, LogOut, Menu, MonitorDot, ShieldCheck, Users, WalletCards, X } from "lucide-react";
import { useState } from "react";
import { assets } from "@/config/brand";
import { useHospital } from "@/components/hospital-provider";
import { Card } from "@/components/ui";

const nav = [
  ["/admin/dashboard", "병동 대시보드", LayoutDashboard],
  ["/admin/settlements", "매출·정산 확인", WalletCards],
  ["/admin/kuji-boards", "쿠지판 모니터", MonitorDot],
  ["/admin/members", "환자 승인·포인트", Users],
  ["/admin/treatment", "강화 치료 관리", HeartPulse],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const hospital = useHospital();
  const [mobile, setMobile] = useState(false);
  if (!hospital.ready) return <main className="hospital-loading"><Activity/><p>관리자 병동을 준비하고 있어요...</p></main>;
  if (!hospital.session || hospital.session.role !== "owner") return <main className="admin-access-denied"><Card><Image src={assets.logo} alt="쿠지병동" width={100} height={100}/><ShieldCheck/><h1>사장님 전용 병동입니다</h1><p>관리자 계정으로 로그인해야 환자 정보와 포인트를 관리할 수 있습니다.</p><Link className="hospital-primary-link" href="/login">사장님 로그인</Link></Card></main>;
  async function logout() {
    await hospital.logout();
    router.push("/login");
  }
  return <div className="admin-frame hospital-admin-frame">
    <aside className={`sidebar hospital-sidebar ${mobile ? "open" : ""}`}>
      <button className="sidebar-close" onClick={() => setMobile(false)} aria-label="메뉴 닫기"><X/></button>
      <Link href="/admin/dashboard" className="hospital-admin-logo"><Image src={assets.logo} alt="쿠지병동" width={76} height={76}/><span><b>쿠지병동</b><small>OWNER WARD</small></span></Link>
      <p className="logo-sub">한 지점만 안전하게 관리하는 사장님 전용 병동</p>
      <nav>{nav.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setMobile(false)} className={path === href ? "active" : ""}><Icon/><span>{label}</span></Link>)}</nav>
      <div className="hospital-safety-card"><ShieldCheck/><b>원본 보호 중</b><p>쿠지병동 공개 스냅샷만 읽습니다.</p><small>ownerApi 미사용 · 다른 지점 접근 없음</small></div>
      <small className="copyright">© 2026 쿠지병동</small>
    </aside>
    <div className="admin-main">
      <header className="topbar hospital-topbar"><button className="mobile-menu" onClick={() => setMobile(true)} aria-label="메뉴 열기"><Menu/></button><span className="single-store"><ClipboardList/> 쿠지병동 단일 지점</span><span className={`sync-status ${hospital.boardConnection === "error" ? "error" : ""}`}><i/>{hospital.boardConnection === "live" ? "Firebase 실시간 연동" : hospital.boardConnection === "preview" ? "실제 캐시 미리보기" : hospital.boardConnection === "demo" ? "시연 모드" : "연동 확인 중"}</span><div className="top-spacer"/><Link className="patient-preview" href="/patient">환자 화면 보기</Link><button className="owner-profile" onClick={logout}><span>쿠</span><div><b>쿠지병동 사장님</b><small>관리자 · 로그아웃</small></div><LogOut/></button></header>
      <main className="admin-content">{children}</main>
    </div>
  </div>;
}
