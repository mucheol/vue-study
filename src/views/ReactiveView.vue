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
    id: 'ref',
    title: 'ref',
    code: `
<script setup>
import { ref } from 'vue'

// ─────────────────────────────────────────
// ref()
// 원시값(문자열, 숫자, boolean)을 반응형으로 만드는 함수
// 값을 .value 프로퍼티로 감싼 객체를 반환
// .value 로 감싸는 이유 : JS는 원시값을 참조로 추적할 수 없어서
// 객체로 한 번 감싸야 Vue가 변화를 감지할 수 있음
// ─────────────────────────────────────────

const count   = ref(0)        // 숫자
const name    = ref('무아')    // 문자열
const isOpen  = ref(false)    // boolean
const items   = ref([])       // 배열도 ref 가능
const user    = ref(null)     // null 초기값도 가능

// script 안에서는 .value 로 접근 및 수정
console.log(count.value)      // 0
count.value++                 // 1
count.value = 100             // 100 으로 직접 대입도 가능
name.value = '지수'            // 문자열 교체

// 배열 수정
items.value.push('사과')       // push, pop, splice 등 배열 메서드 그대로 사용
items.value = ['바나나', '포도'] // 배열 자체를 교체도 가능

// 객체 수정
user.value = { id: 1, name: '무아' }     // null → 객체로 교체
user.value.name = '지수'                 // 내부 프로퍼티 수정도 반응형으로 감지

function increment() {
  count.value++
  // 이렇게 .value 를 수정하면 Vue가 변화를 감지하고 template을 자동으로 다시 렌더링
}

function reset() {
  count.value = 0
}
<\/script>

<template>
  <!--
    template 안에서는 .value 없이 바로 사용
    Vue가 자동으로 unwrap 해줌
    {{ count }}    → O
    {{ count.value }} → X (template 안에서는 이렇게 쓰지 않아도 됨)
  -->
  <p>{{ count }}</p>
  <p>{{ name }}</p>

  <button @click="increment">+1</button>
  <button @click="reset">초기화</button>

  <!-- ref 변수를 v-model 과 함께 사용 -->
  <input v-model="name" />
  <!-- input에 입력하면 name.value 가 자동으로 바뀜 -->

  <!-- boolean ref 활용 -->
  <div v-show="isOpen">열린 상태</div>
  <button @click="isOpen = !isOpen">토글</button>
  <!--
    template에서는 isOpen.value 가 아니라 isOpen 으로 쓰는 것 다시 확인
    isOpen = !isOpen 처럼 template 안에서 대입도 가능
  -->
<\/template>`,
    highlighted: '',
  },
  {
    id: 'reactive',
    title: 'reactive',
    code: `
<script setup>
import { ref, reactive } from 'vue'

// ─────────────────────────────────────────
// reactive()
// 객체를 반응형으로 만드는 함수
// ref() 와 다르게 .value 없이 직접 프로퍼티에 접근
// 객체, 배열, Map, Set 같은 참조형 타입에 사용
// 원시값(숫자, 문자열, boolean)에는 사용 불가
// ─────────────────────────────────────────

const user = reactive({
  name: '무아',
  age: 28,
  address: {
    city: '서울',
    district: '마포구'
  },
  skills: ['HTML', 'CSS', 'JS']
})

// script 안에서 .value 없이 바로 접근
console.log(user.name)        // '무아'
user.name = '지수'             // 직접 수정
user.age++
user.address.city = '부산'    // 중첩 객체도 반응형으로 감지
user.skills.push('Vue')       // 배열 메서드도 감지

// 프로퍼티 추가도 반응형으로 감지됨
user.email = 'mua@example.com'

// ─────────────────────────────────────────
// ref vs reactive 언제 뭘 쓰냐
//
// ref()      → 원시값 (숫자, 문자열, boolean)
//              하나의 독립된 값을 관리할 때
//              나중에 값 자체를 완전히 교체해야 할 때 (user.value = newUser)
//
// reactive() → 연관된 여러 상태를 하나의 객체로 묶을 때
//              폼 데이터처럼 관련 필드가 많을 때
//              .value 없이 쓰고 싶을 때
//
// 실무에서는 ref() 만 써도 됨 — reactive() 는 선택적 사용
// ─────────────────────────────────────────

// reactive 주의사항 : 객체 자체를 교체하면 반응성이 끊김
// user = { name: '새이름' }         // 이렇게 쓰면 안 됨 — 반응성 소멸
// Object.assign(user, { name: '새이름' })  // 이렇게 해야 함 — 프로퍼티만 교체

// 폼 데이터 관리에 reactive가 잘 맞는 패턴
const form = reactive({
  id: '',
  password: '',
  email: '',
  isAgree: false
})

function submitForm() {
  console.log(form.id, form.email)
  // ref 였다면 form.id.value, form.email.value 로 접근해야 함
  // reactive 는 form.id 로 바로 접근 — 폼처럼 필드가 많을 때 편리
}

function resetForm() {
  // Object.assign 으로 초기값으로 리셋
  Object.assign(form, { id: '', password: '', email: '', isAgree: false })
}
<\/script>

<template>
  <!--
    template 에서도 .value 없이 바로 사용
    ref 와 달리 unwrap 처리 없이 항상 직접 접근
  -->
  <p>{{ user.name }} — {{ user.age }}세</p>
  <p>{{ user.address.city }}</p>

  <button @click="user.age++">나이 +1</button>
  <button @click="user.address.city = '부산'">도시 변경</button>

  <!-- 폼 바인딩 -->
  <input v-model="form.id"       placeholder="아이디" />
  <input v-model="form.password" type="password" placeholder="비밀번호" />
  <input v-model="form.email"    placeholder="이메일" />
  <label>
    <input type="checkbox" v-model="form.isAgree" />
    동의
  </label>

  <button @click="submitForm">제출</button>
  <button @click="resetForm">초기화</button>
<\/template>`,
    highlighted: '',
  },
  {
    id: 'computed',
    title: 'computed',
    code: `
<script setup>
import { ref, computed } from 'vue'

// ─────────────────────────────────────────
// computed()
// 다른 반응형 데이터를 기반으로 계산된 값을 반환
// 의존하는 데이터가 바뀔 때만 재계산 — 그 외에는 캐시된 값 반환
//
// React의 useMemo 와 동일한 개념
// ─────────────────────────────────────────

const firstName = ref('무')
const lastName  = ref('아')
const price     = ref(10000)
const quantity  = ref(3)
const discount  = ref(10)  // 할인율 (%)

// 기본 computed — getter 만 있는 형태
const fullName = computed(() => {
  return lastName.value + ' ' + firstName.value
  // firstName 또는 lastName 이 바뀔 때만 재계산
  // 다른 데이터가 아무리 바뀌어도 이 두 값이 바뀌지 않으면 캐시 반환
})

const totalPrice = computed(() => {
  const discounted = price.value * (1 - discount.value / 100)
  return (discounted * quantity.value).toLocaleString() + '원'
})

// ─────────────────────────────────────────
// computed vs 일반 함수 — 왜 computed 를 쓰냐
//
// 일반 함수 : 호출될 때마다 매번 재실행
// computed  : 의존 데이터가 바뀔 때만 재계산, 나머지는 캐시 반환
//
// 아래 함수는 다른 데이터가 바뀌어도 렌더링될 때마다 실행됨
// function getFullName() { return lastName.value + firstName.value }
// ─────────────────────────────────────────

// 필터링/정렬도 computed 로 — 자주 쓰는 실무 패턴
const products = ref([
  { id: 1, name: '키보드',   price: 89000,  category: 'tech',      stock: 5  },
  { id: 2, name: '마우스',   price: 45000,  category: 'tech',      stock: 0  },
  { id: 3, name: '책상',     price: 350000, category: 'furniture', stock: 2  },
  { id: 4, name: '의자',     price: 280000, category: 'furniture', stock: 8  },
  { id: 5, name: 'USB 허브', price: 35000,  category: 'tech',      stock: 12 },
])

const selectedCategory = ref('all')
const searchQuery      = ref('')
const sortBy           = ref('price')

const filteredProducts = computed(() => {
  let result = products.value

  // 카테고리 필터
  if (selectedCategory.value !== 'all') {
    result = result.filter(function(p) { return p.category === selectedCategory.value })
  }
  // 검색어 필터
  if (searchQuery.value) {
    result = result.filter(function(p) { return p.name.includes(searchQuery.value) })
  }
  // 정렬 — 원본 배열 변경 방지를 위해 스프레드로 복사 후 sort
  return [...result].sort(function(a, b) {
    return sortBy.value === 'price' ? a.price - b.price : b.stock - a.stock
  })
  // selectedCategory, searchQuery, sortBy, products 중 하나라도 바뀌면 재계산
  // 그 외 다른 데이터가 바뀌어도 재계산 안 함 — 캐시 반환
})

const inStockCount = computed(function() {
  return products.value.filter(function(p) { return p.stock > 0 }).length
})

// ─────────────────────────────────────────
// computed writable — getter + setter
// computed 는 기본적으로 읽기 전용이지만
// get / set 을 모두 정의하면 쓰기도 가능
// ─────────────────────────────────────────

const fullNameWritable = computed({
  get() {
    return lastName.value + ' ' + firstName.value
  },
  set(newValue) {
    // fullNameWritable.value = '김 철수' 처럼 대입하면 이 set 이 실행됨
    const parts = newValue.split(' ')
    lastName.value  = parts[0]
    firstName.value = parts[1]
  }
})

function splitName() {
  fullNameWritable.value = '박 지수'
  // set 이 실행되어 lastName='박', firstName='지수' 로 분리됨
}
<\/script>

<template>
  <p>이름 : {{ fullName }}</p>
  <!-- computed 도 ref 처럼 .value 없이 template 에서 사용 -->

  <p>총 금액 : {{ totalPrice }}</p>

  <input v-model="firstName" placeholder="이름" />
  <input v-model="lastName"  placeholder="성" />
  <!-- 입력할 때마다 fullName computed 가 반응해서 바뀜 -->

  <div>
    <select v-model="selectedCategory">
      <option value="all">전체</option>
      <option value="tech">tech</option>
      <option value="furniture">furniture</option>
    </select>
    <input v-model="searchQuery" placeholder="검색" />
    <select v-model="sortBy">
      <option value="price">가격순</option>
      <option value="stock">재고순</option>
    </select>
  </div>

  <p>재고 있는 상품 : {{ inStockCount }}개</p>

  <ul>
    <li v-for="product in filteredProducts" :key="product.id">
      {{ product.name }} — {{ product.price.toLocaleString() }}원 (재고 {{ product.stock }})
    </li>
  </ul>

  <button @click="splitName">이름 분리 테스트</button>
<\/template>
`,
    highlighted: '',
  },
  {
    id: 'watch',
    title: 'watch',
    code: `
<script setup>
import { ref, reactive, watch, watchEffect } from 'vue'

// ─────────────────────────────────────────
// watch()
// 특정 반응형 데이터를 감시하다가 값이 바뀌면 콜백 실행
// computed 와 차이 :
//   computed → 값을 계산해서 반환 (선언적, 사이드이펙트 없어야 함)
//   watch    → 값이 바뀔 때 작업 실행 (API 호출, 로컬스토리지 저장 등)
//
// React 의 useEffect(..., [deps]) 와 동일한 개념
// ─────────────────────────────────────────

const count   = ref(0)
const keyword = ref('')
const userId  = ref(1)
const results = ref([])
const userData = ref(null)

// 기본 watch — ref 감시
watch(count, function(newValue, oldValue) {
  // 첫 번째 인자 : 감시할 대상 (ref 변수 — .value 없이 전달)
  // 두 번째 인자 : 변화 감지 시 실행할 콜백
  // newValue : 바뀐 후 값 / oldValue : 바뀌기 전 값
  console.log('count 변경 :' + oldValue + ' → ' + newValue)
})


// ─────────────────────────────────────────
// 검색어 감시 — debounce 패턴
// keyword 가 바뀔 때마다 API 호출하면 너무 많은 요청 발생
// watch + setTimeout 으로 마지막 입력 후 500ms 뒤에만 호출
// ─────────────────────────────────────────

let timer = null

watch(keyword, function(newKeyword) {
  clearTimeout(timer)  // 이전 타이머 취소
  timer = setTimeout(function() {
    if (!newKeyword.trim()) {
      results.value = []
      return
    }
    fetchSearchResults(newKeyword)  // 500ms 후 실행
  }, 500)
})

async function fetchSearchResults(q) {
  const res = await fetch('/api/search?q=' + q)
  results.value = await res.json()
}


// ─────────────────────────────────────────
// immediate : true — 처음 마운트될 때도 즉시 실행
// React의 useEffect 에서 처음에도 실행되는 것과 같음
// ─────────────────────────────────────────

watch(userId, async function(newId) {
  const res = await fetch('/api/users/' + newId)
  userData.value = await res.json()
}, { immediate: true })
//    ↑ 컴포넌트 마운트 시 userId 의 현재값으로 즉시 한 번 실행
//    API 호출로 초기 데이터 불러올 때 자주 쓰는 패턴


// ─────────────────────────────────────────
// 여러 값 동시 감시 — 배열로 전달
// ─────────────────────────────────────────

const page     = ref(1)
const pageSize = ref(10)
const filter   = ref('all')

watch([page, pageSize, filter], function(newValues, oldValues) {
  // 세 값 중 하나라도 바뀌면 실행
  // newValues, oldValues 도 배열로 받음
  var newPage   = newValues[0]
  var newSize   = newValues[1]
  var newFilter = newValues[2]
  console.log('페이지 : ' + newPage + ', 사이즈 : ' + newSize + ', 필터 : ' + newFilter)
  fetchList()
})

function fetchList() {
  // 실제로는 여기서 API 호출
}


// ─────────────────────────────────────────
// deep : true — 객체 내부 변화까지 감시
// 기본 watch 는 참조(주소)가 바뀔 때만 감지
// 내부 프로퍼티 변화를 감지하려면 deep: true 옵션 필요
// ─────────────────────────────────────────

const form = reactive({
  title: '',
  content: '',
  category: 'vue'
})

watch(form, function(newForm) {
  // form 객체 내부 어느 프로퍼티가 바뀌어도 실행됨
  // reactive 객체를 직접 감시할 때는 deep 이 자동 적용
  localStorage.setItem('draft', JSON.stringify(newForm))
  // 입력할 때마다 임시저장
})

// ref 로 만든 객체를 deep 감시할 때는 명시적으로 deep: true 필요
const settings = ref({ theme: 'light', lang: 'ko', fontSize: 14 })

watch(settings, function(newSettings) {
  applySettings(newSettings)
}, { deep: true })
//    ↑ ref 로 감싼 객체는 deep: true 명시해야 내부 변화 감지


// ─────────────────────────────────────────
// 특정 프로퍼티만 감시 — getter 함수로 전달
// deep: true 는 전체 객체를 감시해서 불필요한 실행이 많아질 수 있음
// 특정 필드만 감시하고 싶으면 () => 값 형태로 전달
// ─────────────────────────────────────────

const user = reactive({ name: '무아', age: 28, role: 'admin' })

watch(
  function() { return user.role },   // role 프로퍼티만 감시
  function(newRole, oldRole) {
    console.log('권한 변경 : ' + oldRole + ' → ' + newRole)
    updatePermissions(newRole)
  }
)
// user.name 이나 user.age 가 바뀌어도 실행되지 않음

function updatePermissions(role) {
  // 권한에 따른 처리
}

function applySettings(s) {
  // 설정 적용
}


// ─────────────────────────────────────────
// watchEffect
// 감시 대상을 명시하지 않고 콜백 안에서 사용된 반응형 데이터를 자동 추적
// 즉시 실행 (immediate: true 기본)
// 단순한 경우에 watch 보다 코드가 짧아짐
// ─────────────────────────────────────────

watchEffect(function() {
  // 이 콜백 안에서 읽힌 반응형 데이터를 자동으로 추적
  // keyword 또는 page 가 바뀌면 자동으로 다시 실행
  console.log('검색어 : ' + keyword.value + ', 페이지 : ' + page.value)
  fetchList()
})

// watch vs watchEffect 선택 기준 :
//   watch       → 이전값(oldValue) 이 필요할 때
//                 특정 조건에서만 실행하고 싶을 때
//                 처음에는 실행 안 해도 될 때
//   watchEffect → 여러 값을 쓰고 즉시 실행이 필요할 때
//                 감시 대상을 명시하기 번거로울 때
<\/script>

<template>
  <input v-model="keyword" placeholder="검색어 입력" />
  <ul>
    <li v-for="item in results" :key="item.id">{{ item.name }}</li>
  </ul>

  <button @click="count++">카운트 : {{ count }}</button>

  <select v-model="filter">
    <option value="all">전체</option>
    <option value="vue">Vue</option>
    <option value="react">React</option>
  </select>

  <input v-model="form.title"   placeholder="제목" />
  <textarea v-model="form.content" placeholder="내용"></textarea>
<\/template>
`,
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
  <div class="pageOutWrap reactivePage">
    <div class="cl_subVisual"></div>
    <div class="cl_breadcrumb">HOME / 반응형 & 상태</div>
    <h1 class="cl_pageTitle">반응형 & 상태</h1>

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
