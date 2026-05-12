# Vue 3 + Express 풀스택 템플릿

Vue 3 프론트엔드와 Node.js 백엔드를 연동한 풀스택 학습 프로젝트입니다.
SQLite 기반 조직도 데이터를 트리 구조로 시각화하고 브라우저에서 직접 편집할 수 있습니다.

---

## 실행 방법

> 터미널을 **2개** 열어서 각각 실행해야 합니다.

### 1. 백엔드 서버 시작

```sh
cd backend
node server.js
```

서버가 정상 실행되면 `서버 실행 중: http://localhost:3001` 메시지가 출력됩니다.

### 2. 프론트엔드 개발 서버 시작

```sh
# 루트 폴더에서
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 백엔드 DB 관련 명령어

```sh
cd backend

# DB 초기화 + 마이그레이션 + 시드 한 번에
npx prisma migrate reset

# 시드만 다시 실행 (데이터 초기화 후 샘플 데이터 재입력)
npx prisma db seed

# DB 내용을 GUI로 확인
npx prisma studio
```

---

## 프론트엔드 명령어

```sh
npm install       # 의존성 설치
npm run dev       # 개발 서버 (HMR)
npm run build     # 프로덕션 빌드 → dist/
npm run preview   # 빌드 결과 미리보기
npm run lint      # 코드 검사 + 자동 수정
npm run format    # 코드 포맷팅
```

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | Vue 3, Vue Router v5, Vite |
| 백엔드 | Node.js, Express v5 |
| ORM | Prisma v5 |
| 데이터베이스 | SQLite (`backend/prisma/dev.db`) |
| 린트/포맷 | oxlint, ESLint, Prettier |
| 테스트 | Playwright |

---

## 프로젝트 구조

```
vue-test/
├── backend/                  # Express + Prisma 백엔드
│   ├── server.js             # 서버 진입점 (포트 3001)
│   ├── routes/
│   │   └── org.js            # 조직도 API 라우터
│   └── prisma/
│       ├── schema.prisma     # DB 모델 정의
│       ├── seed.js           # 샘플 데이터
│       └── dev.db            # SQLite DB 파일 (git 제외)
│
└── src/                      # Vue 3 프론트엔드
    ├── main.js               # 앱 진입점
    ├── App.vue               # 루트 레이아웃 (헤더/사이드바/푸터)
    ├── router/index.js       # 라우트 정의
    ├── assets/styles/        # 전역 CSS (4계층 고정 순서)
    ├── components/
    │   ├── common/           # AppHeader, AppSidebar, AppFooter
    │   ├── ui/               # 재사용 컴포넌트 (TreeNode 포함)
    │   └── sections/         # 페이지별 섹션
    ├── views/                # 라우트 페이지 컴포넌트
    ├── composables/          # useFetch, useScroll
    ├── stores/               # Pinia 스토어 (플레이스홀더)
    └── utils/                # format.js 등 순수 헬퍼
```

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/org` | 전체 조직도 트리 반환 |
| GET | `/api/org/:id` | 특정 노드 + 직계 자식 반환 |
| PATCH | `/api/org/:id` | 노드 이름 수정 |

---

## 조직도 페이지 (`/org`)

- `/org` 경로에서 확인
- SQLite DB에서 데이터를 fetch해 수평 트리 구조로 렌더링
- **더블클릭** → 노드 이름 인라인 편집
- Enter 저장 / Escape 취소
- 저장 시 PATCH API 호출 → DB 즉시 반영
- 페이지를 새로고침해도 수정된 이름이 유지됨

### 샘플 조직도 데이터

```
무무소프트 (회사)
├── 경영진
│   ├── 홍길동 (CEO)
│   └── 김영희 (CFO)
├── 개발팀
│   ├── 프론트엔드팀
│   │   ├── 이영자 (팀장)
│   │   └── 김철수 (개발자)
│   └── 백엔드팀
│       ├── 최지원 (팀장)
│       └── 정다운 (개발자)
└── 마케팅팀
    ├── SNS팀
    └── 광고팀
```

---

## DB 구조

```prisma
model Node {
  id        Int      @id @default(autoincrement())
  name      String   // 이름
  role      String?  // 직책 (선택)
  parentId  Int?     // 부모 노드 ID (null = 최상위)
  parent    Node?    @relation("NodeChildren", fields: [parentId], references: [id])
  children  Node[]   @relation("NodeChildren")
  createdAt DateTime @default(now())
}
```

자기 참조(self-referential) 모델로 재귀적 트리 구조를 표현합니다.

---

## CSS 아키텍처

`src/main.js`에서 아래 순서로 고정 로드합니다.

| 파일 | 역할 |
|---|---|
| `font.css` | @font-face 선언 |
| `base.css` | 리셋, body 기본값, `.ir`, `.skipNav` |
| `commonLayout.css` | 공통 레이아웃 클래스 (`pageOutWrap`, `contentWrap` 등) |
| `layout.css` | 그리드 시스템 + 반응형 미디어쿼리 |

---

## 환경 요구사항

- Node.js `^20.19.0` 또는 `>=22.12.0`

---

## 처음 시작하는 경우

```sh
# 1. 프론트엔드 의존성 설치
npm install

# 2. 백엔드 의존성 설치 + DB 초기화
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed

# 3. 터미널 2개로 각각 실행
node server.js          # 백엔드 (터미널 1)
cd .. && npm run dev    # 프론트엔드 (터미널 2)
```
