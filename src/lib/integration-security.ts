import {createHmac,timingSafeEqual} from "node:crypto";
export const integrationSecret=()=>process.env.KUJI_INTEGRATION_SECRET||(process.env.NODE_ENV==="production"?"":"naerumi-demo-secret");
export function createIntegrationSignature(timestamp:string,body:string,secret=integrationSecret()){if(!secret)return "";return createHmac("sha256",secret).update(timestamp+"."+body).digest("hex")}
export function verifyIntegrationRequest(timestamp:string|null,signature:string|null,body:string,now=Date.now()){
 const secret=integrationSecret();if(!secret||!timestamp||!signature)return {ok:false,error:"연동 인증 정보가 없습니다."};
 const time=Number(timestamp);if(!Number.isFinite(time)||Math.abs(now-time)>5*60_000)return {ok:false,error:"요청 시간이 허용 범위를 벗어났습니다."};
 const expected=createIntegrationSignature(timestamp,body,secret),a=Buffer.from(signature),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return {ok:false,error:"연동 서명이 올바르지 않습니다."};return {ok:true};
}
