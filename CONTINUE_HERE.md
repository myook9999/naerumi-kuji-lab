# 작업 체크포인트 — 2026-07-21

## 2026-07-22 시연판 완료

- 기존 TypeScript 오류와 깨진 공통 한글 문자열 수정
- 관리자 메뉴 11개 전체 라우트 및 화면 완성
- 로그인, 회원가입, 비밀번호 재설정과 고객용 `/store/[storeSlug]` 화면 추가
- 서버 강화 API와 HMAC 기반 쿠지 연동 예시 API 추가
- 데스크톱·태블릿·390px 모바일 반응형 디자인 적용
- 시연판/납품판 경계를 README와 `docs/PRODUCTION_CHECKLIST.md`에 명시
- 검증 완료: lint, typecheck, 단위 테스트 6개, Next.js production build, Chromium E2E 2개
- 화면 캡처: `artifacts/screenshots/admin-dashboard-1440.png`, `store-mobile-390.png`

현재 버전은 시연용이다. 브라우저 상태 저장과 목업 데이터를 사용하며 실제 납품 전에는 Firebase/Auth/결제/배송/영구 감사 로그를 운영 환경에 연결해야 한다.

오늘의 상세 작업 기록은 `WORK_LOG_2026-07-22.md`에 정리되어 있다.

사이트 판매 및 Firebase 연동 운영 계획은 `SITE_BUSINESS_AND_FIREBASE_PLAN.md`에 정리되어 있다.

## 프로젝트 위치

`D:\codexstudy\naerumi-kuji-lab`

다음 작업은 반드시 이 폴더에서 이어서 진행한다. 현재 프로젝트는 Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, pnpm 기반이다.

## 오늘 완료한 작업

- 새 Next.js 프로젝트 생성 및 전체 패키지 설치
- 공식 브랜드 상수와 에셋 경로 중앙화
- 참고 시안 8장을 `references/input`에 비공개 보관
- 자체 제작 내루미 마스코트/강화실 배너 생성
  - `public/assets/naerumi/naerumi-main.png`
  - `public/assets/banners/enhancement-lab-banner.png`
- 데이터 타입과 고정 시드 mock 데이터 구현
  - 8개 지점
  - 10개 쿠지판
  - 36명 회원
  - 56건 당첨 기록
  - 정산, 알림, 강화 기록, 매출 시계열
- localStorage 영속화, 데모 인증, 지점 전환, 정산 확정, 배송 수정, 쿠지 등록, 강화/보상 상태를 포함한 전역 Provider 구현
- 반응형 관리자 사이드바와 헤더 구현
- 고밀도 연구소 대시보드 구현
- 오늘의 정산 화면 구현
  - 정산 확정 모달
  - 중복 확정 방지
  - 메모와 태그
  - CSV 다운로드
  - 차트와 결제 수단 분포
- 쿠지판 관찰실 구현
  - 상태 탭, 검색, 정렬 UI, 카드/목록 전환
  - 상세 패널, 등급별 재고
  - 새 쿠지판 등록 모달
  - CSV 다운로드
- Windows에서 한글이 손상되지 않도록 이후 파일은 UTF-8 Base64 방식으로 기록 중
- JSX 구문 오류 1건 수정

## 핵심 파일

- `src/config/brand.ts`
- `src/types/index.ts`
- `src/lib/mock/data.ts`
- `src/lib/business.ts`
- `src/lib/repositories/index.ts`
- `src/components/providers.tsx`
- `src/components/admin-shell.tsx`
- `src/components/charts.tsx`
- `src/components/admin/common.tsx`
- `src/components/admin/dashboard.tsx`
- `src/components/admin/settlements.tsx`
- `src/components/admin/boards.tsx`

## 현재 검증 상태

`corepack pnpm install`은 성공했다.

`corepack pnpm typecheck`는 현재 아래 수정 가능한 오류 때문에 실패한다.

1. `downloadCsv` 타입이 2차원 배열만 받도록 되어 있어 객체 배열을 받도록 제네릭으로 수정 필요
2. Badge tone의 `orange`를 `amber`로 교체
3. repository에서 `Member.storeIds`를 `Member.storeId`로 교체
4. FirebaseRepository 임시 메서드에 명시적인 반환 타입과 throw를 추가

아직 lint/test/build/E2E는 실행 전이다. 현재는 구현 중 체크포인트이며 완료본이 아니다.

## 내일 바로 할 순서

1. 위 TypeScript 오류 4종 수정
2. 관리자 화면 완성
   - 상위상 기록실과 우측 상세 drawer
   - 회원·배송 관리
   - 포인트 강화실
   - 지점 연구소 관리
   - 상품·쿠지 관리
   - 리포트
   - 알림·메시지
   - 설정
3. 관리자 라우트와 공통 레이아웃 연결
4. 로그인/회원가입/비밀번호 찾기 구현
5. 고객용 `/store/[storeSlug]` 전체 경로 구현
6. 강화 서버 API 구현
   - 서버 확률 결정
   - idempotency
   - rate limit
   - 포인트 차감 및 결과 반환
7. 쿠지 프로그램 연동 API 구현
   - HMAC
   - timestamp
   - Zod
   - 중복 이벤트 방지
   - health/sync/events
8. Firebase 클라이언트/Admin 구조, rules, indexes 작성
9. README, env 예제, 데이터 모델/권한/API 문서 작성
10. unit/component/Playwright 테스트 작성
11. lint, typecheck, test, build 순서로 오류 수정
12. 데스크톱 1440px와 모바일 390px 스크린샷 생성 및 시각 검수
13. 최종 금지 문자열 전체 검색 후 제거

## 실행 명령

```powershell
cd D:\codexstudy\naerumi-kuji-lab
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

개발 서버 기본 주소: `http://localhost:3000`

## 데모 계정 예정값

- 슈퍼 관리자: `admin@naerumi.test` / `demo1234`
- 지점 관리자: `manager@naerumi.test` / `demo1234`
- 회원: `member@naerumi.test` / `demo1234`

현재 Provider는 비밀번호 `demo1234`와 이메일 접두사로 역할을 판별한다.

## 주의사항

- 이 프로젝트의 모든 한글 소스 파일은 UTF-8로 유지한다.
- D 드라이브 참고 이미지는 원본이며 수정하지 않는다.
- `references/input` 이미지는 디자인 참고용이며 public에 노출하지 않는다.
- 유명 IP 이미지는 사용하지 않는다.
- 생성된 내루미 이미지는 원본 자체 제작 에셋으로 계속 사용한다.
- 기존 작업 파일을 삭제하거나 프로젝트를 다시 생성하지 말고 현재 상태에서 이어간다.
