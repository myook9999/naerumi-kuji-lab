# 쿠지병동 Firebase 연결 안전 지침

## 고정 안전 경계

- 실시간 원본 읽기 경로는 `branches/kuji-byeongdong/boards/current` 하나뿐입니다.
- 웹사이트 코드는 `ownerApi`를 호출하지 않습니다.
- `serverData/**`, 다른 지점의 `branches/**`, 쿠지병동 원본 `ownerData`를 읽거나 쓰지 않습니다.
- 회원, 승인, 포인트, 치료, 사이트 공개 설정은 `web/kuji-byeongdong/**`에만 저장합니다.
- 원본 쿠지판은 웹사이트에서 항상 읽기 전용입니다.

## 부하 방지

브라우저당 실시간 리스너는 현재 쿠지판 스냅샷 한 개만 유지합니다. 회원이 로그아웃하거나 화면이 해제되면 리스너도 즉시 해제됩니다. 수신 데이터는 화면에서 필요한 쿠지판 이름, 전체/오픈 수량, 가격, 상품 상태, 갱신 시각만 정제해 사용합니다.

## 운영 전 순서

1. Firebase Authentication에서 Email/Password 로그인을 활성화합니다. 고객에게 이메일 입력을 받지는 않으며, 입력한 아이디를 내부 인증 주소로 변환합니다.
2. 쿠지병동 사장님 계정을 Firebase Authentication에 한 번 생성합니다.
3. RTDB `web/kuji-byeongdong/admins/{사장님 uid}`에 아래 값을 수동 등록합니다.

```json
{
  "active": true,
  "loginId": "owner",
  "name": "쿠지병동 사장님"
}
```

4. 기존 공용 규칙을 백업하고 `firebase/kuji-byeongdong.rules.fragment.json`의 규칙을 기존 구조에 병합합니다.
5. Firebase Emulator에서 승인 전/승인 후/사장님/다른 지점 접근을 테스트합니다.
6. 테스트 결과를 확인한 뒤에만 실제 규칙을 배포합니다.
7. 배포 환경 변수에 `.env.example`의 Firebase 값을 등록하고 `NEXT_PUBLIC_DATA_MODE=firebase`로 바꿉니다.

## 회원 보안

고객이 정한 비밀번호는 Firebase Authentication에만 들어가며 Realtime Database나 관리자 화면에 저장되지 않습니다. 닉네임과 로그인 아이디만 가입 신청 정보로 저장됩니다. 승인·포인트·치료 API는 매 요청마다 Firebase ID 토큰과 역할을 다시 검사합니다.

## 규칙 배포 주의

이 저장소의 규칙 파일은 기존 공용 프로젝트에 병합하기 위한 검토용 조각입니다. 단독 배포하면 기존 규칙이 사라질 수 있으므로 절대 바로 배포하지 않습니다. 이 프로젝트 작업에서는 실제 Firebase 규칙이나 원본 데이터를 변경하지 않습니다.