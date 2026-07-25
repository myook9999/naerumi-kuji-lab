"use client";
import {Download,Search,Truck} from "lucide-react";
import {useMemo,useState} from "react";
import {Badge,Button,Card,Modal} from "@/components/ui";
import {PageHeader,SectionTitle} from "./common";
import {useLab} from "@/components/providers";
import {downloadCsv} from "@/lib/utils";
import type {ShipmentStatus,Winner} from "@/types";
const statuses:ShipmentStatus[]=["배송 대기","배송 준비","배송 중","배송 완료","인증 완료"];
const tone=(s:ShipmentStatus)=>s==="배송 완료"||s==="인증 완료"?"green":s==="배송 중"?"blue":"amber";
export function Winners(){
 const lab=useLab(),[query,setQuery]=useState(""),[status,setStatus]=useState("전체"),[selected,setSelected]=useState<Winner|null>(null),[tracking,setTracking]=useState("");
 const rows=useMemo(()=>lab.winners.filter(w=>w.storeId===lab.selectedStoreId&&(status==="전체"||w.shipmentStatus===status)&&[w.nickname,w.boardTitle,w.prizeName].some(x=>x.toLowerCase().includes(query.toLowerCase()))),[lab.winners,lab.selectedStoreId,status,query]);
 const save=(next:ShipmentStatus)=>{if(!selected)return;lab.updateShipment(selected.id,next,tracking);setSelected(null)};
 return <><PageHeader title="상위상 기록실" description="상위상 당첨과 배송 처리 상태를 한곳에서 관리합니다." actions={<Button variant="ghost" onClick={()=>downloadCsv("winner-records.csv",rows)}><Download size={16}/>기록 다운로드</Button>}/>
 <div className="kpi-strip">{statuses.slice(0,4).map(s=><div key={s}><span>{s}</span><b>{rows.filter(w=>w.shipmentStatus===s).length}건</b></div>)}</div>
 <Card><SectionTitle title="당첨 기록" sub={"검색 결과 "+rows.length+"건"}/><div className="toolbar"><label className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="닉네임·상품·쿠지판 검색"/></label><select value={status} onChange={e=>setStatus(e.target.value)}><option>전체</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
 <div className="table-wrap"><table><thead><tr><th>당첨 일시</th><th>회원</th><th>쿠지판 / 상품</th><th>등급</th><th>구분</th><th>배송 상태</th><th/></tr></thead><tbody>{rows.map(w=><tr key={w.id}><td>{w.wonAt}</td><td><b>{w.nickname}</b><small>{w.phone}</small></td><td><b>{w.boardTitle}</b><small>{w.prizeName}</small></td><td><Badge>{w.tier}</Badge></td><td>{w.entryType}</td><td><Badge tone={tone(w.shipmentStatus)}>{w.shipmentStatus}</Badge></td><td><Button variant="ghost" onClick={()=>{setSelected(w);setTracking(w.trackingNumber||"")}}><Truck size={14}/>처리</Button></td></tr>)}</tbody></table></div></Card>
 <Modal open={!!selected} onClose={()=>setSelected(null)} title="배송 정보 처리"><div className="detail-panel"><b>{selected?.nickname}</b><p>{selected?.prizeName}</p><p>{selected?.address}</p><label>송장 번호<input value={tracking} onChange={e=>setTracking(e.target.value)} placeholder="송장 번호 입력"/></label><div className="status-actions">{statuses.map(s=><Button key={s} variant={selected?.shipmentStatus===s?"primary":"ghost"} onClick={()=>save(s)}>{s}</Button>)}</div></div></Modal></>
}
