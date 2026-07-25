# 쿠지병동 전용 사이트

쿠지병동 한 지점만을 위한 Next.js 16 고객·관리자 사이트입니다. 공식 쿠지병동 로고와 코랄/크림/브라운 색상을 사용합니다.

## 현재 제공 화면

- 고객: 닉네임·아이디·비밀번호 가입 신청, 승인 대기, 실시간 쿠지판, 보유 포인트, 0~15강 포인트 강화 치료, 확률 변경 공시
- 사장님: 병동 대시보드, 가입 승인/거절, 포인트 지급/차감, 단계별 성공·파괴 확률 설정, 최근 100건 강화 로그, 매출·예상 정산, 쿠지판 모니터
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

기본 회원·배송 시연은 `NEXT_PUBLIC_DATA_MODE=mock`을 사용합니다. `NEXT_PUBLIC_BOARD_MODE=firebase`를 함께 설정하면 회원 시연 데이터는 유지하면서 쿠지병동 프로그램이 발행한 공개 쿠지판만 Firebase 리스너 1개로 실시간 구독합니다.

프로그램 1.0.6 이상은 변경 내용을 5초간 모은 뒤 `web/kuji-byeongdong/publicBoards`에 정제된 전체판 스냅샷을 발행합니다. 원본·ownerApi·다른 지점 경로는 사이트에서 조회하지 않습니다.

## 검증

```bash
corepack pnpm verify
```

실 Firebase 연결 전에는 [쿠지병동 Firebase 연결 안전 지침](docs/KUJI_HOSPITAL_FIREBASE_SAFETY.md)을 반드시 확인하세요. 규칙 파일은 검토용 조각이며 자동 배포되지 않습니다.
