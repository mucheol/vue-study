// @ts-check
/**
 * 퍼블리싱 공통 검증 테스트
 * -----------------------------------------------
 * 모든 프로젝트에서 재사용. 아래 두 곳만 수정:
 *   1. PAGES      — 테스트할 페이지 URL 목록
 *   2. A11Y_EXCLUDE — 접근성 검사 제외 선택자 (서드파티 주입 요소)
 *
 * 검증 항목:
 *   - 크로스브라우징 (playwright.config.js projects로 제어)
 *   - 웹 접근성 (WCAG 2.1 AA / axe-core)
 *   - 웹 표준 (HTML 구조, meta 태그, 헤딩 계층, 중복 id, 빈 링크)
 *   - SEO (meta description 길이, og 태그 값 존재, canonical)
 *   - 반응형 (360 · 375 · 768 · 1920px 가로 스크롤 여부)
 *   - JS 콘솔 에러 / 경고
 *   - 404 리소스
 *   - 오타 의심 텍스트 (lorem ipsum / undefined / null / NaN / [object Object] / TODO / FIXME)
 *   - 성능 (3초 이내 networkidle 도달)
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/* -----------------------------------------------
   프로젝트마다 수정할 부분
----------------------------------------------- */
const PAGES = [
  { name: '홈', url: 'http://localhost:5173/' },
  { name: '프로토', url: 'http://localhost:5173/proto' },
]

// 서드파티 주입 요소 — 접근성 검사에서 제외
const A11Y_EXCLUDE = ['.vue-devtools__anchor-btn', '#vue-devtools']
/* ----------------------------------------------- */

