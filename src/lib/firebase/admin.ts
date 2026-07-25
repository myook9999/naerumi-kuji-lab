import "server-only";

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { adminPath, memberPath } from "./paths";
import type { HospitalMember, HospitalSession } from "@/types/hospital";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const credential = projectId && clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();

  return initializeApp({
    credential,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

export function adminServices() {
  const app = getAdminApp();
  return { auth: getAuth(app), database: getDatabase(app) };
}

export async function requireFirebaseUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new Error("UNAUTHORIZED");
  return adminServices().auth.verifyIdToken(token, true);
}

export async function requireHospitalOwner(request: Request) {
  const decoded = await requireFirebaseUser(request);
  const snapshot = await adminServices().database.ref(adminPath(decoded.uid)).get();
  if (snapshot.child("active").val() !== true) throw new Error("FORBIDDEN");
  return decoded;
}

export function safeMember(uid: string, raw: unknown): HospitalMember {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const status = ["pending", "approved", "rejected"].includes(String(value.status))
    ? String(value.status) as HospitalMember["status"]
    : "pending";
  return {
    uid,
    loginId: String(value.loginId || String(value.email || "").split("@")[0]),
    email: String(value.email || ""),
    name: String(value.name || "이름 미등록").slice(0, 40),
    phone: String(value.phone || "").slice(0, 30),
    role: "patient",
    status,
    points: Math.max(0, Number(value.points) || 0),
    treatmentStage: Math.min(5, Math.max(0, Number(value.treatmentStage) || 0)),
    createdAt: String(value.createdAt || ""),
    approvedAt: value.approvedAt ? String(value.approvedAt) : undefined,
    lastTreatmentAt: value.lastTreatmentAt ? String(value.lastTreatmentAt) : undefined,
  };
}

export async function getHospitalSession(uid: string, email = ""): Promise<HospitalSession | null> {
  const { database } = adminServices();
  const [adminSnapshot, memberSnapshot] = await Promise.all([
    database.ref(adminPath(uid)).get(),
    database.ref(memberPath(uid)).get(),
  ]);
  if (adminSnapshot.child("active").val() === true) {
    return {
      uid,
      loginId: String(adminSnapshot.child("loginId").val() || email.split("@")[0] || "owner"),
      email,
      name: String(adminSnapshot.child("name").val() || "쿠지병동 사장님"),
      phone: "",
      role: "owner",
      status: "approved",
      points: 0,
      treatmentStage: 0,
    };
  }
  return memberSnapshot.exists() ? safeMember(uid, memberSnapshot.val()) : null;
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "UNAUTHORIZED") return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "쿠지병동 사장님 권한이 필요합니다." }, { status: 403 });
  console.error("[kuji-hospital-api]", message);
  return Response.json({ error: "요청을 안전하게 처리하지 못했습니다." }, { status: 500 });
}
