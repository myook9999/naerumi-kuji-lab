"use client";

import { ImageOff, Ticket } from "lucide-react";
import type { PublicBoardSnapshot } from "@/types/hospital";
import { Badge } from "@/components/ui";

function SafePrizeImage({ src, alt, compact = false }: { src?: string; alt: string; compact?: boolean }) {
  if (!src) return <span className={`safe-prize-image empty ${compact ? "compact" : ""}`}><ImageOff/></span>;
  return <span className={`safe-prize-image ${compact ? "compact" : ""}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.parentElement?.classList.add("failed"); }}/>
    <span className="image-fallback"><Ticket/></span>
  </span>;
}

export function BoardImageGallery({ boards, selectedId, onSelect, title = "쿠지판 이미지 현황" }: { boards: PublicBoardSnapshot[]; selectedId?: string; onSelect?: (id: string) => void; title?: string }) {
  return <div className="board-image-gallery-wrap"><div className="board-image-gallery-title"><div><h2>{title}</h2><p>프로그램에 등록된 상품 이미지 링크를 원본 서버에서 직접 불러옵니다.</p></div><Badge tone="green">지연 로딩</Badge></div>
    <div className="board-image-gallery">{boards.map((board, index) => {
      const images = [...board.prizes.map((prize) => ({ src: prize.image, alt: prize.name })), ...(board.lastOne?.image ? [{ src: board.lastOne.image, alt: board.lastOne.name }] : [])].filter((item) => item.src);
      return <button type="button" key={board.id || `${board.boardName}-${index}`} className={board.id === selectedId ? "active" : ""} onClick={() => onSelect?.(board.id || "")}><SafePrizeImage src={images[0]?.src} alt={images[0]?.alt || board.boardName}/><span className="gallery-board-info"><span><b>#{index + 1} {board.boardName}</b>{board.isProgramCurrent && <Badge tone="red">현재 판</Badge>}</span><small>{board.remainingCards.toLocaleString()}장 남음 · 이미지 {images.length}개</small></span><span className="gallery-thumbs">{images.slice(1, 5).map((image, imageIndex) => <SafePrizeImage compact key={`${image.src}-${imageIndex}`} src={image.src} alt={image.alt}/>)}</span></button>;
    })}</div></div>;
}

export { SafePrizeImage };
