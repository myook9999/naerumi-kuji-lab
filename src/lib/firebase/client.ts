"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, onValue, ref, type Database } from "firebase/database";
import { firebasePaths } from "./paths";
import { sanitizeBoardCollection } from "./sanitize-board";
import type { PublicBoardCollectionPreview } from "@/types/hospital";

interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  database: Database;
}

let client: FirebaseClient | null | undefined;

export function isFirebaseMode() {
  return process.env.NEXT_PUBLIC_DATA_MODE === "firebase";
}

export function isLiveBoardMode() {
  return process.env.NEXT_PUBLIC_BOARD_MODE === "firebase" || isFirebaseMode();
}

export function getFirebaseClient(): FirebaseClient | null {
  if (client !== undefined) return client;
  if (!isLiveBoardMode()) return client = null;

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

export function subscribeHospitalBoards(
  onData: (boards: PublicBoardCollectionPreview) => void,
  onError: (message: string) => void,
) {
  const firebase = getFirebaseClient();
  if (!firebase) return () => undefined;

  // 안전 경계: ownerApi나 serverData를 사용하지 않고 이 고정 경로 한 곳만 구독한다.
  const boardRef = ref(firebase.database, firebasePaths.boardSnapshot);
  return onValue(
    boardRef,
    (snapshot) => {
      const collection = sanitizeBoardCollection(snapshot.val());
      if (!collection.boards.length) return onError("아직 프로그램에서 발행된 쿠지판이 없습니다.");
      onData(collection);
    },
    () => onError("쿠지판 실시간 정보를 불러올 권한을 확인해 주세요."),
  );
}
