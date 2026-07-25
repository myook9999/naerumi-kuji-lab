"use client";
import { ReactNode } from "react";
import { LucideIcon, RefreshCw } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
export function PageHeader({title,description,actions}:{title:string;description:string;actions?:ReactNode}){return <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div><div className="header-actions">{actions}</div></div>}
export function KpiCard({label,value,note,icon:Icon,tone="purple"}:{label:string;value:string;note:string;icon:LucideIcon;tone?:string}){return <Card className="kpi-card"><div className={cn("kpi-icon",tone)}><Icon size={20}/></div><div><span>{label}</span><strong className="tabular">{value}</strong><small>{note}</small></div></Card>}
export function SectionTitle({title,sub,action}:{title:string;sub?:string;action?:ReactNode}){return <div className="section-title"><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>{action}</div>}
export function LoadingButton({onClick}:{onClick?:()=>void}){return <Button variant="ghost" onClick={onClick}><RefreshCw size={15}/> 새로고침</Button>}
