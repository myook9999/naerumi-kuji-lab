"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { toast } from "sonner";
import { MAX_TREATMENT_STAGE } from "@/config/hospital";
import previewBoardsData from "@/data/kuji-byeongdong-boards-preview.json";
import { getFirebaseClient, isFirebaseMode, isLiveBoardMode, subscribeHospitalBoards } from "@/lib/firebase/client";
import { resolveTreatmentOutcome } from "@/lib/treatment";
import { defaultTreatmentSettings, sanitizeTreatmentSettings, validateTreatmentRates } from "@/lib/treatment-settings";
import type { CustomerWinning, HospitalMember, HospitalSession, PublicBoardCollectionPreview, PublicBoardSnapshot, ShippingAddress, ShippingStatus, TreatmentLog, TreatmentRate, TreatmentResult, TreatmentSettings } from "@/types/hospital";

type BoardConnection = "demo" | "preview" | "connecting" | "live" | "error";

interface HospitalContextValue {
  session: HospitalSession | null;
  ready: boolean;
  firebaseMode: boolean;
  board: PublicBoardSnapshot;
  boards: PublicBoardSnapshot[];
  boardConnection: BoardConnection;
  boardError: string;
  boardVisible: boolean;
  members: HospitalMember[];
  treatmentSettings: TreatmentSettings;
  treatmentLogs: TreatmentLog[];
  winnings: CustomerWinning[];
  shippingAddresses: Record<string, ShippingAddress>;
  login: (loginId: string, password: string) => Promise<HospitalSession>;
  signup: (input: { loginId: string; password: string; nickname: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  changeMemberStatus: (uid: string, status: "approved" | "rejected") => Promise<void>;
  changePoints: (uid: string, amount: number, memo: string) => Promise<void>;
  setBoardVisible: (visible: boolean) => Promise<void>;
  selectBoard: (id: string) => void;
  refreshTreatmentAdmin: () => Promise<TreatmentSettings | null>;
  saveTreatmentSettings: (rates: TreatmentRate[], notice: string) => Promise<void>;
  runTreatment: () => Promise<TreatmentResult>;
  refreshFulfillment: () => Promise<void>;
  saveShippingAddress: (address: Omit<ShippingAddress, "updatedAt">) => Promise<void>;
  updateShipment: (id: string, shippingStatus: ShippingStatus, carrier: string, trackingNumber: string) => Promise<void>;
}

const previewCollection = previewBoardsData as PublicBoardCollectionPreview;
const demoBoards = previewCollection.boards;
const demoBoard = demoBoards[previewCollection.featuredIndex] ?? demoBoards[0];

const demoMembers: HospitalMember[] = [
  { uid: "patient-1", loginId: "patient", email: "patient@kujihospital.test", name: "별밤 환자", phone: "010-1234-5678", role: "patient", status: "approved", points: 28000, treatmentStage: 6, createdAt: "2026-07-20T09:30:00.000Z", approvedAt: "2026-07-20T10:00:00.000Z" },
  { uid: "pending-1", loginId: "pending", email: "pending@kujihospital.test", name: "새봄 환자", phone: "010-9876-5432", role: "patient", status: "pending", points: 0, treatmentStage: 0, createdAt: "2026-07-25T01:20:00.000Z" },
  { uid: "patient-2", loginId: "recovery", email: "recovery@kujihospital.test", name: "행운 환자", phone: "010-5555-1212", role: "patient", status: "approved", points: 85000, treatmentStage: 11, createdAt: "2026-07-18T03:10:00.000Z", approvedAt: "2026-07-18T05:00:00.000Z" },
];

const emptyAddress: ShippingAddress = { recipient: "", phone: "", postalCode: "", address1: "", address2: "", memo: "", updatedAt: "" };
const demoShippingAddresses: Record<string, ShippingAddress> = {
  "patient-1": { ...emptyAddress },
  "patient-2": { recipient: "행운 환자", phone: "010-5555-1212", postalCode: "04524", address1: "서울특별시 중구 세종대로 110", address2: "쿠지병동 2층", memo: "문 앞에 놓아주세요.", updatedAt: "2026-07-24T05:10:00.000Z" },
};
const demoWinnings: CustomerWinning[] = [
  { id: "winning-demo-1", uid: "patient-1", loginId: "patient", name: "별밤 환자", boardName: "600장", prizeName: "여성형 거인A상", tier: "A상", wonAt: "2026-07-24T04:20:00.000Z", shippingStatus: "address_required" },
  { id: "winning-demo-2", uid: "patient-1", loginId: "patient", name: "별밤 환자", boardName: "600장", prizeName: "아머드 올마이트", tier: "LAST상", wonAt: "2026-07-23T10:30:00.000Z", shippingStatus: "preparing" },
  { id: "winning-demo-3", uid: "patient-2", loginId: "recovery", name: "행운 환자", boardName: "1000장 2탄", prizeName: "디자인코코고죠", tier: "A상", wonAt: "2026-07-22T08:45:00.000Z", shippingStatus: "shipped", carrier: "CJ대한통운", trackingNumber: "123456789012", shippedAt: "2026-07-24T02:00:00.000Z" },
];
const demoTreatmentLogs: TreatmentLog[] = [
  { id: "treatment-demo-1", uid: "patient-2", loginId: "recovery", name: "행운 환자", outcome: "success", success: true, destroyed: false, beforeStage: 10, afterStage: 11, cost: 12000, points: 85000, probability: 25, destroyProbability: 25, createdAt: "2026-07-24T06:15:00.000Z" },
  { id: "treatment-demo-2", uid: "patient-1", loginId: "patient", name: "별밤 환자", outcome: "failed", success: false, destroyed: false, beforeStage: 6, afterStage: 6, cost: 5000, points: 28000, probability: 58, destroyProbability: 8, createdAt: "2026-07-24T05:30:00.000Z" },
];

const HospitalContext = createContext<HospitalContextValue | null>(null);
const sessionKey = "kuji-hospital:session";
const membersKey = "kuji-hospital:members";
const visibleKey = "kuji-hospital:board-visible";
const credentialsKey = "kuji-hospital:demo-credentials";
const treatmentSettingsKey = "kuji-hospital:treatment-settings";
const treatmentLogsKey = "kuji-hospital:treatment-logs";
const winningsKey = "kuji-hospital:winnings";
const shippingAddressesKey = "kuji-hospital:shipping-addresses";
const defaultDemoCredentials: Record<string, string> = { owner: "demo1234", patient: "demo1234", pending: "demo1234", recovery: "demo1234" };

function loginIdToEmail(loginId: string) {
  const normalized = loginId.trim().toLowerCase();
  return normalized.includes("@") ? normalized : `${normalized}@members.kujihospital.local`;
}
async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const firebase = getFirebaseClient();
  const user = firebase?.auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "요청을 처리하지 못했습니다.");
  return result as T;
}

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const firebaseMode = isFirebaseMode();
  const liveBoardMode = isLiveBoardMode();
  const [session, setSession] = useState<HospitalSession | null>(null);
  const [ready, setReady] = useState(false);
  const [board, setBoard] = useState(demoBoard);
  const [boards, setBoards] = useState<PublicBoardSnapshot[]>(demoBoards);
  const [boardConnection, setBoardConnection] = useState<BoardConnection>(firebaseMode ? "connecting" : "preview");
  const [boardError, setBoardError] = useState("");
  const [members, setMembers] = useState<HospitalMember[]>(demoMembers);
  const [boardVisible, setVisible] = useState(true);
  const [demoCredentials, setDemoCredentials] = useState<Record<string, string>>(defaultDemoCredentials);
  const [treatmentSettings, setTreatmentSettings] = useState<TreatmentSettings>(defaultTreatmentSettings);
  const [treatmentLogs, setTreatmentLogs] = useState<TreatmentLog[]>(demoTreatmentLogs);
  const [winnings, setWinnings] = useState<CustomerWinning[]>(demoWinnings);
  const [shippingAddresses, setShippingAddresses] = useState<Record<string, ShippingAddress>>(demoShippingAddresses);

  useEffect(() => {
    if (!firebaseMode) {
      try {
        const savedSession = localStorage.getItem(sessionKey);
        const savedMembers = localStorage.getItem(membersKey);
        const savedVisible = localStorage.getItem(visibleKey);
        const savedCredentials = localStorage.getItem(credentialsKey);
        const savedTreatmentSettings = localStorage.getItem(treatmentSettingsKey);
        const savedTreatmentLogs = localStorage.getItem(treatmentLogsKey);
        const savedWinnings = localStorage.getItem(winningsKey);
        const savedShippingAddresses = localStorage.getItem(shippingAddressesKey);
        if (savedSession) setSession(JSON.parse(savedSession));
        if (savedMembers) setMembers(JSON.parse(savedMembers));
        if (savedVisible) setVisible(savedVisible === "true");
        if (savedCredentials) setDemoCredentials({ ...defaultDemoCredentials, ...JSON.parse(savedCredentials) });
        if (savedTreatmentSettings) setTreatmentSettings(sanitizeTreatmentSettings(JSON.parse(savedTreatmentSettings)));
        if (savedTreatmentLogs) setTreatmentLogs(JSON.parse(savedTreatmentLogs));
        if (savedWinnings) setWinnings(JSON.parse(savedWinnings));
        if (savedShippingAddresses) setShippingAddresses(JSON.parse(savedShippingAddresses));
      } catch { /* 손상된 데모 저장값은 초기값으로 복구한다. */ }
      setReady(true);
      return;
    }

    const firebase = getFirebaseClient();
    if (!firebase) {
      setBoardConnection("error");
      setBoardError("Firebase 환경 설정이 아직 완료되지 않았습니다.");
      setReady(true);
      return;
    }
    return onAuthStateChanged(firebase.auth, async (user) => {
      if (!user) {
        setSession(null);
        setReady(true);
        return;
      }
      try {
        const [profile, treatment] = await Promise.all([
          apiRequest<{ session: HospitalSession }>("/api/member/profile"),
          apiRequest<{ settings: TreatmentSettings }>("/api/treatment/settings"),
        ]);
        setSession(profile.session);
        setTreatmentSettings(treatment.settings);
      } catch {
        setSession(null);
      } finally {
        setReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!firebaseMode) {
      localStorage.setItem(membersKey, JSON.stringify(members));
      localStorage.setItem(visibleKey, String(boardVisible));
      localStorage.setItem(credentialsKey, JSON.stringify(demoCredentials));
      localStorage.setItem(treatmentSettingsKey, JSON.stringify(treatmentSettings));
      localStorage.setItem(treatmentLogsKey, JSON.stringify(treatmentLogs.slice(0, 100)));
      localStorage.setItem(winningsKey, JSON.stringify(winnings));
      localStorage.setItem(shippingAddressesKey, JSON.stringify(shippingAddresses));
      if (session) localStorage.setItem(sessionKey, JSON.stringify(session));
      else localStorage.removeItem(sessionKey);
    }
  }, [firebaseMode, members, boardVisible, session, demoCredentials, treatmentSettings, treatmentLogs, winnings, shippingAddresses]);

  useEffect(() => {
    if (!liveBoardMode || !session || session.status !== "approved") return;
    setBoardConnection("connecting");
    let unsubscribe: () => void = () => {};
    let cancelled = false;
    const start = async () => {
      const firebase = getFirebaseClient();
      if (!firebase) throw new Error("Firebase 공개판 설정이 없습니다.");
      if (!firebase.auth.currentUser) await signInAnonymously(firebase.auth);
      if (cancelled) return;
      unsubscribe = subscribeHospitalBoards(
        (next) => {
          setBoards(next.boards);
          setBoard((current) => next.boards.find((item) => item.id === current.id) ?? next.boards[next.featuredIndex] ?? next.boards[0]);
          setBoardConnection("live");
          setBoardError("");
        },
        (message) => { setBoardConnection("error"); setBoardError(message); },
      );
    };
    start().catch(() => { setBoardConnection("error"); setBoardError("쿠지병동 공개판 실시간 연결을 확인해 주세요."); });
    return () => { cancelled = true; unsubscribe(); };
  }, [liveBoardMode, session?.uid, session?.status]);

  const login = useCallback(async (loginId: string, password: string) => {
    const normalizedId = loginId.trim().toLowerCase();
    if (!firebaseMode) {
      if (demoCredentials[normalizedId] !== password) throw new Error("아이디 또는 비밀번호를 확인해 주세요.");
      const next: HospitalSession | undefined = normalizedId === "owner"
        ? { uid: "owner-demo", loginId: "owner", email: "owner@kujihospital.test", name: "쿠지병동 사장님", phone: "", role: "owner", status: "approved", points: 0, treatmentStage: 0 }
        : members.find((member) => member.loginId === normalizedId);
      if (!next) throw new Error("등록된 데모 아이디가 아닙니다.");
      setSession(next);
      return next;
    }
    const firebase = getFirebaseClient();
    if (!firebase) throw new Error("Firebase 환경 설정을 확인해 주세요.");
    await signInWithEmailAndPassword(firebase.auth, loginIdToEmail(normalizedId), password);
    const [profile, treatment] = await Promise.all([
      apiRequest<{ session: HospitalSession }>("/api/member/profile"),
      apiRequest<{ settings: TreatmentSettings }>("/api/treatment/settings"),
    ]);
    setSession(profile.session);
    setTreatmentSettings(treatment.settings);
    return profile.session;
  }, [firebaseMode, members, demoCredentials]);

  const signup = useCallback(async (input: { loginId: string; password: string; nickname: string }) => {
    const loginId = input.loginId.trim().toLowerCase();
    if (!/^[a-z0-9._-]{4,24}$/.test(loginId)) throw new Error("아이디는 영문 소문자·숫자 조합 4~24자로 입력해 주세요.");
    if (input.password.length < 8) throw new Error("비밀번호는 8자 이상 입력해 주세요.");
    if (!firebaseMode) {
      if (members.some((member) => member.loginId === loginId)) throw new Error("이미 사용 중인 아이디입니다.");
      setMembers((current) => [{ uid: crypto.randomUUID(), loginId, email: loginIdToEmail(loginId), name: input.nickname, phone: "", role: "patient", status: "pending", points: 0, treatmentStage: 0, createdAt: new Date().toISOString() }, ...current]);
      // 시연 모드에서만 로컬 저장소에 보관하며 운영 모드는 Firebase Authentication을 사용한다.
      setDemoCredentials((current) => ({ ...current, [loginId]: input.password }));
      return;
    }
    const firebase = getFirebaseClient();
    if (!firebase) throw new Error("Firebase 환경 설정을 확인해 주세요.");
    await createUserWithEmailAndPassword(firebase.auth, loginIdToEmail(loginId), input.password);
    await apiRequest("/api/member/register", { method: "POST", body: JSON.stringify({ loginId, nickname: input.nickname }) });
    await signOut(firebase.auth);
  }, [firebaseMode, members]);

  const logout = useCallback(async () => {
    const firebase = getFirebaseClient();
    if (firebaseMode && firebase) await signOut(firebase.auth);
    setSession(null);
  }, [firebaseMode]);

  const refreshMembers = useCallback(async () => {
    if (!firebaseMode) return;
    const result = await apiRequest<{ members: HospitalMember[] }>("/api/admin/members");
    setMembers(result.members);
  }, [firebaseMode]);

  const changeMemberStatus = useCallback(async (uid: string, status: "approved" | "rejected") => {
    if (firebaseMode) {
      const result = await apiRequest<{ member: HospitalMember }>("/api/admin/members", { method: "PATCH", body: JSON.stringify({ action: "status", uid, status }) });
      setMembers((current) => current.map((member) => member.uid === uid ? result.member : member));
    } else {
      const now = new Date().toISOString();
      setMembers((current) => current.map((member) => member.uid === uid ? { ...member, status, approvedAt: status === "approved" ? now : member.approvedAt } : member));
    }
    toast.success(status === "approved" ? "가입을 승인했습니다." : "가입 신청을 거절했습니다.");
  }, [firebaseMode]);

  const changePoints = useCallback(async (uid: string, amount: number, memo: string) => {
    if (!Number.isInteger(amount) || amount === 0) throw new Error("변경할 포인트를 입력해 주세요.");
    if (firebaseMode) {
      const result = await apiRequest<{ member: HospitalMember }>("/api/admin/members", { method: "PATCH", body: JSON.stringify({ action: "points", uid, amount, memo }) });
      setMembers((current) => current.map((member) => member.uid === uid ? result.member : member));
    } else {
      const target = members.find((member) => member.uid === uid);
      if (!target || target.points + amount < 0) throw new Error("보유 포인트보다 많이 차감할 수 없습니다.");
      setMembers((current) => current.map((member) => member.uid === uid ? { ...member, points: member.points + amount } : member));
    }
    toast.success(`${amount > 0 ? "+" : ""}${amount.toLocaleString()}P를 반영했습니다.`);
  }, [firebaseMode, members]);

  const setBoardVisible = useCallback(async (visible: boolean) => {
    if (firebaseMode) await apiRequest("/api/admin/board-settings", { method: "PATCH", body: JSON.stringify({ boardVisible: visible }) });
    setVisible(visible);
    toast.success(visible ? "환자 화면에 쿠지판을 공개했습니다." : "환자 화면의 쿠지판을 숨겼습니다.");
  }, [firebaseMode]);

  const selectBoard = useCallback((id: string) => {
    const selected = boards.find((item) => item.id === id);
    if (selected) setBoard(selected);
  }, [boards]);

  const refreshTreatmentAdmin = useCallback(async () => {
    if (!firebaseMode) return null;
    const result = await apiRequest<{ settings: TreatmentSettings; logs: TreatmentLog[] }>("/api/admin/treatment");
    setTreatmentSettings(result.settings);
    setTreatmentLogs(result.logs);
    return result.settings;
  }, [firebaseMode]);

  const saveTreatmentSettings = useCallback(async (rates: TreatmentRate[], notice: string) => {
    const validationError = validateTreatmentRates(rates);
    if (validationError) throw new Error(validationError);
    if (notice.trim().length < 2) throw new Error("고객에게 표시할 변경 공지를 입력해 주세요.");
    if (firebaseMode) {
      const result = await apiRequest<{ settings: TreatmentSettings }>("/api/admin/treatment", { method: "PATCH", body: JSON.stringify({ rates, notice: notice.trim() }) });
      setTreatmentSettings(result.settings);
    } else {
      setTreatmentSettings({ rates: rates.map((rate) => ({ ...rate })), notice: notice.trim(), updatedAt: new Date().toISOString() });
    }
    toast.success("강화 확률을 저장하고 고객 화면에 변경 내용을 공시했습니다.");
  }, [firebaseMode]);

  const runTreatment = useCallback(async () => {
    if (!session || session.role !== "patient" || session.status !== "approved") throw new Error("승인된 환자만 치료를 받을 수 있습니다.");
    if (firebaseMode) {
      const result = await apiRequest<{ treatment: TreatmentResult; session: HospitalSession }>("/api/treatment/attempt", { method: "POST" });
      setSession(result.session);
      return result.treatment;
    }
    if (session.treatmentStage >= MAX_TREATMENT_STAGE) throw new Error("이미 15강 완치 판정을 받았습니다.");
    const { outcome, afterStage, target: next } = resolveTreatmentOutcome(session.treatmentStage, Math.random() * 100, treatmentSettings.rates);
    if (session.points < next.cost) throw new Error("치료에 필요한 포인트가 부족합니다.");
    const updated = { ...session, points: session.points - next.cost, treatmentStage: afterStage };
    const createdAt = new Date().toISOString();
    setSession(updated);
    setMembers((current) => current.map((member) => member.uid === updated.uid ? { ...member, ...updated, lastTreatmentAt: new Date().toISOString() } : member));
    const treatment: TreatmentResult = { outcome, success: outcome === "success", destroyed: outcome === "destroyed", beforeStage: session.treatmentStage, afterStage: updated.treatmentStage, cost: next.cost, points: updated.points, probability: next.probability, destroyProbability: next.destroyProbability, createdAt };
    setTreatmentLogs((current) => [{ ...treatment, id: crypto.randomUUID(), uid: session.uid, loginId: session.loginId, name: session.name }, ...current].slice(0, 100));
    return treatment;
  }, [firebaseMode, session, treatmentSettings.rates]);

  const refreshFulfillment = useCallback(async () => {
    if (!firebaseMode || !session) return;
    if (session.role === "owner") {
      const result = await apiRequest<{ winnings: CustomerWinning[]; addresses: Record<string, ShippingAddress> }>("/api/admin/fulfillment");
      setWinnings(result.winnings);
      setShippingAddresses(result.addresses);
      return;
    }
    const result = await apiRequest<{ winnings: CustomerWinning[]; address: ShippingAddress }>("/api/member/fulfillment");
    setWinnings(result.winnings);
    setShippingAddresses((current) => ({ ...current, [session.uid]: result.address }));
  }, [firebaseMode, session]);

  const saveShippingAddress = useCallback(async (input: Omit<ShippingAddress, "updatedAt">) => {
    if (!session || session.role !== "patient") throw new Error("고객 계정으로 로그인해 주세요.");
    if (!input.recipient.trim() || !input.phone.trim() || !input.postalCode.trim() || !input.address1.trim()) throw new Error("필수 배송지 정보를 입력해 주세요.");
    const address = firebaseMode
      ? (await apiRequest<{ address: ShippingAddress }>("/api/member/fulfillment", { method: "PATCH", body: JSON.stringify(input) })).address
      : { ...input, updatedAt: new Date().toISOString() };
    setShippingAddresses((current) => ({ ...current, [session.uid]: address }));
    toast.success("배송지를 안전하게 저장했습니다.");
  }, [firebaseMode, session]);

  const updateShipment = useCallback(async (id: string, shippingStatus: ShippingStatus, carrier: string, trackingNumber: string) => {
    if (!session || session.role !== "owner") throw new Error("사장님 권한이 필요합니다.");
    let next: CustomerWinning;
    if (firebaseMode) {
      next = (await apiRequest<{ winning: CustomerWinning }>("/api/admin/fulfillment", { method: "PATCH", body: JSON.stringify({ id, shippingStatus, carrier, trackingNumber }) })).winning;
    } else {
      const current = winnings.find((item) => item.id === id);
      if (!current) throw new Error("당첨 기록을 찾을 수 없습니다.");
      if (shippingStatus === "shipped" && (!carrier.trim() || !trackingNumber.trim())) throw new Error("택배사와 운송장 번호를 입력해 주세요.");
      next = { ...current, shippingStatus, carrier: carrier.trim() || undefined, trackingNumber: trackingNumber.trim() || undefined, shippedAt: shippingStatus === "shipped" || shippingStatus === "delivered" ? current.shippedAt || new Date().toISOString() : undefined };
    }
    setWinnings((current) => current.map((item) => item.id === id ? next : item));
    toast.success("배송 상태를 반영했습니다.");
  }, [firebaseMode, session, winnings]);

  const value = useMemo<HospitalContextValue>(() => ({ session, ready, firebaseMode, board, boards, boardConnection, boardError, boardVisible, members, treatmentSettings, treatmentLogs, winnings, shippingAddresses, login, signup, logout, refreshMembers, changeMemberStatus, changePoints, setBoardVisible, selectBoard, refreshTreatmentAdmin, saveTreatmentSettings, runTreatment, refreshFulfillment, saveShippingAddress, updateShipment }), [session, ready, firebaseMode, board, boards, boardConnection, boardError, boardVisible, members, treatmentSettings, treatmentLogs, winnings, shippingAddresses, login, signup, logout, refreshMembers, changeMemberStatus, changePoints, setBoardVisible, selectBoard, refreshTreatmentAdmin, saveTreatmentSettings, runTreatment, refreshFulfillment, saveShippingAddress, updateShipment]);
  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
}

export function useHospital() {
  const value = useContext(HospitalContext);
  if (!value) throw new Error("useHospital must be used inside HospitalProvider");
  return value;
}
