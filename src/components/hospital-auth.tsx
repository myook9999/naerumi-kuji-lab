"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, HeartPulse, KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { assets, brand } from "@/config/brand";
import { useHospital } from "@/components/hospital-provider";
import { Button } from "@/components/ui";

export function HospitalAuth({ mode }: { mode: "login" | "signup" | "reset" }) {
  const hospital = useHospital();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        const session = await hospital.login(String(form.get("loginId")), String(form.get("password")));
        router.push(session.role === "owner" ? "/admin/dashboard" : "/patient");
      } else if (mode === "signup") {
        const password = String(form.get("password"));
        if (password !== String(form.get("passwordConfirm"))) throw new Error("비밀번호 확인이 일치하지 않습니다.");
        await hospital.signup({ loginId: String(form.get("loginId")), password, nickname: String(form.get("nickname")) });
        toast.success("가입 신청이 접수됐습니다. 사장님 승인 후 로그인할 수 있어요.");
        router.push("/login");
      } else {
        setSent(true);
        toast.success("비밀번호 변경은 쿠지병동 사장님에게 문의해 주세요.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "요청을 처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "login" ? "쿠지병동 접수처 로그인" : mode === "signup" ? "신규 환자 등록 신청" : "비밀번호 도움 요청";
  return <main className="auth-page hospital-auth-page">
    <section className="auth-brand hospital-auth-brand">
      <Link href="/" className="hospital-wordmark"><Image src={assets.logo} alt="쿠지병동" width={84} height={84}/><span><b>{brand.name}</b><small>{brand.englishName}</small></span></Link>
      <div className="hospital-auth-copy"><Image className="hospital-auth-ticket" src={assets.ticket} width={330} height={330} alt="쿠지병동 티켓" priority/><span>KUJI CARE CENTER</span><h1>{mode === "login" ? <>쿠지로 지친 마음,<br/>오늘도 치료해 드려요</> : mode === "signup" ? <>쿠지병동의 새로운<br/>환자로 접수할게요</> : <>다시 병동에 들어오실 수<br/>있도록 도와드릴게요</>}</h1><p>{brand.slogan}</p><div className="auth-points"><span><ShieldCheck/>사장님 승인 회원제</span><span><ClipboardCheck/>안전한 포인트 진료 기록</span></div></div>
    </section>
    <section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}>
      <span className="auth-icon hospital-auth-icon">{mode === "login" ? <KeyRound/> : mode === "signup" ? <UserPlus/> : <HeartPulse/>}</span><h2>{title}</h2><p>{mode === "signup" ? "닉네임·아이디·비밀번호를 직접 정한 뒤 사장님 승인을 기다려 주세요." : "쿠지병동 전용 아이디로 안전하게 입장하세요."}</p>
      {mode === "signup" && <label>사용할 닉네임<input name="nickname" required minLength={2} maxLength={12} placeholder="2~12자 닉네임" autoComplete="nickname"/></label>}
      <label>로그인 아이디<input name="loginId" required minLength={4} maxLength={24} pattern={"[a-z0-9._\\-]{4,24}"} defaultValue={mode === "login" ? "owner" : ""} placeholder="영문 소문자·숫자 4~24자" autoCapitalize="none" autoComplete="username"/><small>영문 소문자, 숫자, 점(.), 밑줄(_), 하이픈(-)을 사용할 수 있어요.</small></label>
      {mode !== "reset" && <label>비밀번호<input name="password" type="password" required minLength={8} maxLength={72} defaultValue={mode === "login" ? "demo1234" : ""} placeholder="8자 이상" autoComplete={mode === "signup" ? "new-password" : "current-password"}/></label>}
      {mode === "signup" && <><label>비밀번호 확인<input name="passwordConfirm" type="password" required minLength={8} maxLength={72} placeholder="비밀번호를 한 번 더 입력" autoComplete="new-password"/></label><label className="check-label"><input type="checkbox" required/>회원 운영 및 개인정보 처리 안내에 동의합니다.</label></>}
      <Button disabled={busy || sent}>{busy ? "처리 중..." : sent ? "사장님에게 문의해 주세요" : mode === "login" ? "병동 입장하기" : mode === "signup" ? "가입 승인 요청하기" : "도움 요청 확인"}</Button>
      {mode === "login" && <Link className="auth-signup-cta" href="/signup"><UserPlus/> 처음 오셨나요? 회원가입 신청</Link>}
      {mode === "login" && !hospital.firebaseMode && <div className="demo-account hospital-demo-account"><b>시연 계정 (비밀번호 공통: demo1234)</b><code>사장님 아이디: owner</code><code>승인 환자 아이디: patient</code><code>승인 대기 아이디: pending</code></div>}
      <footer>{mode === "login" ? <><Link href="/reset-password">비밀번호 도움</Link><span>승인 문의: 쿠지병동 사장님</span></> : <Link href="/login">← 로그인으로 돌아가기</Link>}</footer>
    </form></section>
  </main>;
}
