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
    const { top } = el.getBoundingClientRect()
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

const sections = ref([
  {
    id: 'lifecycle',
    title: '라이프사이클',
    code: `
<script setup>
import { ref, onMounted, onUnmounted, onUpdated, onBeforeUnmount } from 'vue'

// ─────────────────────────────────────────
// 라이프사이클 훅
// 컴포넌트가 생성 → 마운트 → 업데이트 → 언마운트 되는 각 시점에
// 원하는 코드를 실행할 수 있게 해주는 함수들
//
// React 와 비교 :
//   onMounted       → useEffect(() => {}, [])   마운트 시 1회
//   onUnmounted     → useEffect(() => { return () => {} }, [])  클린업
//   onUpdated       → useEffect(() => {})   매 렌더링 후
// ─────────────────────────────────────────

const list      = ref([])
const scrollY   = ref(0)
const timer     = ref(null)
const isLoading = ref(false)

// ─────────────────────────────────────────
// onMounted
// 컴포넌트가 DOM에 완전히 삽입된 직후 실행
// DOM 접근, API 호출, 외부 라이브러리 초기화 등을 여기서 처리
// setup() 실행 시점에는 아직 DOM이 없어서 DOM 접근 불가
// onMounted 안에서 해야 DOM이 준비된 상태
// ─────────────────────────────────────────

onMounted(async function() {
  // API 호출로 초기 데이터 불러오기
  isLoading.value = true
  const res = await fetch('/api/posts')
  list.value = await res.json()
  isLoading.value = false

  // 스크롤 이벤트 등록
  window.addEventListener('scroll', handleScroll)

  // 타이머 시작
  timer.value = setInterval(function() {
    console.log('1초마다 실행')
  }, 1000)
})


// ─────────────────────────────────────────
// onUnmounted
// 컴포넌트가 DOM에서 제거된 직후 실행
// onMounted 에서 등록한 이벤트, 타이머 등을 여기서 정리
// 정리 안 하면 컴포넌트가 사라져도 이벤트/타이머가 계속 실행 → 메모리 누수
// ─────────────────────────────────────────

onUnmounted(function() {
  // onMounted 에서 등록한 것들을 반드시 정리
  window.removeEventListener('scroll', handleScroll)
  clearInterval(timer.value)
})

function handleScroll() {
  scrollY.value = window.scrollY
}


// ─────────────────────────────────────────
// onBeforeUnmount
// 컴포넌트가 제거되기 직전 실행
// onUnmounted 와 차이 : 이 시점에는 아직 DOM이 살아있음
// WebSocket 연결 종료, 진행 중인 애니메이션 중단 등에 사용
// ─────────────────────────────────────────

onBeforeUnmount(function() {
  // 아직 DOM이 있는 상태 — DOM 관련 정리 작업 가능
  // ex) GSAP 애니메이션 kill(), WebSocket.close() 등
  console.log('컴포넌트 제거 직전 — DOM 아직 살아있음')
})


// ─────────────────────────────────────────
// onUpdated
// 반응형 데이터 변경으로 DOM이 업데이트된 직후 실행
// 업데이트된 DOM에 접근해야 할 때 사용
// 주의 : onUpdated 안에서 state 변경하면 무한루프 발생
// ─────────────────────────────────────────

onUpdated(function() {
  // DOM이 최신 상태로 업데이트된 직후
  // 특정 DOM 상태 확인이 필요할 때만 사용
  // 대부분의 경우 watch 나 computed 로 대체 가능
  console.log('DOM 업데이트 완료')
})


// ─────────────────────────────────────────
// 라이프사이클 실행 순서 정리
//
// 컴포넌트 생성  : setup() 실행
// DOM 삽입 전   : onBeforeMount (거의 안 씀)
// DOM 삽입 후   : onMounted     ← 주로 여기서 초기화 작업
// 데이터 변경   : onBeforeUpdate → onUpdated
// 제거 직전     : onBeforeUnmount
// 제거 완료     : onUnmounted   ← 여기서 정리 작업
// ─────────────────────────────────────────
<\/script>

<template>
  <p>스크롤 위치 : {{ scrollY }}px</p>

  <div v-if="isLoading">로딩 중...</div>
  <ul v-else>
    <li v-for="item in list" :key="item.id">{{ item.title }}</li>
  </ul>
<\/template>`,
    highlighted: '',
  },
  {
    id: 'template-ref',
    title: 'template ref (Swiper, GSAP)',
    code: `
  <script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'

// ─────────────────────────────────────────
// template ref
// Vue 가 관리하는 DOM 요소에 직접 접근하는 방법
// JS 의 document.querySelector() 와 같은 역할이지만
// Vue 방식으로 — 컴포넌트 인스턴스에 안전하게 접근
//
// 사용 이유 :
// Swiper, GSAP, Chart.js 같은 외부 라이브러리는
// Vue 의 반응형 시스템 밖에 있어서 DOM 요소를 직접 넘겨줘야 함
// ─────────────────────────────────────────

// 1. script 에서 ref(null) 로 변수 선언
const swiperEl  = ref(null)   // Swiper 컨테이너 요소
const boxEl     = ref(null)   // GSAP 애니메이션 대상 요소
const inputEl   = ref(null)   // 포커스 자동 설정용 input

// 선언한 변수명과 template 의 ref 속성값이 일치해야 연결됨
// onMounted 이전에는 null — DOM이 없을 때 접근하면 에러


// ─────────────────────────────────────────
// Swiper 초기화 예제
// CDN 또는 npm install swiper 로 설치 후 사용
// ─────────────────────────────────────────

let swiperInstance = null

onMounted(function() {
  // onMounted 안에서만 DOM 접근 가능
  // swiperEl.value 가 실제 DOM 요소를 가리킴
  swiperInstance = new Swiper(swiperEl.value, {
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  })
  // swiperEl.value 로 DOM 요소를 직접 전달
  // document.querySelector('.swiper') 대신 ref 를 쓰는 이유 :
  // 같은 컴포넌트가 여러 개 있어도 각자 자신의 DOM 요소에만 접근함
})

onBeforeUnmount(function() {
  // 컴포넌트 제거 전 Swiper 인스턴스 정리
  if (swiperInstance) {
    swiperInstance.destroy(true, true)
  }
})


// ─────────────────────────────────────────
// GSAP 애니메이션 예제
// npm install gsap 또는 CDN 으로 설치
// ─────────────────────────────────────────

onMounted(function() {
  // boxEl.value 로 DOM 요소 직접 접근
  gsap.from(boxEl.value, {
    duration: 1,
    opacity: 0,
    y: 60,
    ease: 'power3.out',
  })
  // document.querySelector('#box') 대신 ref 사용 — 더 안전하고 Vue 스러운 방식
})

function playAnimation() {
  gsap.to(boxEl.value, {
    duration: 0.5,
    scale: 1.2,
    backgroundColor: '#42d392',
    yoyo: true,     // 원래 상태로 되돌아옴
    repeat: 1,
  })
}

function resetAnimation() {
  gsap.set(boxEl.value, { scale: 1, backgroundColor: '#ffffff' })
}


// ─────────────────────────────────────────
// 단순 DOM 접근 예제 — 자동 포커스, 스크롤
// ─────────────────────────────────────────

onMounted(function() {
  // 페이지 진입 시 input 자동 포커스
  inputEl.value.focus()
  // inputEl.value 는 실제 <input> DOM 요소
  // .focus() .blur() .scrollIntoView() 등 네이티브 DOM 메서드 그대로 사용 가능
})

const listEl = ref(null)

function scrollToBottom() {
  // 채팅창 최신 메시지로 스크롤
  listEl.value.scrollTop = listEl.value.scrollHeight
}
<\/script>

<template>

  <!-- 2. template 에서 ref 속성에 변수명을 문자열로 지정 -->
  <!-- script 의 변수명과 동일하게 써야 연결됨 -->

  <!-- Swiper HTML 구조 -->
  <div ref="swiperEl" class="swiper">
    <div class="swiper-wrapper">
      <div class="swiper-slide">슬라이드 1</div>
      <div class="swiper-slide">슬라이드 2</div>
      <div class="swiper-slide">슬라이드 3</div>
    </div>
    <div class="swiper-pagination"></div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
  </div>

  <!-- GSAP 대상 요소 -->
  <div ref="boxEl" class="box">애니메이션 대상</div>
  <button @click="playAnimation">애니메이션 실행</button>
  <button @click="resetAnimation">초기화</button>

  <!-- 자동 포커스 input -->
  <input ref="inputEl" type="text" placeholder="자동으로 포커스됩니다" />

  <!-- 스크롤 제어 -->
  <ul ref="listEl" style="height: 200px; overflow-y: auto;">
    <li v-for="n in 20" :key="n">메시지 {{ n }}</li>
  </ul>
  <button @click="scrollToBottom">맨 아래로</button>

<\/template>  
  `,
    highlighted: '',
  },
  {
    id: 'transition',
    title: 'Transition 애니메이션',
    code: `
<script setup>
import { ref } from 'vue'

// ─────────────────────────────────────────
// <Transition>
// Vue 내장 컴포넌트 — import 없이 바로 사용 가능
// v-if, v-show, 동적 컴포넌트의 등장/퇴장에 CSS 애니메이션을 적용
//
// 동작 방식 :
// 요소가 나타날 때 → v-enter-from → v-enter-active → v-enter-to 순으로 클래스 부여
// 요소가 사라질 때 → v-leave-from → v-leave-active → v-leave-to 순으로 클래스 부여
// transition/animation 이 끝나면 클래스 자동 제거
// ─────────────────────────────────────────

const isVisible = ref(false)
const isModal   = ref(false)
const activeTab = ref('home')
<\/script>

<template>

  <!-- ─────────────────────────────────────
    기본 Transition
    name 속성을 지정하면 클래스 앞에 그 이름이 붙음
    name="fade" → .fade-enter-from .fade-enter-active .fade-leave-to 등
    name 없으면 기본 prefix 'v-' 사용
  ───────────────────────────────────────── -->

  <button @click="isVisible = !isVisible">토글</button>

  <Transition name="fade">
    <p v-if="isVisible">나타났다 사라지는 텍스트</p>
    <!--
      v-if 또는 v-show 와 함께 사용
      자식이 하나여야 함 — 여러 요소면 <TransitionGroup> 사용
    -->
  </Transition>

  <!-- 아래 CSS 를 <style> 에 작성 -->
  <!--
    .fade-enter-from,
    .fade-leave-to {
      opacity: 0;
    }
    .fade-enter-active,
    .fade-leave-active {
      transition: opacity 0.3s ease;
    }

    클래스 동작 설명 :
    enter-from  : 등장 시작 시점의 초기 상태 (투명)
    enter-active: 등장하는 동안 적용 (transition 정의)
    enter-to    : 등장 완료 시점 상태 (생략 가능 — 기본 스타일로 끝남)
    leave-from  : 퇴장 시작 시점 (생략 가능 — 현재 상태 그대로)
    leave-active: 퇴장하는 동안 적용 (transition 정의)
    leave-to    : 퇴장 완료 시점의 상태 (투명)
  -->


  <!-- ─────────────────────────────────────
    슬라이드 + 페이드 조합 예제
  ───────────────────────────────────────── -->

  <Transition name="slide-up">
    <div v-if="isModal" class="modal">
      <p>모달 내용</p>
      <button @click="isModal = false">닫기</button>
    </div>
  </Transition>

  <!--
    .slide-up-enter-from,
    .slide-up-leave-to {
      opacity: 0;
      transform: translateY(20px);
    }
    .slide-up-enter-active,
    .slide-up-leave-active {
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
  -->


  <!-- ─────────────────────────────────────
    mode 옵션 — 요소가 교체될 때 순서 제어
    out-in : 현재 요소가 완전히 사라진 후 다음 요소 등장
    in-out : 다음 요소가 먼저 등장하고 현재 요소 사라짐
    기본값 : 동시에 진행 — 두 요소가 겹쳐 보이는 현상 발생
  ───────────────────────────────────────── -->

  <div class="tabs">
    <button @click="activeTab = 'home'">홈</button>
    <button @click="activeTab = 'about'">소개</button>
    <button @click="activeTab = 'contact'">연락처</button>
  </div>

  <Transition name="fade" mode="out-in">
    <!--
      key 를 바꿔줘야 같은 태그여도 Vue 가 다른 요소로 인식해서 트랜지션 발생
      key 없으면 같은 <div> 로 인식해서 트랜지션 안 일어남
    -->
    <div :key="activeTab">
      <p v-if="activeTab === 'home'">홈 탭 내용</p>
      <p v-else-if="activeTab === 'about'">소개 탭 내용</p>
      <p v-else>연락처 탭 내용</p>
    </div>
  </Transition>


  <!-- ─────────────────────────────────────
    TransitionGroup — 리스트 아이템 애니메이션
    v-for 로 렌더링되는 여러 요소에 개별 트랜지션 적용
    <Transition> 과 다르게 실제 DOM 요소를 렌더링 (기본 <span>, tag 로 변경 가능)
    리스트 아이템 추가/제거/정렬에 모두 적용됨
  ───────────────────────────────────────── -->

  <TransitionGroup name="list" tag="ul">
    <!--
      tag="ul" : TransitionGroup 이 ul 태그로 렌더링됨
      각 li 에 :key 필수 — 트랜지션이 key 로 요소를 추적하기 때문
    -->
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </TransitionGroup>

  <!--
    .list-enter-from,
    .list-leave-to {
      opacity: 0;
      transform: translateX(-20px);
    }
    .list-enter-active,
    .list-leave-active {
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .list-move {
      transition: transform 0.3s ease;
    }
    .list-move : 기존 아이템이 새 위치로 이동할 때 적용
    추가/제거 시 나머지 아이템들이 자연스럽게 이동함
  -->

<\/template>`,
    highlighted: '',
  },
  {
    id: 'dynamic-components',
    title: '동적 컴포넌트',
    code: `
<script setup>
import { ref, shallowRef } from 'vue'
import HomeTab    from './HomeTab.vue'
import ProfileTab from './ProfileTab.vue'
import SettingTab from './SettingTab.vue'

// ─────────────────────────────────────────
// 동적 컴포넌트
// 어떤 컴포넌트를 렌더링할지 변수로 제어
// 탭, 스텝 폼, 위젯 대시보드처럼
// 조건에 따라 다른 컴포넌트를 보여줄 때 사용
//
// v-if 여러 개로 대체할 수 있지만
// 컴포넌트가 많아질수록 동적 컴포넌트가 훨씬 깔끔함
// ─────────────────────────────────────────

// shallowRef : ref() 와 같지만 내부 깊은 곳까지 반응형으로 만들지 않음
// 컴포넌트 객체 자체를 값으로 쓸 때는 shallowRef 가 더 적합
// ref() 써도 동작하지만 Vue 공식 문서 권장 방식
const currentTab = shallowRef(HomeTab)

const tabs = [
  { label: '홈',     component: HomeTab    },
  { label: '프로필', component: ProfileTab },
  { label: '설정',   component: SettingTab },
]


// ─────────────────────────────────────────
// KeepAlive — 컴포넌트 상태 유지
// 동적 컴포넌트는 전환될 때마다 기존 컴포넌트가 언마운트되고 새로 마운트됨
// 탭 안에 입력값이 있으면 탭 이동 시 입력값이 사라지는 문제 발생
// <KeepAlive> 로 감싸면 언마운트 대신 캐시에 보관 → 상태 유지
// ─────────────────────────────────────────

// KeepAlive 상태에서 추가로 쓸 수 있는 훅
// onActivated   : KeepAlive 캐시에서 다시 활성화될 때
// onDeactivated : KeepAlive 캐시로 비활성화될 때
// (onMounted/onUnmounted 는 KeepAlive 안에서 최초 1회만 실행됨)


// ─────────────────────────────────────────
// 문자열 기반 동적 컴포넌트
// 컴포넌트를 전역 등록했거나 이름으로 참조할 때
// ─────────────────────────────────────────

const widgetType = ref('chart')
// :is="'chart'" 형태로 전역 등록된 컴포넌트 이름을 문자열로 지정 가능
// 단, 로컬 import 한 컴포넌트는 객체 참조 방식이 더 안전


// ─────────────────────────────────────────
// 동적 컴포넌트에 props / emit 전달
// ─────────────────────────────────────────

const tabProps = ref({
  userId: 1,
  editable: true,
})

function handleTabEvent(data) {
  console.log('탭에서 이벤트 수신 :', data)
}
<\/script>

<template>

  <!-- 기본 동적 컴포넌트 -->
  <div class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.label"
      @click="currentTab = tab.component"
    >
      {{ tab.label }}
    </button>
  </div>

  <!--
    <component :is="컴포넌트">
    :is 에 컴포넌트 객체 또는 컴포넌트 이름 문자열을 바인딩
    currentTab 이 바뀌면 해당 컴포넌트로 교체 렌더링
  -->
  <component :is="currentTab" />


  <!-- ─────────────────────────────────────
    KeepAlive 로 상태 유지
  ───────────────────────────────────────── -->

  <KeepAlive>
    <component :is="currentTab" />
    <!--
      탭을 이동해도 각 컴포넌트의 입력값, 스크롤 위치 등이 유지됨
      내부적으로 언마운트 대신 캐시에 보관
    -->
  </KeepAlive>

  <!-- include / exclude 로 특정 컴포넌트만 캐시 -->
  <KeepAlive include="HomeTab,ProfileTab">
    <!--
      HomeTab, ProfileTab 만 캐시
      SettingTab 은 전환 시 언마운트 — 민감한 설정 폼은 캐시 안 하는 게 나을 수도 있음
    -->
    <component :is="currentTab" />
  </KeepAlive>

  <!-- max 로 최대 캐시 개수 제한 -->
  <KeepAlive :max="3">
    <component :is="currentTab" />
    <!-- 캐시 3개 초과 시 가장 오래된 것부터 제거 (LRU 방식) -->
  </KeepAlive>


  <!-- ─────────────────────────────────────
    Transition 과 조합 — 탭 전환 애니메이션
  ───────────────────────────────────────── -->

  <Transition name="fade" mode="out-in">
    <KeepAlive>
      <component :is="currentTab" :key="currentTab" />
      <!--
        :key 를 currentTab 으로 설정
        탭이 바뀔 때 다른 요소로 인식 → Transition 발동
        KeepAlive 는 캐시 유지, Transition 은 시각적 전환 담당
      -->
    </KeepAlive>
  </Transition>


  <!-- ─────────────────────────────────────
    props / emit 전달
  ───────────────────────────────────────── -->

  <component
    :is="currentTab"
    v-bind="tabProps"
    @tab-event="handleTabEvent"
  />
  <!--
    v-bind="tabProps" : 객체를 스프레드해서 props 전달
    @tab-event : 동적 컴포넌트에서 emit 한 이벤트도 동일하게 수신 가능
    어떤 컴포넌트가 와도 공통 props/이벤트 처리 가능
  -->

<\/template>`,
    highlighted: '',
  },
])

onMounted(() => {
  sections.value.forEach((section) => {
    if (section.code) {
      section.highlighted = hljs.highlight(section.code, { language: 'html' }).value
    }
  })
})
</script>

<template>
  <div class="pageOutWrap patternPage">
    <div class="cl_subVisual"></div>
    <div class="cl_breadcrumb">HOME / 실전패턴</div>
    <h1 class="cl_pageTitle">실전패턴</h1>

    <section v-for="section in sections" :key="section.id" class="contentWrap">
      <h2 class="cl_sectionTitle" :id="section.id">{{ section.title }}</h2>
      <pre
        v-if="section.highlighted"
        class="code-block"
      ><code v-html="section.highlighted"></code></pre>
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
