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
    id: 'props',
    title: 'props',
    code: `
<!-- ─────────────────────────────────────────
  부모 → 자식으로 데이터를 전달하는 방법
  React의 props와 동일한 개념
  자식은 받기만 할 수 있고 직접 수정 불가 (단방향 데이터 흐름)
───────────────────────────────────────── -->


<!-- 자식 컴포넌트 : UserCard.vue -->
<script setup>
// defineProps() : 이 컴포넌트가 받을 props를 선언
// 선언하지 않은 props는 받을 수 없음
const props = defineProps({
  name: {
    type: String,
    required: true,       // 필수값 — 부모가 안 넘기면 콘솔 경고
  },
  age: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    default: 'guest',     // 기본값 — 부모가 안 넘기면 이 값으로 대체
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  tags: {
    type: Array,
    default: () => [],    // 배열/객체의 기본값은 반드시 함수로 반환해야 함
  },
})

// template에서는 props.name 또는 그냥 name 으로 접근
// script 안에서는 props.name 으로 접근해야 함
<\/script>

<template>
  <div class="user-card">
    <h3>{{ name }}</h3>
    <!-- props.name 을 name 으로 바로 사용 -->
    <p>나이 : {{ age }}</p>
    <p>역할 : {{ role }}</p>

    <!-- boolean props 활용 -->
    <span v-if="isActive">활성 사용자</span>
    <span v-else>비활성</span>

    <!-- 배열 props 순회 -->
    <span v-for="tag in tags" :key="tag">{{ tag }}</span>
  </div>
  <\/template>

  <!-- ─────────────────────────────────────────
  부모 컴포넌트 : Parent.vue
───────────────────────────────────────── -->
  <script setup>
    import { ref } from 'vue'
    import UserCard from './UserCard.vue'

    const user = ref({
      name: '무아',
      age: 28,
      role: 'admin',
      tags: ['Vue', 'CSS', 'JS']
    })
    <\/script>

    <template>

      <!-- 정적 props — 그냥 문자열 전달 (콜론 없음) -->
      <UserCard name="무아" :age="28" />
      <!--
        name="무아"   → 문자열 리터럴 그대로 전달
        :age="28"    → 콜론 있으면 JS 표현식으로 평가 → 숫자 28 전달
        :age="'28'"  → 이렇게 쓰면 문자열 '28' 전달 (따옴표 안에 따옴표)

        콜론 없이 age="28" 쓰면 숫자가 아닌 문자열 "28" 이 전달됨 — 타입 주의
      -->

      <!-- 동적 props — 변수 바인딩 -->
      <UserCard
        :name="user.name"
        :age="user.age"
        :role="user.role"
        :is-active="true"
        :tags="user.tags"
      />
      <!--
        isActive 처럼 camelCase props는 부모에서 :is-active 케밥케이스로 전달
        Vue가 자동으로 변환해줌 — 둘 다 동작하지만 케밥케이스가 관례
      -->

      <!-- 객체 스프레드로 한 번에 전달 — 실무 패턴 -->
      <UserCard v-bind="user" />
      <!--
        v-bind에 객체를 통째로 넘기면 객체의 키가 props 이름으로 매핑됨
        위의 :name :age :role 개별 바인딩과 동일한 결과
        props가 많을수록 유용
      -->

    <\/template>`,
    highlighted: '',
  },
  {
    id: 'emit',
    title: 'emit',
    code: `
<!-- ─────────────────────────────────────────
  자식 → 부모로 이벤트를 올려보내는 방법
  React의 props로 콜백함수 내려주는 것과 동일한 개념
  단, Vue는 부모가 함수를 내려주는 게 아니라
  자식이 이벤트를 발생시키고 부모가 그걸 @이벤트명 으로 수신하는 구조
───────────────────────────────────────── -->


<!-- 자식 컴포넌트 : LoginForm.vue -->
<script setup>
import { ref } from 'vue'

const id       = ref('')
const password = ref('')

// defineEmits() : 이 컴포넌트가 발생시킬 이벤트를 선언
// 선언하면 타입 체크 및 자동완성 지원
const emit = defineEmits(['submit', 'cancel'])
//                         ↑ 이벤트 이름은 자유롭게 지정

function handleSubmit() {
  if (!id.value || !password.value) return

  // emit('이벤트명', 전달할데이터)
  // 두 번째 인자로 부모에게 넘길 데이터를 실어서 보냄
  emit('submit', { id: id.value, password: password.value })
  //               ↑ 부모가 수신할 데이터 — 객체, 문자열, 숫자 모두 가능
}

function handleCancel() {
  emit('cancel')
  // 데이터 없이 이벤트만 올릴 수도 있음
}
<\/script>

<template>
  <div class="login-form">
    <input v-model="id"       placeholder="아이디" />
    <input v-model="password" type="password" placeholder="비밀번호" />

    <button @click="handleSubmit">로그인</button>
    <button @click="handleCancel">취소</button>

    <!-- template에서 바로 emit 호출도 가능 -->
    <button @click="$emit('cancel')">취소 (인라인 방식)</button>
    <!--
      $emit : template에서 emit을 직접 쓸 때 사용
      script 안에서는 const emit = defineEmits() 로 받아서 emit()
      template 안에서는 $emit() 으로 바로 사용
    -->
  </div>
<\/template>


<!-- ─────────────────────────────────────────
  부모 컴포넌트 : Parent.vue
───────────────────────────────────────── -->
<script setup>
import LoginForm from './LoginForm.vue'

function onLoginSubmit(data) {
  // 자식이 emit('submit', { id, password }) 로 보낸 데이터를 받음
  console.log('로그인 시도 :', data.id, data.password)
  // 실제로는 여기서 API 호출
}

function onCancel() {
  console.log('로그인 취소됨')
}
<\/script>

<template>
  <LoginForm
    @submit="onLoginSubmit"
    @cancel="onCancel"
  />
  <!--
    @submit="onLoginSubmit"
    자식이 emit('submit', data) 했을 때 onLoginSubmit(data) 가 실행됨
    data 인자가 자동으로 함수에 전달됨

    React 비교 :
    React → <LoginForm onSubmit={onLoginSubmit} />  (props로 함수 내려줌)
    Vue   → <LoginForm @submit="onLoginSubmit" />   (이벤트로 수신)
  -->
<\/template>


<!-- ─────────────────────────────────────────
  emit 실전 패턴 — 모달 컴포넌트
───────────────────────────────────────── -->

<!-- Modal.vue -->
<script setup>
defineProps({ title: String })
const emit = defineEmits(['close', 'confirm'])
<\/script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <!--
      .self : 오버레이 자체를 클릭했을 때만 닫힘
      모달 내부 클릭은 버블링이 와도 .self 가 막아줌
    -->
    <div class="modal">
      <h2>{{ title }}</h2>
      <slot />  <!-- slot은 아래 예제에서 설명 -->

      <div class="modal-footer">
        <button @click="emit('close')">취소</button>
        <button @click="emit('confirm')">확인</button>
      </div>
    </div>
  </div>
<\/template>

<!-- Parent.vue 에서 사용 -->
<template>
  <Modal
    title="삭제 확인"
    @close="isModalOpen = false"
    @confirm="deleteItem"
  />
<\/template>`,
    highlighted: '',
  },
  {
    id: 'slot',
    title: 'slot',
    code: `
<!-- ─────────────────────────────────────────
  부모가 자식 컴포넌트의 내부 HTML을 직접 넣어주는 방법
  React의 children props와 동일한 개념
  컴포넌트를 껍데기(레이아웃)만 만들고 내용은 사용하는 곳에서 채워넣을 때 사용
───────────────────────────────────────── -->


<!-- 기본 slot -->

<!-- Card.vue -->
<template>
  <div class="card">
    <div class="card-body">
      <slot />
      <!--
        <slot /> 위치에 부모가 넣은 HTML이 들어옴
        아무것도 안 넣으면 아무것도 렌더링 안 됨
      -->
    </div>
  </div>
<\/template>

<!-- Parent.vue -->
<template>
  <Card>
    <h3>카드 제목</h3>
    <p>카드 내용입니다. 어떤 HTML이든 넣을 수 있어요.</p>
    <!-- 이 내용이 Card 컴포넌트의 <slot /> 위치에 들어감 -->
  </Card>

  <!-- 다른 내용으로 같은 Card 컴포넌트 재사용 -->
  <Card>
    <img src="thumbnail.jpg" alt="썸네일" />
    <button>자세히 보기</button>
  </Card>
  <!--
    레이아웃(카드 껍데기)은 같은 Card 컴포넌트를 재사용하면서
    내용만 다르게 넣을 수 있는 게 slot의 핵심
  -->
</template>


<!-- ─────────────────────────────────────────
  slot 기본값 (fallback content)
───────────────────────────────────────── -->

<!-- Button.vue -->
<template>
  <button class="btn">
    <slot>클릭</slot>
    <!--
      <slot>기본값</slot>
      부모가 아무것도 안 넣으면 '클릭' 이 표시됨
      부모가 내용을 넣으면 그걸로 대체됨
    -->
  </button>
<\/template>

<!-- Parent.vue -->
<template>
  <Button />                       <!-- 출력 : 클릭 (기본값) -->
  <Button>저장하기</Button>         <!-- 출력 : 저장하기 -->
  <Button>🗑 삭제</Button>          <!-- 출력 : 🗑 삭제 -->
<\/template>


<!-- ─────────────────────────────────────────
  named slot (이름 있는 슬롯)
  여러 위치에 각각 다른 내용을 넣어야 할 때
───────────────────────────────────────── -->

<!-- PageLayout.vue -->
<template>
  <div class="page">

    <header>
      <slot name="header" />
      <!--
        name="header" : 이름을 지정한 슬롯
        부모에서 #header 또는 v-slot:header 로 지정한 내용이 여기 들어옴
      -->
    </header>

    <main>
      <slot />
      <!--
        name 없는 슬롯 = 기본 슬롯 (default slot)
        부모에서 특별히 지정 안 한 내용이 여기 들어옴
      -->
    </main>

    <footer>
      <slot name="footer" />
    </footer>

  </div>
<\/template>

<!-- Parent.vue -->
<template>
  <PageLayout>

    <template #header>
      <!--
        #header = v-slot:header 의 단축 문법
        이 template 안의 내용이 name="header" 슬롯에 들어감
        <template> 자체는 DOM에 렌더링 안 됨
      -->
      <h1>페이지 제목</h1>
      <nav>네비게이션</nav>
    </template>

    <!-- #header, #footer 지정 안 한 내용은 기본 슬롯으로 들어감 -->
    <p>메인 본문 내용</p>
    <p>여러 줄도 가능</p>

    <template #footer>
      <p>Copyright 2025</p>
    </template>

  </PageLayout>
<\/template>


<!-- ─────────────────────────────────────────
  scoped slot (범위 있는 슬롯)
  자식의 데이터를 부모에게 올려줘서 부모가 렌더링 방식을 결정
  "데이터는 자식이 갖고 있고, 그걸 어떻게 표시할지는 부모가 결정"
───────────────────────────────────────── -->

<!-- List.vue -->
<script setup>
defineProps({ items: Array })
<\/script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot :item="item" :index="index" />
      <!--
        슬롯에 데이터를 props처럼 바인딩해서 부모로 올려줌
        부모는 이 item, index 를 받아서 원하는 방식으로 렌더링
      -->
    </li>
  </ul>
<\/template>

<!-- Parent.vue -->
<script setup>
const users = ref([
  { id: 1, name: '무아',  vip: true  },
  { id: 2, name: '지수',  vip: false },
  { id: 3, name: '현우',  vip: true  },
])
<\/script>

<template>

  <!-- v-slot="{ item }" 으로 자식이 올려준 데이터를 받음 -->
  <List :items="users" v-slot="{ item }">
    {{ item.name }}
    <span v-if="item.vip">⭐ VIP</span>
  </List>

  <!-- 같은 List 컴포넌트를 다른 방식으로 렌더링 -->
  <List :items="users" v-slot="{ item }">
    <strong>{{ item.name }}</strong>
    <img v-if="item.vip" src="crown.png" alt="VIP" />
  </List>

  <!--
    scoped slot의 핵심 :
    List 컴포넌트는 items 순회와 li 구조만 담당
    각 항목을 어떻게 표시할지는 부모가 자유롭게 결정
    같은 컴포넌트를 완전히 다른 UI로 재사용 가능
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
  <div class="pageOutWrap componentsPage">
    <div class="cl_subVisual"></div>
    <div class="cl_breadcrumb">HOME / 컴포넌트</div>
    <h1 class="cl_pageTitle">컴포넌트</h1>

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
