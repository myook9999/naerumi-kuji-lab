import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs:ClassValue[]) => twMerge(clsx(inputs));
export const won = (value:number) => new Intl.NumberFormat("ko-KR").format(value) + "원";
export const number = (value:number) => new Intl.NumberFormat("ko-KR").format(value);
export const percent = (value:number) => Math.max(0, Math.min(100, Math.round(value)));
export const maskNickname = (value:string) => value.length < 3 ? value[0] + "*" : value[0] + "*".repeat(value.length-2) + value.at(-1);
export const downloadCsv = (name:string, rows:object[]|(string|number)[][]) => {
  const matrix:(string|number)[][] = rows.length > 0 && !Array.isArray(rows[0])
    ? [Object.keys(rows[0]), ...rows.map(row => Object.values(row))].map(row => row.map(value => typeof value === "number" ? value : String(value ?? "")))
    : rows as (string|number)[][];
  const csv = "\uFEFF" + matrix.map(row => row.map(cell => '"' + String(cell).replaceAll('"','""') + '"').join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a = document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
};
