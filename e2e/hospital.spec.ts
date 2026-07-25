import { expect, test } from "@playwright/test";

test("첫 방문자는 쿠지병동 로그인과 회원가입 버튼을 본다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "쿠지병동 접수처 로그인" })).toBeVisible();
  await expect(page.getByRole("button", { name: "병동 입장하기" })).toBeVisible();
  await expect(page.getByRole("link", { name: /회원가입 신청/ })).toBeVisible();
  await expect(page.getByAltText("쿠지병동").first()).toBeVisible();
});

test("고객은 닉네임·아이디·비밀번호를 직접 정한다", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByLabel("사용할 닉네임")).toBeVisible();
  await expect(page.getByLabel("로그인 아이디")).toBeVisible();
  await expect(page.getByLabel("비밀번호", { exact: true })).toBeVisible();
  await expect(page.getByLabel("비밀번호 확인")).toBeVisible();
});

test("사장님과 승인 환자 화면이 분리된다", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("로그인 아이디").fill("owner");
  await page.getByLabel("비밀번호", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByRole("heading", { name: "쿠지병동 운영실" })).toBeVisible();
  await expect(page.getByText("환자 승인·포인트", { exact: true })).toBeVisible();
  await expect(page.getByText("홍대지점")).toHaveCount(0);

  await page.getByRole("button", { name: /쿠지병동 사장님/ }).click();
  await page.goto("/");
  await page.getByLabel("로그인 아이디").fill("patient");
  await page.getByLabel("비밀번호", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await expect(page).toHaveURL(/\/patient/);
  await expect(page.getByRole("heading", { name: /오늘의 쿠지 상태/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "실시간 쿠지 차트" })).toBeVisible();
});
test("신규 고객은 직접 정한 비밀번호로 승인 대기 로그인한다", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("사용할 닉네임").fill("테스트환자");
  await page.getByLabel("로그인 아이디").fill("newpatient");
  await page.getByLabel("비밀번호", { exact: true }).fill("myPassword123");
  await page.getByLabel("비밀번호 확인").fill("myPassword123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "가입 승인 요청하기" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("로그인 아이디").fill("newpatient");
  await page.getByLabel("비밀번호", { exact: true }).fill("myPassword123");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await expect(page.getByRole("heading", { name: "사장님이 접수 내용을 확인 중이에요" })).toBeVisible();
});

test("사장님은 실제 캐시 기반 매출·정산과 강화 확률·로그를 확인한다", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("로그인 아이디").fill("owner");
  await page.getByLabel("비밀번호", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await page.goto("/admin/settlements");
  await expect(page.getByRole("heading", { name: "매출·정산 확인" })).toBeVisible();
  await expect(page.getByText("612,000원", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("실제 캐시 미리보기 기준", { exact: true })).toBeVisible();
  await page.goto("/admin/treatment");
  await expect(page.getByRole("heading", { name: "단계별 강화 확률 설정" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "최근 강화 로그" })).toBeVisible();
  await expect(page.getByText("행운 환자", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("11강 성공", { exact: true })).toBeVisible();
});

test("사장님은 프로그램 전체 쿠지판 10개를 확인한다", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("로그인 아이디").fill("owner");
  await page.getByLabel("비밀번호", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await page.goto("/admin/kuji-boards");
  await expect(page.getByRole("heading", { name: "전체 쿠지판 현황" })).toBeVisible();
  await expect(page.locator(".all-board-grid > button")).toHaveCount(10);
  await expect(page.getByText("#2 1000장 2탄", { exact: true })).toBeVisible();
  await expect(page.getByText("#9 스텔스 바쿠고 한찾", { exact: true })).toBeVisible();
  await page.locator(".all-board-grid > button").nth(0).click();
  await expect(page.getByRole("heading", { name: "600장 고객별 뽑기 결과" })).toBeVisible();
  await expect(page.locator(".admin-board-results .board-result-list > article")).toHaveCount(7);
  await expect(page.getByText(/랜덤굿즈 \d+개/).first()).toBeVisible();
});

test("고객 배송지 저장과 사장님 발송 처리가 서로 반영된다", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("로그인 아이디").fill("patient");
  await page.getByLabel("비밀번호", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await expect(page.getByRole("heading", { name: "내 상위상·배송" })).toBeVisible();
  await expect(page.getByText("여성형 거인A상", { exact: true })).toBeVisible();
  await page.locator(".patient-all-boards > button").nth(1).click();
  await expect(page.getByRole("heading", { name: "1000장 2탄 고객별 뽑기 결과" })).toBeVisible();
  await expect(page.locator(".patient-board-results .board-result-list > article")).toHaveCount(7);
  await page.getByLabel("받는 분 *").fill("별밤 수령인");
  await page.getByLabel("연락처 *").fill("010-1111-2222");
  await page.getByLabel("우편번호 *").fill("06236");
  await page.getByLabel("기본 주소 *").fill("서울특별시 강남구 테헤란로 1");
  await page.getByLabel("상세 주소").fill("101호");
  await page.getByRole("button", { name: "배송지 저장" }).click();
  await page.getByRole("button", { name: "로그아웃" }).press("Enter");

  await page.getByLabel("로그인 아이디").fill("owner");
  await page.getByLabel("비밀번호", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await page.goto("/admin/fulfillment");
  await expect(page.getByRole("heading", { name: "상위상·배송 관리" })).toBeVisible();
  await expect(page.getByText("별밤 수령인 · 010-1111-2222", { exact: true }).first()).toBeVisible();
  const row = page.locator(".fulfillment-row").filter({ hasText: "여성형 거인A상" });
  await row.getByRole("combobox").selectOption("shipped");
  await row.getByPlaceholder("택배사").fill("우체국택배");
  await row.getByPlaceholder("운송장 번호").fill("987654321000");
  await row.getByRole("button", { name: "반영" }).click();
  await expect(row.getByRole("combobox")).toHaveValue("shipped");
});

test("강화 확률 변경 공지가 고객 화면에 표시된다", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("로그인 아이디").fill("owner");
  await page.getByLabel("비밀번호", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await page.goto("/admin/treatment");
  await page.getByLabel("7강 성공률").fill("59");
  await page.locator(".enhancement-notice-editor textarea").fill("7강 성공률을 59%로 변경했습니다.");
  await page.getByRole("button", { name: /확률 저장 및 고객 공시/ }).click();
  await page.getByRole("button", { name: /쿠지병동 사장님/ }).click();
  await page.goto("/");
  await page.getByLabel("로그인 아이디").fill("patient");
  await page.getByLabel("비밀번호", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await expect(page.getByText("7강 성공률을 59%로 변경했습니다.")).toBeVisible();
  await expect(page.getByText("실제 캐시 미리보기", { exact: true })).toBeVisible();
  await expect(page.getByText("59%", { exact: true }).first()).toBeVisible();
});
