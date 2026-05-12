# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install          # install dependencies
npm run dev          # dev server with HMR
npm run build        # production build → dist/
npm run preview      # preview production build locally
npm run lint         # oxlint then eslint, both with --fix
npm run format       # prettier --write src/
```

Lint runs two linters in series via `npm-run-all2`: oxlint first (fast), then eslint. Both auto-fix on run.

## Architecture

Vue 3 + Vite project. No TypeScript — uses `jsconfig.json` for path intellisense only.

- `@` alias resolves to `./src/` (configured in both `vite.config.js` and `jsconfig.json`)
- `vue-router` v5 with `createWebHistory`; routes defined in `src/router/index.js`
- `vite-plugin-vue-devtools` is active in dev mode
- No Pinia plugin mounted yet — `src/stores/useUserStore.js` is a placeholder

## Directory Layout

```
src/
  assets/styles/      # Global CSS (load order fixed — see below)
  components/
    common/           # AppHeader, AppFooter, AppSidebar — shared layout shell
    ui/               # Headless/reusable primitives: BaseButton, BaseInput, BaseModal, BaseTab, BasePagination
    sections/         # Page-scoped section components, grouped by view (home/, about/)
  composables/        # Reusable composition functions (useFetch, useScroll)
  stores/             # Pinia stores (useUserStore)
  utils/              # Pure helpers (format.js — date/number formatters)
  views/              # Route-level pages (1-to-1 with router entries)
  router/index.js
  main.js
  App.vue
```

## CSS Layer Architecture

Four global stylesheets loaded in `main.js` in this fixed order:

| File | Purpose |
|---|---|
| `font.css` | `@font-face` declarations only |
| `base.css` | Reset, box-sizing, body defaults, `.ir`, `.skipNav` |
| `commonLayout.css` | Shared layout classes: `pageOutWrap`, `cl_subVisual`, `cl_breadcrumb`, `cl_pageTitle`, `contentWrap`, `fullContentWrap`, `cl_globalTabButton` |
| `layout.css` | Grid system (`gridWrapper / grid / gridCell`) and all responsive `@media` overrides |

**Do not redefine** classes from `base.css` or `commonLayout.css` in components. Use `<style scoped>` only for component-specific styles.

## Page View Structure

Every view follows this fixed template structure:

```html
<a href="#content" class="skipNav">본문 바로가기</a>
<div class="pageOutWrap [viewName]">
  <div class="cl_subVisual"></div>
  <div class="cl_breadcrumb">HOME / 메뉴명</div>
  <div class="cl_pageTitle">페이지 타이틀</div>
  <div id="content" class="contentWrap"><!-- max-width content --></div>
  <div class="fullContentWrap"><!-- full-bleed content --></div>
</div>
```

- `pageOutWrap` carries a page-identifier class matching the view filename in camelCase (e.g. `homePage`, `aboutPage`).
- `cl_subVisual` background is scoped via that page class: `.homePage .cl_subVisual { background: … }` in `layout.css`.
- `id="content"` on `contentWrap` is required for the skip-nav link.

## Common Layout Components

`src/components/common/` contains **AppHeader**, **AppFooter**, **AppSidebar** — the persistent shell around all routes. These are imported and composed in `App.vue` wrapping `<RouterView>`.

## CSS Naming Conventions (softM 정의서)

- Classes: camelCase (`mainVisual`, `newsListBox`)
- Shared/common elements: `cl_` prefix (`cl_header`, `cl_gnb`, `cl_footer`)
- Mobile-only variants: `_m` suffix
- Single-line rule style: `display:flex; align-items:center; width:100%;`
- Property order: display/position → width/height → font → margin/border → background
- Flex first; CSS grid for complex layouts; `float` forbidden
- `vw` forbidden on font sizes; `px` is the default unit

## Linting & Formatting

- **oxlint** (`.oxlintrc.json`): plugins `eslint`, `unicorn`, `oxc`, `vue`; correctness rules set to error
- **eslint** (`eslint.config.js`): `eslint:recommended` + `eslint-plugin-vue` flat/essential + oxlint conflict avoidance + prettier skip-formatting
- **prettier** (`.prettierrc.json`): no semicolons, single quotes, 100-char print width; VS Code formats on save

## Node requirement

Node `^20.19.0 || >=22.12.0` (enforced in `package.json` engines field).
