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
  remainingCount?: number;
}

export interface PublicSalesDailyBucket {
  date: string;
  ticketCount: number;
  grossSales: number;
}

export interface PublicSalesMonthlyBucket {
  month: string;
  ticketCount: number;
  grossSales: number;
}

export interface PublicSalesWeeklyBucket {
  weekStart: string;
  ticketCount: number;
  grossSales: number;
}

export interface PublicBoardSales {
  unitPrice: number;
  ticketCount: number;
  grossSales: number;
  trackedTickets: number;
  trackedGrossSales: number;
  unclassifiedTickets: number;
  daily: PublicSalesDailyBucket[];
  monthly: PublicSalesMonthlyBucket[];
}

export interface PublicBoardSnapshot {
  id?: string;
  sourceIndex?: number;
  isProgramCurrent?: boolean;
  branchId: "kuji-byeongdong";
  boardName: string;
  totalCards: number;
  openedCount: number;
  remainingCards: number;
  price: string;
  prizes: PublicPrize[];
  lastOne: PublicPrize | null;
  sales?: PublicBoardSales;
  customerResults?: BoardCustomerResult[];
  updatedAt: string;
}

export interface BoardCustomerResult {
  id: string;
  nickname: string;
  totalDraws: number;
  randomGoodsCount: number;
  upperPrizes: Array<{ name: string; count: number }>;
}

export interface PublicBoardCollectionPreview {
  sourceUpdatedAt: string;
  currentIndex: number;
  featuredIndex: number;
  boards: PublicBoardSnapshot[];
}

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  pricePoints: number;
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StoreProductDraft = Pick<StoreProduct, "name" | "description" | "imageUrl" | "pricePoints" | "stock" | "active"> & { id?: string };

export interface PointPurchase {
  id: string;
  requestId: string;
  uid: string;
  loginId: string;
  customerName: string;
  productId: string;
  productName: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  totalPoints: number;
  createdAt: string;
}
export type ShippingStatus = "address_required" | "preparing" | "shipped" | "delivered";

export interface ShippingAddress {
  recipient: string;
  phone: string;
  postalCode: string;
  address1: string;
  address2: string;
  memo: string;
  updatedAt: string;
}

export interface CustomerWinning {
  id: string;
  uid: string;
  loginId: string;
  name: string;
  boardName: string;
  prizeName: string;
  tier: string;
  wonAt: string;
  shippingStatus: ShippingStatus;
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: string;
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
