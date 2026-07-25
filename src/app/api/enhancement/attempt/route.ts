import {randomInt,randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {enhancementConfig} from "@/lib/mock/data";
import type {EnhancementAttempt} from "@/types";
const schema=z.object({idempotencyKey:z.string().min(8).max(100),userId:z.string().min(1),storeId:z.string().min(1),level:z.number().int().min(0).max(29),points:z.number().int().nonnegative()});
type State={points:number;level:number;streak:number;day:string;count:number};
const globalState=globalThis as typeof globalThis&{enhanceUsers?:Map<string,State>;enhanceKeys?:Map<string,unknown>};
const users=globalState.enhanceUsers??=new Map(),keys=globalState.enhanceKeys??=new Map();
export async function POST(request:Request){
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"올바른 JSON 요청이 아닙니다."},{status:400})}
 const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"강화 요청 값이 올바르지 않습니다.",details:parsed.error.flatten()},{status:400});
 const input=parsed.data;if(keys.has(input.idempotencyKey))return NextResponse.json(keys.get(input.idempotencyKey));
 const today=new Date().toISOString().slice(0,10),current=users.get(input.userId)??{points:input.points,level:input.level,streak:0,day:today,count:0};
 if(current.day!==today){current.day=today;current.count=0}if(current.count>=enhancementConfig.dailyLimit)return NextResponse.json({error:"오늘의 강화 가능 횟수를 모두 사용했습니다."},{status:429});
 const level=Math.min(current.level,input.level),config=enhancementConfig.levels[level];if(!config)return NextResponse.json({error:"최대 레벨에 도달했습니다."},{status:409});if(current.points<config.cost)return NextResponse.json({error:"포인트가 부족합니다."},{status:409});
 const success=randomInt(0,10000)<Math.round(config.probability*100),after=success?level+1:enhancementConfig.failureDrops?Math.max(0,level-1):level;
 current.points-=config.cost;current.level=after;current.streak=success?current.streak+1:0;current.count+=1;users.set(input.userId,current);
 const attempt:EnhancementAttempt={id:randomUUID(),userId:input.userId,storeId:input.storeId,levelBefore:level,levelAfter:after,cost:config.cost,probability:config.probability,result:success?"success":"failure",streak:current.streak,idempotencyKey:input.idempotencyKey,createdAt:new Intl.DateTimeFormat("ko-KR",{dateStyle:"short",timeStyle:"short",timeZone:"Asia/Seoul"}).format(new Date())};
 const result={success,points:current.points,levelAfter:after,streak:current.streak,remainingAttempts:enhancementConfig.dailyLimit-current.count,attempt};keys.set(input.idempotencyKey,result);return NextResponse.json(result);
}
