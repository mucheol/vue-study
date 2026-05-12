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

// ① 각 섹션의 코드 내용 + highlighted 결과값을 하나의 배열로 관리
const sections = ref([
  {
    id: 'text',
    title: `텍스트 출력 {{ }}`,
    code: ` 데이터를 HTML에 텍스트로 출력해요

<script setup>
  import { ref } from 'vue'

  const name    = ref('무야')
  const age     = ref(28)
  const isAdmin = ref(true)
<\/script>

<template>
  <!-- 변수 그대로 출력 -->
  <p>{{ name }}</p>       <!-- 무야 -->
  <p>{{ age }}</p>        <!-- 28 -->

  <!-- 연산도 가능 -->
  <p>{{ age + 2 }}</p>    <!-- 30 -->

  <!-- 삼항 연산자도 가능 -->
  <p>{{ isAdmin ? '관리자' : '일반 사용자' }}</p>
<\/template>`,
    highlighted: '', // ② hljs 처리 결과가 여기에 담김
  },
  {
    id: 'attribute',
    title: '속성 바인딩',
    code: `HTML 속성에 변수를 연결할 때 앞에 : 붙여요

<script setup>
  import { ref } from 'vue'

  const imgUrl     = ref('/images/photo.jpg')
  const linkUrl    = ref('https://google.com')
  const btnText    = ref('클릭')
  const isDisabled = ref(false)
<\/script>

<template>
  <!-- :속성명 처럼 콜론(:)을 붙이면 변수 값이 바인딩됨 -->
  <img :src="imgUrl" alt="사진">
  <a :href="linkUrl">구글로 이동</a>
  <button :disabled="isDisabled">{{ btnText }}</button>

  <!-- : 없으면 그냥 문자열로 인식 — 잘못된 방법 -->
  <img src="imgUrl">

  <!-- : 있어야 변수 값이 들어감 — 올바른 방법 -->
  <img :src="imgUrl">
<\/template>`,
    highlighted: '',
  },
  {
    id: 'class',
    title: '클래스 바인딩',
    code: `<script setup>
import { ref } from 'vue'

const isActive  = ref(true)
const hasError  = ref(false)
const size      = ref('large')
<\/script>

<template>

  <!-- 객체 방식 — { 클래스명: 조건 } -->
  <!-- isActive가 true면 is-active 클래스 붙음 -->
  <div :class="{ 'is-active': isActive }"></div>

  <!-- 여러 개도 가능 -->
  <!-- is-active는 붙고 has-error는 안 붙음 -->
  <div :class="{ 'is-active': isActive, 'has-error': hasError }"></div>

  <!-- 정적 클래스와 함께 쓰기 -->
  <!-- class(고정) + :class(동적) 같이 써도 됨 -->
  <div class="btn" :class="{ 'btn--active': isActive }"></div>
  <!-- 결과: class="btn btn--active" -->

  <!-- 배열 방식 — 여러 클래스 나열 -->
  <div :class="['btn', 'btn--' + size]"></div>
  <!-- 결과: class="btn btn--large" -->

  <!-- 배열 안에 객체도 가능 -->
  <div :class="['btn', { 'is-active': isActive }]"></div>
  <!-- 결과: class="btn is-active" -->

<\/template>`,
    highlighted: '',
  },
  {
    id: 'style',
    title: '스타일 바인딩',
    code: `<script setup>
import { ref } from 'vue'

const color     = ref('royalblue')
const fontSize  = ref(16)
const boxStyle  = ref({
  background: '#f5f5f5',
  borderRadius: '8px',
  padding: '20px'
})
<\/script>

<template>

  <!-- 객체 방식 — CSS 속성명은 camelCase로 -->
  <p :style="{ color: color }"></p>
  <p :style="{ fontSize: fontSize + 'px' }"></p>

  <!-- font-size → fontSize -->
  <!-- background-color → backgroundColor -->
  <div :style="{ backgroundColor: '#fff', borderRadius: '8px' }"></div>

  <!-- 변수 객체 통째로 넘기기 -->
  <div :style="boxStyle"></div>

  <!-- 배열 방식 — 여러 객체 합치기 -->
  <div :style="[boxStyle, { color: color }]"></div>

<\/template>`,
    highlighted: '',
  },
])

// ③ 마운트 시 모든 섹션의 code를 hljs로 변환해서 각 highlighted에 저장
onMounted(() => {
  sections.value.forEach((section) => {
    if (section.code) {
      section.highlighted = hljs.highlight(section.code, { language: 'html' }).value
    }
  })
})
</script>

<template>
  <div class="pageOutWrap dataBindingPage">
    <div class="cl_subVisual"></div>
    <div class="cl_breadcrumb">HOME / 데이터바인딩</div>
    <h1 class="cl_pageTitle">데이터바인딩</h1>

    <!-- ④ v-for로 sections 배열을 순회 → 각 section.highlighted에 해당 코드가 들어있음 -->
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
