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
