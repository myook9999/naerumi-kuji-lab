export type Role="super_admin"|"store_admin"|"staff"|"member";
export type ShipmentStatus="배송 대기"|"배송 준비"|"배송 중"|"배송 완료"|"인증 완료";
export type BoardStatus="진행 중"|"예정"|"종료";
export type StoreStatus="연동 정상"|"경고"|"연동 불가"|"비활성";
export interface Store{id:string;slug:string;name:string;shortName:string;region:string;status:StoreStatus;address:string;manager:string;phone:string;email:string;openedAt:string;todaySales:number;waitingShipments:number;lastSyncedAt:string}
export interface KujiBoard{id:string;storeId:string;title:string;code:string;category:string;status:BoardStatus;ticketPrice:number;totalTickets:number;remainingTickets:number;startAt:string;endAt:string;topRemaining:number;tiers:{name:string;initial:number;remaining:number}[]}
export interface Winner{id:string;storeId:string;userId:string;nickname:string;tier:string;boardTitle:string;prizeName:string;wonAt:string;entryType:string;shipmentStatus:ShipmentStatus;phone:string;address:string;trackingNumber?:string}
export interface Member{id:string;storeId:string;nickname:string;email:string;phone:string;tier:string;joinedAt:string;points:number;participationCount:number;address:{recipient:string;postalCode:string;address1:string;address2:string;memo:string}}
export interface SettlementItem{id:string;boardTitle:string;sold:number;sales:number;topPrizes:number;refund:number;amount:number;status:string}
export interface Settlement{id:string;storeId:string;date:string;totalSales:number;refund:number;fee:number;shipping:number;ticketCount:number;confirmed:boolean;memo:string;tags:string[];items:SettlementItem[]}
export interface Notification{id:string;title:string;message:string;createdAt:string;read:boolean;type:string}
export interface EnhancementAttempt{id:string;userId:string;storeId:string;levelBefore:number;levelAfter:number;cost:number;probability:number;result:"success"|"failure";streak:number;idempotencyKey:string;createdAt:string}
export interface EnhancementConfig{maxLevel:number;dailyLimit:number;failureDrops:boolean;levels:{level:number;cost:number;probability:number;reward:number}[]}
export interface PointTransaction{id:string;userId:string;storeId:string;type:string;amount:number;balanceAfter:number;reason:string;createdAt:string}
export interface IntegrationEvent{id:string;storeId:string;eventType:string;idempotencyKey:string;payload:unknown;status:string;createdAt:string}
