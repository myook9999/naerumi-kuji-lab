import { expect, test } from "@playwright/test";

test("모바일 첫 화면도 로그인과 회원가입을 먼저 표시한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "쿠지병동 접수처 로그인" })).toBeVisible();
  await expect(page.getByRole("link", { name: /회원가입 신청/ })).toBeVisible();
  await page.screenshot({ path: "artifacts/screenshots/kuji-hospital-login-mobile.jpg", type: "jpeg", quality: 45, fullPage: true });
});

test("승인 대기 고객은 내부 쿠지판을 볼 수 없다", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("로그인 아이디").fill("pending");
  await page.getByLabel("비밀번호", { exact: true }).fill("demo1234");
  await page.getByRole("button", { name: "병동 입장하기" }).click();
  await expect(page.getByRole("heading", { name: "사장님이 접수 내용을 확인 중이에요" })).toBeVisible();
  await expect(page.getByText("실시간 쿠지 차트")).toHaveCount(0);
});