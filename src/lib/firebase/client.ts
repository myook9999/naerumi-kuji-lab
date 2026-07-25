"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, onValue, ref, type Database } from "firebase/database";
import { firebasePaths } from "./paths";
import { sanitizeBoardSnapshot } from "./sanitize-board";
import type { PublicBoardSnapshot } from "@/types/hospital";

interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  database: Database;
}

let client: FirebaseClient | null | undefined;

export function isFirebaseMode() {
  return process.env.NEXT_PUBLIC_DATA_MODE === "firebase";
}

export function getFirebaseClient(): FirebaseClient | null {
  if (client !== undefined) return client;
  if (!isFirebaseMode()) return client = null;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (Object.values(config).some((value) => !value)) return client = null;

  const app = getApps().length ? getApp() : initializeApp(config);
  return client = { app, auth: getAuth(app), database: getDatabase(app) };
}

export function subscribeHospitalBoard(
  onData: (board: PublicBoardSnapshot) => void,
  onError: (message: string) => void,
) {
  const firebase = getFirebaseClient();
  if (!firebase) return () => undefined;

  // 안전 경계: ownerApi나 serverData를 사용하지 않고 이 고정 경로 한 곳만 구독한다.
  const boardRef = ref(firebase.database, firebasePaths.boardSnapshot);
  return onValue(
    boardRef,
    (snapshot) => onData(sanitizeBoardSnapshot(snapshot.val())),
    () => onError("쿠지판 실시간 정보를 불러올 권한을 확인해 주세요."),
  );
}
