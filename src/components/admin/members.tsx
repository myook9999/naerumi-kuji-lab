"use client";
import {Download,Edit3,Search} from "lucide-react";
import {useMemo,useState} from "react";
import {Badge,Button,Card,Drawer} from "@/components/ui";
import {PageHeader,SectionTitle} from "./common";
import {useLab} from "@/components/providers";
import {downloadCsv,number} from "@/lib/utils";
import type {Member} from "@/types";
export function Members(){
 const lab=useLab(),[query,setQuery]=useState(""),[tier,setTier]=useState("전체"),[selected,setSelected]=useState<Member|null>(null);
 const rows=useMemo(()=>lab.members.filter(m=>m.storeId===lab.selectedStoreId&&(tier==="전체"||m.tier===tier)&&[m.nickname,m.email,m.phone].some(x=>x.toLowerCase().includes(query.toLowerCase()))),[lab.members,lab.selectedStoreId,tier,query]);
 const patch=(key:string,value:string)=>setSelected(m=>m?{...m,[key]:key==="points"?Number(value):value}:m);
 return <><PageHeader title="회원·배송 관리" description="회원 정보, 포인트, 기본 배송지를 안전하게 관리합니다." actions={<Button variant="ghost" onClick={()=>downloadCsv("members.csv",rows)}><Download size={16}/>회원 다운로드</Button>}/><Card><SectionTitle title="회원 목록" sub={"현재 지점 "+rows.length+"명"}/><div className="toolbar"><label className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="닉네임·이메일·전화번호 검색"/></label><select value={tier} onChange={e=>setTier(e.target.value)}><option>전체</option>{["일반","실버","골드","VIP"].map(x=><option key={x}>{x}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>회원</th><th>등급</th><th>가입일</th><th>참여</th><th>보유 포인트</th><th>배송지</th><th/></tr></thead><tbody>{rows.map(m=><tr key={m.id}><td><b>{m.nickname}</b><small>{m.email}<br/>{m.phone}</small></td><td><Badge tone={m.tier==="VIP"?"purple":"gray"}>{m.tier}</Badge></td><td>{m.joinedAt}</td><td>{m.participationCount}회</td><td><b>{number(m.points)}P</b></td><td>{m.address.address1}</td><td><Button variant="ghost" onClick={()=>setSelected(structuredClone(m))}><Edit3 size={14}/>수정</Button></td></tr>)}</tbody></table></div></Card>
 <Drawer open={!!selected} onClose={()=>setSelected(null)} title="회원 정보 수정">{selected&&<div className="drawer-form"><label>닉네임<input value={selected.nickname} onChange={e=>patch("nickname",e.target.value)}/></label><label>이메일<input value={selected.email} onChange={e=>patch("email",e.target.value)}/></label><label>전화번호<input value={selected.phone} onChange={e=>patch("phone",e.target.value)}/></label><label>등급<select value={selected.tier} onChange={e=>patch("tier",e.target.value)}>{["일반","실버","골드","VIP"].map(x=><option key={x}>{x}</option>)}</select></label><label>포인트<input type="number" value={selected.points} onChange={e=>patch("points",e.target.value)}/></label><div className="address-box"><b>기본 배송지</b><p>({selected.address.postalCode}) {selected.address.address1} {selected.address.address2}</p><small>{selected.address.memo}</small></div><Button onClick={()=>{lab.saveMember(selected);setSelected(null)}}>변경 사항 저장</Button></div>}</Drawer></>
}
