import {NextResponse} from "next/server";
import {integrationSecret} from "@/lib/integration-security";
export async function GET(){return NextResponse.json({ok:true,service:"naerumi-kuji-lab",version:"1.0.0",mode:process.env.NEXT_PUBLIC_DATA_MODE||"mock",signatureConfigured:Boolean(integrationSecret()),serverTime:new Date().toISOString()})}
