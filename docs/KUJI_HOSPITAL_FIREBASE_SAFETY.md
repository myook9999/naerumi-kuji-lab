# 쿠지병동 Firebase 연결 안전 지침

## 고정 안전 경계

- 실시간 공개 스냅샷 읽기 경로는 `web/kuji-byeongdong/publicBoards` 하나뿐입니다.
- 웹사이트 코드는 `ownerApi`를 호출하지 않습니다.
- `serverData/**`, 다른 지점의 `branches/**`, 쿠지병동 원본 `ownerData`를 읽거나 쓰지 않습니다.
- 회원, 승인, 포인트, 강화 확률·공지·로그, 사이트 공개 설정은 `web/kuji-byeongdong/**`에만 저장합니다.
- 원본 쿠지판은 웹사이트에서 항상 읽기 전용입니다.

## 부하 방지

브라우저당 실시간 리스너는 전체판 공개 스냅샷 경로 한 개만 유지합니다. 회원이 로그아웃하거나 화면이 해제되면 리스너도 즉시 해제됩니다. 판 클릭은 이미 수신한 데이터만 전환하므로 추가 조회가 없습니다. 프로그램은 변경을 5초 동안 모으고 같은 내용은 건너뛰며, 실패 시 쿠지 운영과 분리해 30초 뒤 한 번 다시 시도합니다. 전용 함수는 256MiB, 최대 인스턴스 2개로 제한됩니다.

## 2026-07-25 연결 점검 결과

- 실제 원본은 보호된 `serverData/branches/kuji-byeongdong/ownerData`에 있으며 기존 프로그램은 ownerApi로 접근합니다.
- 공용 `ownerApi`는 수정하거나 재배포하지 않았고 사이트에서도 호출하지 않습니다.
- 별도 `kujiByeongdongPublicApi` 함수만 배포했으며 유효한 쿠지병동 프로그램 세션만 발행할 수 있습니다.
- 인증 없는 공개판 GET은 401, Firebase 익명 인증 후 전체 10개 판 GET은 200으로 확인했습니다.
- 초기 전체판 스냅샷은 `web/kuji-byeongdong/publicBoards`에만 기록했습니다. 원본과 다른 지점 경로는 변경하지 않았습니다.
- 프로그램 1.0.6 발행 결과는 10개 판·고객 집계 31명 기준 약 17KB이며, 계정·주소·대기열·당첨번호·원본 이력 필드가 포함되지 않음을 검사했습니다.
- 1.0.6 설치 파일은 빌드 완료됐으며 공용 Hosting의 쿠지병동 릴리스 폴더 배포만 별도 승인 후 진행합니다.

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
7. 현재 시연 회원을 유지하면서 공개판만 실시간으로 사용할 때는 `NEXT_PUBLIC_DATA_MODE=mock`, `NEXT_PUBLIC_BOARD_MODE=firebase`를 사용합니다. 회원·배송까지 운영 Firebase로 전환할 때만 `NEXT_PUBLIC_DATA_MODE=firebase`로 바꿉니다.

## 회원 보안

고객이 정한 비밀번호는 Firebase Authentication에만 들어가며 Realtime Database나 관리자 화면에 저장되지 않습니다. 닉네임과 로그인 아이디만 가입 신청 정보로 저장됩니다. 승인·포인트·치료 API는 매 요청마다 Firebase ID 토큰과 역할을 다시 검사합니다.

## 규칙 배포 주의

이 저장소의 규칙 파일은 기존 공용 프로젝트에 병합하기 위한 검토용 조각입니다. 실제 배포는 공용 규칙 전체를 백업·검토한 뒤 `web/kuji-byeongdong` 블록만 병합해야 합니다. 2026-07-25 배포에서는 기존 규칙을 유지하고 공개판 인증 읽기, 직접 쓰기 차단, 사이트 전용 인덱스만 추가했습니다.
## 포인트 상점 격리 원칙

- 포인트 상점은 웹사이트 전용 기능이며 쿠지 프로그램 코드, 설치 파일, 자동 업데이트, 서버 함수에 변경을 요구하지 않습니다.
- `ownerApi`, `serverData/**`, 원본 `ownerData`, `publicBoards` 읽기·쓰기 및 상위 `web/kuji-byeongdong` 트랜잭션을 사용하지 않습니다.
- 기본 `mock` 모드에서는 상품·구매 내역이 브라우저 localStorage에만 저장되어 Firebase나 외부 서버에 요청하지 않습니다.
- 운영 모드를 별도 승인할 경우에도 웹사이트 전용 `storeProducts`, `storePurchases`, `members/{uid}` 하위 경로만 서버 API에서 사용합니다.
- 상품 재고 예약과 고객 포인트 차감은 각각 해당 사이트 전용 하위 노드에서만 처리하며 공개 쿠지판 발행과 경합하지 않습니다.
- 이 기능 때문에 공용 Firebase 규칙 조각을 변경하거나 배포하지 않습니다. 실제 운영 연결·배포는 별도 승인과 백업 후 진행합니다.
