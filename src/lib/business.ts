import type { EnhancementConfig, PointTransaction, Role, SettlementItem } from "@/types";
export function calculateSettlement(items:SettlementItem[], feeRate=0.035, shippingFee=0){
  const grossSales=items.reduce((s,i)=>s+i.sales,0);
  const refunds=items.reduce((s,i)=>s+i.refund,0);
  const fee=Math.round((grossSales-refunds)*feeRate);
  return {grossSales,refunds,fee,shippingFee,netAmount:grossSales-refunds-fee+shippingFee};
}
export function calculatePointBalance(transactions:Pick<PointTransaction,"amount"|"type">[]){
  return transactions.reduce((sum,t)=>sum+(t.type==="spend"||t.type==="expire"?-Math.abs(t.amount):Math.abs(t.amount)),0);
}
export function validateEnhancementConfig(config:EnhancementConfig){
  if(config.maxLevel<1||config.maxLevel>100||config.dailyLimit<1||config.dailyLimit>100) return false;
  return config.levels.length===config.maxLevel && config.levels.every((x,i)=>x.level===i+1&&x.cost>0&&x.probability>=0&&x.probability<=100&&x.reward>=0);
}
export function canRedeemReward(level:number,rewardLevel:number,claimed:number[]){ return level>=rewardLevel&&!claimed.includes(rewardLevel); }
const rolePermissions:Record<Role,string[]>={super_admin:["*"],store_admin:["dashboard","settlements","boards","winners","members","enhancement","catalog","reports","notifications"],staff:["dashboard","boards","winners","members","notifications"],member:["store","profile","enhancement"]};
export function hasPermission(role:Role,permission:string){const list=rolePermissions[role];return list.includes("*")||list.includes(permission);}
export class IdempotencyRegistry { private keys=new Set<string>(); process<T>(key:string,work:()=>T){if(this.keys.has(key)) return {duplicate:true,value:null};this.keys.add(key);return {duplicate:false,value:work()};} }