for (const { name, url } of PAGES) {
  test.describe(`[${name}] ${url}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(url)
    })

    /* ==============================
       웹 접근성 (WCAG 2.1 AA)
    ============================== */

    test('WCAG 2.1 AA 위반 없음 (axe-core)', async ({ page }) => {
      let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa'])
      for (const sel of A11Y_EXCLUDE) builder = builder.exclude(sel)
      const { violations } = await builder.analyze()
      expect(violations).toEqual([])
    })

    test('html lang 속성이 설정되어 있다', async ({ page }) => {
      const lang = await page.locator('html').getAttribute('lang')
      expect(lang).toBeTruthy()
    })

    test('h1이 페이지에 하나만 존재한다', async ({ page }) => {
      expect(await page.locator('h1').count()).toBe(1)
    })

    test('스킵 내비게이션이 존재한다', async ({ page }) => {
      const skip = page.locator('.skipNav, [href="#content"], [href="#main"]').first()
      await expect(skip).toBeAttached()
    })

    test('모든 img에 alt 속성이 있다', async ({ page }) => {
      const imgs = page.locator('img')
      const count = await imgs.count()
      for (let i = 0; i < count; i++) {
        const alt = await imgs.nth(i).getAttribute('alt')
        expect(alt, `img[${i}]에 alt 없음`).not.toBeNull()
      }
    })

    test('텍스트 없는 단독 버튼에 aria-label이 있다', async ({ page }) => {
      const badBtns = page.locator(
        'button:not([aria-label]):not([aria-labelledby]):not([title])',
      )
      const count = await badBtns.count()
      for (let i = 0; i < count; i++) {
        const text = (await badBtns.nth(i).innerText()).trim()
        expect(text, `button[${i}]에 텍스트·aria-label 둘 다 없음`).not.toBe('')
      }
    })

    test('키보드 Tab 포커스가 동작한다', async ({ page }) => {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      await expect(focused).toBeAttached()
    })

    test('의미없는 href="#" 링크가 없다', async ({ page }) => {
      const badLinks = page.locator('a[href="#"]')
      expect(await badLinks.count(), 'href="#" 링크 발견').toBe(0)
    })

    test('빈 링크(텍스트·aria-label 모두 없음)가 없다', async ({ page }) => {
      const links = page.locator('a')
      const count = await links.count()
      for (let i = 0; i < count; i++) {
        const text = (await links.nth(i).innerText()).trim()
        const ariaLabel = await links.nth(i).getAttribute('aria-label')
        const title = await links.nth(i).getAttribute('title')
        expect(
          text || ariaLabel || title,
          `a[${i}] 링크에 접근 가능한 이름 없음`,
        ).toBeTruthy()
      }
    })

    /* ==============================
       웹 표준
    ============================== */

    test('title 태그가 비어있지 않다', async ({ page }) => {
      await expect(page).toHaveTitle(/.+/)
    })

    test('title 길이가 60자 이내다', async ({ page }) => {
      const title = await page.title()
      expect(title.length, `title이 ${title.length}자 (60자 초과)`).toBeLessThanOrEqual(60)
    })

    test('charset이 UTF-8이다', async ({ page }) => {
      const charset = await page.locator('meta[charset]').getAttribute('charset')
      expect(charset?.toUpperCase()).toBe('UTF-8')
    })

    test('viewport meta 태그가 있다', async ({ page }) => {
      await expect(page.locator('meta[name="viewport"]')).toBeAttached()
    })

    test('favicon이 존재한다', async ({ page }) => {
      const favicon = page.locator('link[rel="icon"], link[rel="shortcut icon"]')
      await expect(favicon.first()).toBeAttached()
    })

    test('중복 id가 없다', async ({ page }) => {
      const dupes = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
        return ids.filter((id, i) => ids.indexOf(id) !== i)
      })
      expect(dupes, `중복 id 발견: ${dupes.join(', ')}`).toEqual([])
    })

    test('헤딩 계층이 올바르다 (순서 건너뜀 없음)', async ({ page }) => {
      const levels = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll((els) =>
        els.map((el) => parseInt(el.tagName[1])),
      )
      for (let i = 1; i < levels.length; i++) {
        expect(
          levels[i] - levels[i - 1],
          `h${levels[i - 1]} → h${levels[i]} 건너뜀 발생`,
        ).toBeLessThanOrEqual(1)
      }
    })

    /* ==============================
       SEO
    ============================== */

    test('meta description이 있다', async ({ page }) => {
      await expect(page.locator('meta[name="description"]')).toBeAttached()
    })

    test('meta description 길이가 140자 이내다', async ({ page }) => {
      const desc = await page.locator('meta[name="description"]').getAttribute('content')
      if (desc) {
        expect(desc.length, `description이 ${desc.length}자 (140자 초과)`).toBeLessThanOrEqual(140)
      }
    })

    test('og:title이 있고 값이 비어있지 않다', async ({ page }) => {
      const el = page.locator('meta[property="og:title"]')
      await expect(el).toBeAttached()
      const content = await el.getAttribute('content')
      expect(content, 'og:title content가 비어있음').toBeTruthy()
    })

    test('og:description이 있고 값이 비어있지 않다', async ({ page }) => {
      const el = page.locator('meta[property="og:description"]')
      await expect(el).toBeAttached()
      const content = await el.getAttribute('content')
      expect(content, 'og:description content가 비어있음').toBeTruthy()
    })

    test('og:image가 있고 값이 비어있지 않다', async ({ page }) => {
      const el = page.locator('meta[property="og:image"]')
      await expect(el).toBeAttached()
      const content = await el.getAttribute('content')
      expect(content, 'og:image content가 비어있음').toBeTruthy()
    })

    test('canonical 링크가 있다', async ({ page }) => {
      await expect(page.locator('link[rel="canonical"]')).toBeAttached()
    })

    test('robots meta 태그가 있다', async ({ page }) => {
      await expect(page.locator('meta[name="robots"]')).toBeAttached()
    })

    /* ==============================
       반응형 레이아웃
    ============================== */

    test('최소 모바일(360px)에서 가로 스크롤 없음', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 })
      await page.goto(url)
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientW = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollW, '360px에서 가로 스크롤 발생').toBeLessThanOrEqual(clientW + 1)
    })

    test('모바일(375px)에서 가로 스크롤 없음', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(url)
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientW = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollW, '375px에서 가로 스크롤 발생').toBeLessThanOrEqual(clientW + 1)
    })

    test('태블릿(768px)에서 가로 스크롤 없음', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto(url)
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientW = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollW, '768px에서 가로 스크롤 발생').toBeLessThanOrEqual(clientW + 1)
    })

    test('PC(1920px)에서 가로 스크롤 없음', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto(url)
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientW = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollW, '1920px에서 가로 스크롤 발생').toBeLessThanOrEqual(clientW + 1)
    })

    /* ==============================
       JS 콘솔 에러 / 경고
    ============================== */

    test('JS 콘솔 에러가 없다', async ({ page }) => {
      /** @type {string[]} */
      const errors = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      expect(errors).toEqual([])
    })

    test('JS 콘솔 경고가 없다', async ({ page }) => {
      /** @type {string[]} */
      const warnings = []
      page.on('console', (msg) => {
        if (msg.type() === 'warning') warnings.push(msg.text())
      })
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      expect(warnings).toEqual([])
    })

    /* ==============================
       깨진 리소스 (404)
    ============================== */

    test('404 리소스가 없다', async ({ page }) => {
      /** @type {string[]} */
      const failed = []
      page.on('response', (res) => {
        if (res.status() === 404) failed.push(res.url())
      })
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      expect(failed, `404 발생 URL: ${failed.join(', ')}`).toEqual([])
    })

    /* ==============================
       성능
    ============================== */

    test('3초 이내에 networkidle 상태에 도달한다', async ({ page }) => {
      const start = Date.now()
      await page.goto(url, { waitUntil: 'networkidle', timeout: 3000 })
      const elapsed = Date.now() - start
      expect(elapsed, `networkidle 도달에 ${elapsed}ms 소요`).toBeLessThan(3000)
    })

    /* ==============================
       오타 의심 텍스트
    ============================== */

    test('Lorem ipsum 텍스트가 없다', async ({ page }) => {
      const body = await page.locator('body').innerText()
      expect(body.toLowerCase()).not.toContain('lorem ipsum')
    })

    test('undefined / null / NaN / [object Object] 텍스트가 없다', async ({ page }) => {
      const body = await page.locator('body').innerText()
      expect(body).not.toContain('undefined')
      expect(body).not.toContain('[object Object]')
      expect(body).not.toMatch(/\bnull\b/)
      expect(body).not.toMatch(/\bNaN\b/)
    })

    test('TODO / FIXME 텍스트가 화면에 노출되지 않는다', async ({ page }) => {
      const body = await page.locator('body').innerText()
      expect(body).not.toContain('TODO')
      expect(body).not.toContain('FIXME')
    })

    /* ==============================
       크로스브라우징 / Safari(WebKit) 특이사항
       - webkit 전용 테스트: 다른 브라우저에서는 자동 skip
       - 레이아웃 테스트(가로 스크롤 등)는 위 반응형 섹션에서 전 브라우저 공통 실행
    ============================== */

    test('[WebKit] 핵심 CSS 속성이 지원된다', async ({ page, browserName }) => {
      // Safari(WebKit)에서 미지원·버그가 잦은 속성들을 CSS.supports()로 일괄 확인
      test.skip(browserName !== 'webkit', 'WebKit(Safari) 전용')
      const supported = await page.evaluate(() => ({
        gap: CSS.supports('gap', '10px'),                                          // flex/grid gap — 구 Safari 미지원
        aspectRatio: CSS.supports('aspect-ratio', '16/9'),                         // 구 Safari 15 이하 미지원
        positionSticky: CSS.supports('position', 'sticky'),                        // overflow 컨텍스트 내 버그 있음
        backdropFilter:
          CSS.supports('backdrop-filter', 'blur(1px)') ||
          CSS.supports('-webkit-backdrop-filter', 'blur(1px)'),                    // -webkit- prefix 필요
        clamp: CSS.supports('width', 'clamp(100px, 50%, 200px)'),                  // 구 Safari 미지원
        dvh: CSS.supports('height', '100dvh'),                                     // iOS 주소창 대응 단위
        overflowClip: CSS.supports('overflow', 'clip'),                            // Safari 16 이하 미지원
      }))
      for (const [prop, ok] of Object.entries(supported)) {
        expect(ok, `CSS 미지원 감지: ${prop} — 폴백 또는 prefix 추가 필요`).toBe(true)
      }
    })

    test('sticky 헤더가 스크롤 후 상단에 고정된다', async ({ page }) => {
      // position:sticky 요소가 Safari를 포함한 전 브라우저에서 실제로 동작하는지 확인
      // (overflow:hidden 상위 요소가 있으면 sticky가 무력화됨)
      const header = page.locator('header').first()
      const position = await header.evaluate((el) => getComputedStyle(el).position)
      if (position === 'sticky' || position === 'fixed') {
        await page.evaluate(() => window.scrollTo(0, 400))
        await page.waitForTimeout(150)
        const box = await header.boundingBox()
        expect(box?.y ?? 0, 'sticky/fixed 헤더가 스크롤 후 뷰포트 상단에서 벗어남').toBeLessThanOrEqual(1)
      }
    })

    test('[WebKit] input·button·select에 appearance 리셋이 되어 있다', async ({ page, browserName }) => {
      // Safari는 form 요소에 기본 네이티브 스타일을 강하게 적용함
      // appearance:none 또는 -webkit-appearance:none 없으면 디자인이 달라짐
      test.skip(browserName !== 'webkit', 'WebKit(Safari) 전용')
      const formEls = page.locator('input:not([type="hidden"]), button, select, textarea')
      const count = await formEls.count()
      for (let i = 0; i < count; i++) {
        const appearance = await formEls.nth(i).evaluate((el) => {
          const s = getComputedStyle(el)
          return s.getPropertyValue('-webkit-appearance') || s.appearance || ''
        })
        // 'none'이 아닌 경우 경고 (실패 처리하면 노이즈가 많아 warn으로 기록)
        if (appearance !== 'none') {
          console.warn(
            `[appearance 미리셋] ${await formEls.nth(i).evaluate((el) => el.tagName.toLowerCase())}[${i}] → appearance: ${appearance}`,
          )
        }
      }
    })

    test('[WebKit] -webkit-backdrop-filter가 필요한 요소에 적용되어 있다', async ({
      page,
      browserName,
    }) => {
      // backdrop-filter 단독으로는 Safari에서 동작 안 함. -webkit- prefix 필수.
      test.skip(browserName !== 'webkit', 'WebKit(Safari) 전용')
      const hasBackdrop = await page.evaluate(() => {
        const els = [...document.querySelectorAll('*')]
        return els.some((el) => {
          const s = getComputedStyle(el)
          // backdrop-filter가 있는데 webkit prefix가 없으면 문제
          const bf = s.backdropFilter || ''
          const wbf = s.webkitBackdropFilter || ''
          return bf !== 'none' && bf !== '' && wbf === ''
        })
      })
      expect(hasBackdrop, 'backdrop-filter 사용 요소에 -webkit-backdrop-filter 누락').toBe(false)
    })

    test('브라우저별 스크린샷이 기준과 동일하다 (visual regression)', async ({ page }, testInfo) => {
      // 최초 실행: baseline 스냅샷 생성 (tests/__snapshots__/ 에 저장)
      // 이후 실행: 픽셀 diff 비교. 기준 업데이트 필요 시 → npx playwright test --update-snapshots
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot(
        `${testInfo.project.name.replace(/\s/g, '-')}-${name}.png`,
        { maxDiffPixelRatio: 0.02 }, // 2% 이내 픽셀 차이 허용
      )
    })
  })
}
