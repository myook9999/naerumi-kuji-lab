export type HospitalRole = "owner" | "patient";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface HospitalSession {
  uid: string;
  loginId: string;
  email: string;
  name: string;
  phone: string;
  role: HospitalRole;
  status: ApprovalStatus;
  points: number;
  treatmentStage: number;
}

export interface HospitalMember extends HospitalSession {
  createdAt: string;
  approvedAt?: string;
  lastTreatmentAt?: string;
}

export interface PublicPrize {
  id: string;
  name: string;
  image: string;
  available: boolean;
}

export interface PublicBoardSnapshot {
  branchId: "kuji-byeongdong";
  boardName: string;
  totalCards: number;
  openedCount: number;
  remainingCards: number;
  price: string;
  prizes: PublicPrize[];
  lastOne: PublicPrize | null;
  updatedAt: string;
}

export interface TreatmentResult {
  outcome: "success" | "failed" | "destroyed";
  success: boolean;
  destroyed: boolean;
  beforeStage: number;
  afterStage: number;
  cost: number;
  points: number;
  probability: number;
  destroyProbability: number;
  createdAt: string;
}

export interface TreatmentRate {
  stage: number;
  probability: number;
  destroyProbability: number;
}

export interface TreatmentSettings {
  rates: TreatmentRate[];
  notice: string;
  updatedAt: string;
}

export interface TreatmentLog extends TreatmentResult {
  id: string;
  uid: string;
  loginId: string;
  name: string;
}
