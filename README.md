# 쿠지병동 전용 사이트

쿠지병동 한 지점만을 위한 Next.js 16 고객·관리자 사이트입니다. 공식 쿠지병동 로고와 코랄/크림/브라운 색상을 사용합니다.

## 현재 제공 화면

- 고객: 닉네임·아이디·비밀번호 가입 신청, 승인 대기, 실시간 쿠지판, 보유 포인트, 단계별 포인트 치료
- 사장님: 병동 대시보드, 가입 승인/거절, 포인트 지급/차감, 치료 현황, 쿠지판 모니터와 고객 화면 공개/숨김
- 단일 지점: 지점 선택, 홍대지점, 분점 관리 기능 없음

## 안전한 시연 실행

```bash
corepack pnpm install
corepack pnpm dev
```

- 사이트: http://localhost:3000
- 사장님: `owner / demo1234`
- 승인 환자: `patient / demo1234`
- 승인 대기: `pending / demo1234`

기본값은 `NEXT_PUBLIC_DATA_MODE=mock`이므로 Firebase에 접속하거나 데이터를 변경하지 않습니다.

## 검증

```bash
corepack pnpm verify
```

실 Firebase 연결 전에는 [쿠지병동 Firebase 연결 안전 지침](docs/KUJI_HOSPITAL_FIREBASE_SAFETY.md)을 반드시 확인하세요. 규칙 파일은 검토용 조각이며 자동 배포되지 않습니다.