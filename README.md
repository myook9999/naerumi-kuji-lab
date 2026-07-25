# 내루미의 쿠지연구소

다지점 쿠지 운영 흐름을 보여주기 위한 Next.js 16 데모입니다. 관리자 대시보드, 정산, 쿠지판, 당첨·배송, 회원, 포인트 강화, 지점·상품·리포트·알림·설정 화면과 고객용 지점 페이지를 포함합니다.

## 실행

```bash
corepack pnpm install
corepack pnpm dev
```

- 관리자: http://localhost:3000/login
- 고객 화면: http://localhost:3000/store/hongdae
- 관리자 계정: `admin@naerumi.test / demo1234`
- 지점 관리자: `manager@naerumi.test / demo1234`
- 회원: `member@naerumi.test / demo1234`

데모 변경 내용은 브라우저 `localStorage`에 저장됩니다. 설정의 “데모 초기화”로 최초 상태로 되돌릴 수 있습니다.

## 검증

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## 데모와 납품판의 경계

현재는 제안·시연용입니다. 화면상 등록·수정·정산·배송·강화 흐름은 동작하지만 영구 저장은 브라우저 기준이며 실제 결제, 택배사, Firebase 운영 프로젝트와 연결되지 않습니다. 납품 전 필수 작업은 [납품 전환 체크리스트](docs/PRODUCTION_CHECKLIST.md)를 확인하세요.

연동 API 예시는 `/api/integrations/health`, `/sync`, `/events`이며 POST 요청은 `timestamp.body`의 HMAC-SHA256 서명을 요구합니다. 데모 강화 API는 서버 확률, 중복 키, 일일 제한을 적용하지만 서버 재시작 시 메모리 상태가 초기화됩니다.
