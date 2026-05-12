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
    id: 'click',
    title: '@click @keyup @submit',
    code: `
    <script setup>
import { ref } from 'vue'

const count    = ref(0)
const inputVal = ref('')
const lastKey  = ref('')

function handleSubmit() {
  console.log('폼 제출됨 :', inputVal.value)
}
<\/script>

<template>

  <!-- ────────────────────────────────
    @click
    v-on:click 의 단축 문법 — 실무에서는 @ 를 씀
    JS의 addEventListener('click', ...) 와 동일한 역할
    HTML onclick 속성과 다른 점 : 함수 참조 or 인라인 표현식 모두 가능
  ──────────────────────────────── -->

  <!-- 인라인 표현식 — 간단한 동작은 바로 작성 -->
  <button @click="count++">클릭 수 : {{ count }}</button>

  <!-- 함수 호출 — 로직이 있으면 함수로 분리 -->
  <button @click="handleSubmit">제출</button>

  <!-- 인자 전달 -->
  <button @click="count += 10">+10</button>

  <!-- 이벤트 객체(e) 직접 받기 — 인자가 있을 때는 $event로 명시 -->
  <button @click="(e) => console.log(e.target)">이벤트 객체 확인</button>


  <!-- ────────────────────────────────
    @keyup
    키보드 키를 뗄 때 발생
    keydown(누를 때) / keypress(누르는 중, deprecated) / keyup(뗄 때) 중
    가장 많이 쓰는 게 keyup
  ──────────────────────────────── -->

  <input
    @keyup="lastKey = $event.key"
    placeholder="아무 키나 눌러보기"
  />
  <p>마지막으로 누른 키 : {{ lastKey }}</p>

  <!-- $event : Vue가 자동으로 넘겨주는 네이티브 이벤트 객체 -->
  <!-- $event.key 로 어떤 키를 눌렀는지 확인 가능 -->


  <!-- ────────────────────────────────
    @submit
    form 태그의 submit 이벤트에 사용
    버튼 클릭 or 입력창에서 Enter 키 누를 때 발생
    일반적으로 .prevent 와 세트로 씀 (아래 이벤트 수식어 예제에서 설명)
  ──────────────────────────────── -->

  <form @submit.prevent="handleSubmit">
    <!--
      @submit.prevent 에서 .prevent 는 이벤트 수식어
      form 기본 동작(페이지 새로고침) 을 막아줌
      JS의 e.preventDefault() 와 완전히 동일
    -->
    <input v-model="inputVal" placeholder="입력" />
    <button type="submit">제출</button>
  </form>

<\/template>`,
    highlighted: '',
  },
  {
    id: 'modifier',
    title: '이벤트수식어 .prevent .stop .self',
    code: `
    <script setup>
function goLink()    { console.log('링크 이동') }
function outerClick(){ console.log('outer 클릭') }
function innerClick(){ console.log('inner 클릭') }
function boxClick()  { console.log('box 클릭') }
<\/script>

<template>

  <!-- ────────────────────────────────
    .prevent
    e.preventDefault() 를 수식어로 대체
    브라우저 기본 동작을 막는 것
    기본 동작 예 : a 태그 클릭 → 페이지 이동 / form submit → 새로고침
  ──────────────────────────────── -->

  <!-- JS 방식 -->
  <a href="https://google.com" @click="(e) => { e.preventDefault(); goLink() }">
    JS 방식
  </a>

  <!-- Vue 수식어 방식 — 훨씬 깔끔 -->
  <a href="https://google.com" @click.prevent="goLink">
    Vue .prevent 방식
  </a>

  <form @submit.prevent="handleSubmit">
    <!-- .prevent 없으면 submit 시 페이지가 새로고침됨 -->
    <button type="submit">제출</button>
  </form>


  <!-- ────────────────────────────────
    .stop
    e.stopPropagation() 을 수식어로 대체
    이벤트 버블링을 막는 것

    이벤트 버블링 :
    자식 요소 클릭 → 자식 이벤트 실행 → 부모 이벤트도 같이 실행되는 현상
    .stop 을 쓰면 자식 이벤트만 실행되고 부모로 전파되지 않음
  ──────────────────────────────── -->

  <div @click="outerClick" style="padding: 20px; background: #eee">
    outer — 여기를 클릭하면 outerClick만 실행

    <button @click="innerClick">
      .stop 없음 — 클릭하면 innerClick + outerClick 둘 다 실행 (버블링)
    </button>

    <button @click.stop="innerClick">
      .stop 있음 — 클릭하면 innerClick만 실행, outerClick은 막힘
    </button>
  </div>


  <!-- ────────────────────────────────
    .self
    이벤트가 정확히 그 요소 자신에서 발생했을 때만 실행
    자식 요소를 클릭해서 버블링으로 올라온 이벤트는 무시함

    .stop 과 차이 :
    - .stop : 이벤트가 부모로 전파되는 걸 막음 (자식에서 차단)
    - .self : 부모 입장에서 본인이 직접 클릭됐을 때만 반응 (부모에서 필터링)
  ──────────────────────────────── -->

  <div @click.self="boxClick" style="padding: 20px; background: #ddd">
    이 div 자체를 클릭해야만 boxClick 실행
    <button>이 버튼을 클릭하면 버블링이 와도 boxClick은 실행 안 됨</button>
  </div>


  <!-- 수식어 체이닝 — 여러 개 동시에 사용 가능 -->
  <a href="https://google.com" @click.prevent.stop="goLink">
    이동 막고 + 버블링도 막고
  </a>

<\/template>`,
    highlighted: '',
  },
  {
    id: 'key',
    title: '키 수식어 .enter .esc',
    code: `
    <script setup>
import { ref } from 'vue'

const message  = ref('')
const messages = ref([])
const isModalOpen = ref(false)

function sendMessage() {
  if (!message.value.trim()) return
  messages.value.push(message.value)
  message.value = ''
}
<\/script>

<template>

  <!-- ────────────────────────────────
    키 수식어
    @keyup 에 특정 키를 지정해서 그 키를 뗄 때만 실행
    @keyup.enter = Enter 키를 뗄 때만 실행
    @keyup.esc   = ESC 키를 뗄 때만 실행

    수식어 없이 쓰면 아무 키나 눌러도 실행됨
    JS로 치면 if (e.key === 'Enter') 조건을 수식어로 대체하는 것
  ──────────────────────────────── -->

  <!-- JS 방식 -->
  <input
    @keyup="(e) => { if (e.key === 'Enter') sendMessage() }"
    placeholder="JS 방식"
  />

  <!-- Vue 키 수식어 방식 -->
  <input
    v-model="message"
    @keyup.enter="sendMessage"
    placeholder="Enter 키로 전송"
  />
  <!-- Enter 키를 뗄 때만 sendMessage 실행, 다른 키는 무시 -->

  <ul>
    <li v-for="(msg, i) in messages" :key="i">{{ msg }}</li>
  </ul>


  <!-- ────────────────────────────────
    .esc
    모달, 드롭다운, 검색창 등 ESC로 닫는 UI에 자주 씀
  ──────────────────────────────── -->

  <button @click="isModalOpen = true">모달 열기</button>

  <div v-show="isModalOpen">
    <!--
      tabindex="0" : div 같은 비입력 요소도 포커스 가능하게 함
      포커스가 없으면 키보드 이벤트를 받지 못함
      input, textarea는 원래 포커스 되니까 tabindex 불필요
    -->
    <div
      @keyup.esc="isModalOpen = false"
      tabindex="0"
      style="padding: 20px; border: 1px solid #ccc"
    >
      <p>모달 내용 — ESC 키로 닫기</p>
      <button @click="isModalOpen = false">닫기</button>
    </div>
  </div>


  <!-- .enter + .prevent 체이닝 — textarea에서 Enter 제출 시 줄바꿈 방지 -->
  <textarea
    v-model="message"
    @keyup.enter.prevent="sendMessage"
    placeholder="Enter로 전송 / Shift+Enter로 줄바꿈"
  ></textarea>
  <!--
    단, Shift+Enter 줄바꿈을 살리고 싶으면 .exact 수식어 추가
    @keyup.enter.exact : 다른 수식어 키(Shift, Ctrl 등) 없이 Enter만 눌렀을 때
  -->
  <textarea
    v-model="message"
    @keyup.enter.exact="sendMessage"
    placeholder="Enter만 → 전송 / Shift+Enter → 줄바꿈"
  ></textarea>


  <!-- 자주 쓰는 키 수식어 모음 참고용 -->
  <!--
    @keyup.enter   → Enter
    @keyup.esc     → ESC
    @keyup.tab     → Tab
    @keyup.delete  → Delete / Backspace 둘 다 해당
    @keyup.space   → Space
    @keyup.up      → 방향키 위
    @keyup.down    → 방향키 아래
    @keyup.left    → 방향키 왼쪽
    @keyup.right   → 방향키 오른쪽
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
  <div class="pageOutWrap eventPage">
    <div class="cl_subVisual"></div>
    <div class="cl_breadcrumb">HOME / 이벤트</div>
    <h1 class="cl_pageTitle">이벤트</h1>

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
