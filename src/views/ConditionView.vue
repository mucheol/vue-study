<script setup>
import { useScrollSpy } from '@/composables/useScroll'
import { onMounted, onUnmounted, ref } from 'vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const { activeSectionId } = useScrollSpy()

function updateActiveSpy() {
  let current = ''
  sections.value.forEach(({ id }) => {
    const el = document.getElementById(id)
    if (!el) return

    // getBoundingClientRect()는 요소의 크기와 뷰포트에 대한 상대적인 위치 정보를 반환하는 메서드입니다.
    // top은 요소의 상단이 뷰포트의 상단에서 얼마나 떨어져 있는지를 나타냅니다.
    const { top } = el.getBoundingClientRect()
    // h2가 화면 상단 30% 지점에 진입하면 active (이미 지나간 경우도 포함)
    if (top < window.innerHeight * 0.3) {
      current = id
    }
  })
  if (current) activeSectionId.value = current
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveSpy, { passive: true })
  updateActiveSpy()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSpy)
})

// 각 섹션의 코드 내용 + highlighted 결과값을 하나의 배열로 관리
const sections = ref([
  {
    id: 'if',
    title: 'v-if \/ v-else-if \/ v-else',
    code: `
<script setup>
  import { ref } from 'vue'

  const score = ref(85)
  // 값을 바꿔가며 확인 : 95 → A / 75 → B / 65 → C / 40 → F
<\/script>

<template>
  <!--
    v-if / v-else-if / v-else
    JS의 if / else if / else 구조를 HTML 속성처럼 쓰는 것

    동작 방식 :
    - 위에서 아래로 순서대로 조건 체크
    - true가 되는 순간 해당 요소만 렌더링, 나머지는 건너뜀
    - 조건이 false인 요소는 DOM에서 완전히 제거됨 (개발자도구에서 아예 안 보임)

    주의사항 :
    - v-else-if, v-else 는 반드시 v-if 바로 다음 형제 요소여야 함
    - 사이에 다른 요소가 끼면 연결이 끊어져서 에러남
  -->
  <p v-if="score >= 90">A등급 — 90점 이상</p>
  <p v-else-if="score >= 80">B등급 — 80점 이상</p>
  <p v-else-if="score >= 70">C등급 — 70점 이상</p>
  <p v-else-if="score >= 60">D등급 — 60점 이상</p>
  <p v-else>F등급 — 60점 미만</p>
  <!--
    v-else는 마지막에만 올 수 있고 조건값 없음
    위의 모든 조건이 전부 false일 때 렌더링됨
  -->


  <!-- 여러 요소를 하나의 조건으로 묶을 때는 <template> 사용 -->
  <!-- <template>은 DOM에 렌더링되지 않는 논리적 래퍼 → React의 <></> 와 같은 역할 -->
  <template v-if="score >= 60">
    <p>합격입니다.</p>
    <button>다음 단계로</button>
    <!-- 이 두 요소가 하나의 조건으로 묶임 / 실제 DOM에는 p, button만 생성됨 -->
  </template>
  <p v-else>재시험 대상입니다.</p>
<\/template>`,
    highlighted: '', // hljs 처리 결과가 여기에 담김
  },
  {
    id: 'show',
    title: 'v-show',
    code: `
<script setup>
  import { ref } from 'vue'

  const isMenuOpen = ref(false)
  const isLoggedIn = ref(false)
<\/script>

<template>
  <button @click="isMenuOpen = !isMenuOpen">메뉴 열기/닫기</button>

  <!--
    v-show="조건"
    조건이 false여도 DOM에서 제거되지 않음
    내부적으로 style="display: none;" 만 추가/제거하는 방식
    → 개발자도구에서 요소는 항상 보임

    v-if와 차이 :
    - v-if  : false면 DOM 제거 / true면 DOM 새로 생성 → 토글 비용 큼
    - v-show : DOM은 유지, CSS만 변경 → 토글 비용 작음

    v-show가 적합한 경우 :
    → 버튼 클릭마다 열렸다 닫히는 메뉴, 모달, 아코디언, 탭처럼 자주 토글되는 UI
    → 패널 안에 input이 있을 때 — v-if면 닫힐 때 입력값이 사라지지만 v-show는 유지됨

    v-if가 적합한 경우 :
    → 로그인 여부, 권한 체크처럼 조건이 거의 안 바뀌는 것
    → false일 때 DOM 자체가 없어야 하는 것 (보안상 소스에 노출되면 안 되는 UI)

    v-show의 한계 :
    → v-else 사용 불가 — 필요하면 v-show 두 개로 각각 처리해야 함
  -->
  <nav v-show="isMenuOpen">
    <ul>
      <li>홈</li>
      <li>소개</li>
      <li>연락처</li>
    </ul>
  </nav>

  <!-- v-else가 없으니 반대 조건은 v-show로 따로 처리 -->
  <p v-show="!isMenuOpen">메뉴가 닫혀있습니다.</p>
<\/template>`,
    highlighted: '', // hljs 처리 결과가 여기에 담김
  },
  {
    id: 'for',
    title: 'v-for',
    code: `
<script setup>
  import { ref } from 'vue'

  // 배열
  const fruits = ref(['사과', '바나나', '포도'])

  // 객체 배열 (실무에서 가장 많이 쓰는 형태)
  const users = ref([
    { id: 1, name: '무아', role: 'admin'  },
    { id: 2, name: '지수', role: 'editor' },
    { id: 3, name: '현우', role: 'guest'  },
  ])

  // 순수 객체
  const profile = ref({
    name: '무아',
    job:  '웹 퍼블리셔',
    city: '서울'
  })
<\/script>

<template>

  <!-- ────────────────────────────────
    배열 순회
    v-for="변수명 in 배열"
    JS의 for...of 와 같은 개념을 HTML에서 쓰는 것
    React의 .map((item) => <li>) 와 동일한 역할
  ──────────────────────────────── -->
  <ul>
    <li v-for="fruit in fruits" :key="fruit">{{ fruit }}</li>
  </ul>

  <!-- (item, index) 형태로 인덱스도 같이 사용 가능 -->
  <!-- 괄호 안 순서 : 첫 번째 = 값, 두 번째 = 인덱스 (0부터 시작) -->
  <ul>
    <li v-for="(fruit, index) in fruits" :key="fruit">
      {{ index + 1 }}. {{ fruit }}
    </li>
  </ul>

  <!-- 객체 배열 — 실무 패턴 / :key는 고유 ID 사용이 원칙 -->
  <!--
    :key 는 필수
    Vue가 데이터 변경 시 어떤 DOM 요소를 업데이트할지 추적하는 식별자
    고유 ID가 있으면 반드시 ID 사용 / 없을 때만 어쩔 수 없이 index 사용
    index를 key로 쓰면 항목 추가/삭제/정렬 시 잘못된 요소가 업데이트되는 버그 발생 가능
  -->
  <ul>
    <li v-for="user in users" :key="user.id">
      {{ user.name }} — {{ user.role }}
    </li>
  </ul>


  <!-- ────────────────────────────────
    객체 순회
    v-for="(값, 키) in 객체"
    순서 주의 : 값이 먼저, 키가 두 번째 — 헷갈리기 쉬운 부분
    React에서는 Object.entries(obj).map(([key, val]) => ...) 로 해야 하는 걸
    Vue는 v-for로 바로 처리 가능
  ──────────────────────────────── -->
  <dl>
    <template v-for="(value, key) in profile" :key="key">
      <dt>{{ key }}</dt>
      <dd>{{ value }}</dd>
    </template>
  </dl>

  <!-- 세 번째 인자로 인덱스도 받을 수 있음 -->
  <ul>
    <li v-for="(value, key, index) in profile" :key="key">
      {{ index + 1 }}. {{ key }} : {{ value }}
    </li>
  </ul>


  <!-- ────────────────────────────────
    숫자 순회
    v-for="n in 숫자"
    별도의 배열 없이 반복 횟수만 필요할 때 사용
    1부터 시작 — 0이 아님 주의
    JS의 for(let i = 1; i <= 5; i++) 와 동일
  ──────────────────────────────── -->
  <ul>
    <li v-for="n in 5" :key="n">{{ n }}번째 항목</li>
    <!-- 출력 : 1, 2, 3, 4, 5 -->
  </ul>

  <!-- 활용 예 : 별점 UI -->
  <div>
    <span v-for="star in 5" :key="star">★</span>
  </div>

  <!-- 활용 예 : 스켈레톤 로딩 카드 3개 -->
  <div class="skeleton-wrap">
    <div v-for="n in 3" :key="n" class="skeleton-card"></div>
  </div>

<\/template>`,
  },
])

// 마운트 시 모든 섹션의 code를 h1js로 변환해서 각 highlighted에 저장
onMounted(() => {
  sections.value.forEach((section) => {
    if (section.code) {
      section.highlighted = hljs.highlight(section.code, { language: 'html' }).value
    }
  })
})
</script>

<template>
  <div class="pageOutWrap conditionPage">
    <div class="cl_subVisual"></div>
    <div class="cl_breadcrumb">HOME / 조건부&반복</div>
    <div class="cl_pageTitle">조건부 & 반복</div>

    <!-- v-for로 sections 배열을 순회 -> 각 section.highlighted에 해당 코드가 들어있음 -->
    <section v-for="section in sections" :key="section.id" class="contentWrap">
      <h2 class="cl_sectionTitle" :id="section.id">{{ section.title }}</h2>
      <pre v-if="section.highlighted" class="code-block">
        <code v-html="section.highlighted"></code>
      </pre>
    </section>
  </div>
</template>

<style scoped>
.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 24px;
  border-radius: 8px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
}
</style>
