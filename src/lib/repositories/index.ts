import { boards, members, stores, winners } from "@/lib/mock/data";
import type { KujiBoard, Member, Store, Winner } from "@/types";
export interface LabRepository { getStores():Promise<Store[]>; getBoards(storeId?:string):Promise<KujiBoard[]>; getMembers(storeId?:string):Promise<Member[]>; getWinners(storeId?:string):Promise<Winner[]>; subscribe?(topic:string,listener:()=>void):()=>void }
class MockRepository implements LabRepository { async getStores(){return structuredClone(stores)} async getBoards(storeId?:string){return structuredClone(storeId?boards.filter(x=>x.storeId===storeId):boards)} async getMembers(storeId?:string){return structuredClone(storeId?members.filter(x=>x.storeId===storeId):members)} async getWinners(storeId?:string){return structuredClone(storeId?winners.filter(x=>x.storeId===storeId):winners)} subscribe(_topic:string,listener:()=>void){const timer=setInterval(listener,15000);return()=>clearInterval(timer)} }
class FirebaseRepository implements LabRepository {
  async getStores():Promise<Store[]>{throw new Error("Firebase 환경 변수가 설정되지 않았습니다.")}
  async getBoards():Promise<KujiBoard[]>{throw new Error("Firebase 환경 변수가 설정되지 않았습니다.")}
  async getMembers():Promise<Member[]>{throw new Error("Firebase 환경 변수가 설정되지 않았습니다.")}
  async getWinners():Promise<Winner[]>{throw new Error("Firebase 환경 변수가 설정되지 않았습니다.")}
}
export const repository:LabRepository=process.env.NEXT_PUBLIC_DATA_MODE==="firebase"?new FirebaseRepository():new MockRepository();
