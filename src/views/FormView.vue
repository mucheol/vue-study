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
    id: 'model',
    title: 'v-model (input, textarea, select)',
    code: `
<script setup>
import { ref } from 'vue'

const username = ref('')
const bio      = ref('')
const country  = ref('')
<\/script>

<template>
  <!-- ────────────────────────────────
    v-model
    입력 요소의 값과 ref 변수를 양방향으로 동기화
    사용자가 입력하면 변수가 바뀌고, 변수가 바뀌면 입력창도 바뀜

    JS로 치면 이 두 줄을 합친 것 :
      input.addEventListener('input', e => username.value = e.target.value)
      input.value = username.value

    React와 비교 :
      React → value={username} onChange={e => setUsername(e.target.value)} 두 개 필요
      Vue   → v-model="username" 하나로 끝
  ──────────────────────────────── -->

  <!-- input 텍스트 -->
  <input v-model="username" type="text" placeholder="이름 입력" />
  <p>입력값 : {{ username }}</p>
  <!-- 타이핑할 때마다 아래 p 태그가 실시간으로 바뀌는 걸 확인 -->

  <!-- input number -->
  <input v-model="age" type="number" placeholder="나이 입력" />
  <!--
    type="number" 여도 v-model 기본값은 문자열로 받음
    숫자로 받고 싶으면 v-model.number 수식어 사용 (아래 수식어 예제에서 설명)
  -->

  <!-- input password -->
  <input v-model="password" type="password" placeholder="비밀번호" />
  <!-- type만 바뀔 뿐 v-model 동작은 동일 -->

  <!-- ────────────────────────────────
    textarea
    여러 줄 입력도 v-model 동일하게 사용
    HTML textarea는 <textarea>내용</textarea> 형태지만
    Vue에서는 value 속성처럼 v-model로 바인딩
    <textarea>{{ bio }}</textarea> 이렇게 쓰면 안 됨 — v-model 써야 함
  ──────────────────────────────── -->

  <textarea v-model="bio" rows="4" placeholder="자기소개 입력"></textarea>
  <p>글자 수 : {{ bio.length }}</p>
  <!-- bio.length : ref 변수는 template에서 .value 없이 바로 속성 접근 가능 -->

  <!-- ────────────────────────────────
    select
    선택한 option의 value 값이 변수에 바인딩됨
    초기값을 '' (빈 문자열) 로 설정하면 placeholder 역할의 option 선택된 상태로 시작
  ──────────────────────────────── -->

  <select v-model="country">
    <option value="" disabled>국가 선택</option>
    <option value="kr">한국</option>
    <option value="us">미국</option>
    <option value="jp">일본</option>
  </select>
  <p>선택한 국가 코드 : {{ country }}</p>
  <!--
    disabled 옵션 : 선택은 안 되고 placeholder처럼 보이기만 함
    value="" 와 세트로 써야 초기 상태에서 이 옵션이 보임
  -->

  <!-- select 다중 선택 — multiple 속성 추가 -->
  <select v-model="selectedSkills" multiple>
    <option value="html">HTML</option>
    <option value="css">CSS</option>
    <option value="js">JavaScript</option>
    <option value="vue">Vue</option>
  </select>
  <!--
    multiple 이면 변수는 배열로 받아야 함
    const selectedSkills = ref([])
    Ctrl/Cmd 클릭으로 다중 선택 가능
  -->

  <!-- option을 v-for로 동적 생성 — 실무 패턴 -->
  <script setup>
      const options = ref([
        { value: 'kr', label: '한국' },
        { value: 'us', label: '미국' },
        { value: 'jp', label: '일본' },
      ])
      <\/script>

      <select v-model="country">
        <option value="" disabled>국가 선택</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
        <!--
          :value="opt.value" — 콜론 있음 주의
          :value 없이 value="opt.value" 쓰면 문자열 "opt.value" 가 그대로 들어감
        -->
      </select>

    <\/template>`,
    highlighted: '',
  },
  {
    id: 'modifiers',
    title: 'v-model 수식어 .trim .number .lazy',
    code: `
<script setup>
  import { ref } from 'vue'

  const username = ref('')
  const age      = ref(null)
  const comment  = ref('')
<\/script>

<template>

  <!-- ────────────────────────────────
    .trim
    입력값 앞뒤 공백을 자동으로 제거
    JS의 str.trim() 을 자동으로 적용하는 것
    로그인 폼에서 사용자가 실수로 공백을 앞뒤에 넣는 걸 방지할 때 유용
  ──────────────────────────────── -->

  <input v-model.trim="username" placeholder="앞뒤 공백 자동 제거" />
  <p>"{{ username }}"</p>
  <!-- 앞뒤에 공백 넣고 타이핑해보면 양쪽 따옴표 사이에 공백이 없는 걸 확인 -->


  <!-- ────────────────────────────────
    .number
    입력값을 자동으로 숫자 타입으로 변환
    v-model 기본값은 항상 문자열로 받음
    type="number" 여도 마찬가지 — v-model.number 써야 진짜 숫자

    숫자 타입이 중요한 이유 :
    '10' + 5 = '105'  (문자열 연결)
     10  + 5 = 15     (숫자 연산)
    계산이 필요한 입력값에는 항상 .number 사용
  ──────────────────────────────── -->

  <input v-model="age"        type="number" placeholder=".number 없음" />
  <input v-model.number="age" type="number" placeholder=".number 있음" />

  <p>타입 확인 : {{ typeof age }}</p>
  <!-- .number 없으면 'string' / .number 있으면 'number' 로 출력됨 -->

  <!-- 숫자가 아닌 값을 입력하면 NaN 반환 — 유효성 검사와 함께 써야 함 -->


  <!-- ────────────────────────────────
    .lazy
    기본 v-model은 input 이벤트 기준 → 타이핑할 때마다 즉시 동기화
    .lazy 는 change 이벤트 기준 → 입력창에서 포커스가 벗어날 때 동기화

    언제 쓰냐면 :
    → 타이핑할 때마다 API 호출이 일어나는 검색창 (너무 많은 요청 방지)
    → 실시간 반응이 필요 없고 최종 입력값만 필요한 폼 필드
    → 성능 최적화가 필요한 복잡한 폼

    React와 비교 :
    React에서 같은 효과를 내려면 onBlur 이벤트를 따로 처리해야 함
  ──────────────────────────────── -->

  <input v-model="comment"       placeholder="일반 v-model — 타이핑마다 반응" />
  <input v-model.lazy="comment"  placeholder=".lazy — 포커스 벗어날 때 반응" />

  <p>{{ comment }}</p>
  <!-- 두 input에 같은 값 입력해보면 동기화 타이밍 차이를 체감할 수 있음 -->


  <!-- 수식어 조합 — 여러 개 동시에 사용 가능 -->
  <input
    v-model.trim.number="age"
    type="number"
    placeholder="공백 제거 + 숫자 변환"
  />

  <input
    v-model.trim.lazy="username"
    placeholder="공백 제거 + 포커스 벗어날 때 동기화"
  />

<\/template>`,
    highlighted: '',
  },
  {
    id: 'checkbox-radio',
    title: '체크박스, 라디오',
    code: `
<script setup>
  import { ref } from 'vue'

  // 단일 체크박스 → boolean
  const isAgree = ref(false)

  // 다중 체크박스 → 배열 (체크된 항목의 value가 배열에 추가/제거됨)
  const selectedSkills = ref([])

  // 라디오 → 선택된 하나의 value 값
  const gender = ref('')
  const plan   = ref('free')  // 초기값 설정 가능

  const skills = [
    { value: 'html', label: 'HTML' },
    { value: 'css',  label: 'CSS'  },
    { value: 'js',   label: 'JavaScript' },
    { value: 'vue',  label: 'Vue'  },
  ]
<\/script>

<template>

  <!-- ────────────────────────────────
    체크박스 — 단일
    변수가 boolean 타입일 때
    체크 → true / 해제 → false 로 자동 변환
  ──────────────────────────────── -->

  <label>
    <input type="checkbox" v-model="isAgree" />
    이용약관에 동의합니다
  </label>
  <p>동의 여부 : {{ isAgree }}</p>

  <!-- true-value / false-value : true/false 대신 다른 값으로 바인딩 -->
  <input
    type="checkbox"
    v-model="status"
    true-value="active"
    false-value="inactive"
  />
  <!--
    const status = ref('inactive')
    체크하면 'active' / 해제하면 'inactive' 가 바인딩됨
    DB에 boolean 대신 문자열로 저장할 때 유용
  -->


  <!-- ────────────────────────────────
    체크박스 — 다중
    변수가 배열일 때 여러 개의 체크박스를 하나의 배열로 관리
    체크하면 해당 value가 배열에 push
    해제하면 해당 value가 배열에서 제거
    Vue가 자동으로 배열 추가/제거를 처리해줌

    React와 비교 :
    React는 checked 상태와 onChange �핸들러를 직접 구현해야 함
    includes()로 체크 여부 확인, filter()로 제거하는 로직을 수동으로 작성
    Vue는 같은 ref 배열을 v-model로 연결만 하면 끝
  ──────────────────────────────── -->

  <div v-for="skill in skills" :key="skill.value">
    <label>
      <input
        type="checkbox"
        v-model="selectedSkills"
        :value="skill.value"
      />
      <!--
        :value 로 각 체크박스의 값을 지정
        v-model 이 같은 배열(selectedSkills)을 바라보고 있어서
        체크 시 이 value 가 배열에 들어가고, 해제 시 빠짐
      -->
      {{ skill.label }}
    </label>
  </div>

  <p>선택된 스킬 : {{ selectedSkills }}</p>
  <!-- 출력 예 : ['html', 'css', 'vue'] -->

  <!-- 전체 선택 / 해제 패턴 -->
  <label>
    <input
      type="checkbox"
      :checked="selectedSkills.length === skills.length"
      @change="e => selectedSkills = e.target.checked
        ? skills.map(s => s.value)
        : []"
    />
    전체 선택
  </label>
  <!--
    전체 선택은 v-model 대신 :checked + @change 조합으로 처리
    배열 전체를 교체하는 동작이라 v-model 단순 바인딩으로는 처리가 어려움
  -->


  <!-- ────────────────────────────────
    라디오
    같은 v-model 변수를 바라보는 라디오 버튼들 중 하나만 선택 가능
    선택된 라디오의 :value 값이 변수에 바인딩됨

    HTML 기본 radio와 다른 점 :
    기본 radio는 name 속성으로 그룹을 묶음
    Vue에서는 같은 v-model 변수로 그룹이 자동으로 묶임 — name 불필요
  ──────────────────────────────── -->

  <label>
    <input type="radio" v-model="gender" value="male" />
    남성
  </label>
  <label>
    <input type="radio" v-model="gender" value="female" />
    여성
  </label>
  <label>
    <input type="radio" v-model="gender" value="none" />
    선택 안 함
  </label>
  <p>선택된 성별 : {{ gender }}</p>


  <!-- 초기값 설정 — 기본 선택 상태 만들기 -->
  <!-- const plan = ref('free') 로 초기값 지정하면 'free' 라디오가 선택된 상태로 시작 -->
  <label>
    <input type="radio" v-model="plan" value="free" />
    무료 플랜
  </label>
  <label>
    <input type="radio" v-model="plan" value="pro" />
    프로 플랜
  </label>
  <label>
    <input type="radio" v-model="plan" value="enterprise" />
    엔터프라이즈
  </label>
  <p>선택된 플랜 : {{ plan }}</p>


  <!-- 라디오도 v-for로 동적 생성 가능 — 실무 패턴 -->
  <div
    v-for="option in ['무료', '베이직', '프리미엄']"
    :key="option"
  >
    <label>
      <input type="radio" v-model="plan" :value="option" />
      {{ option }}
    </label>
  </div>

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
  <div class="pageOutWrap formPage">
    <div class="cl_subVisual"></div>
    <div class="cl_breadcrumb">HOME / 폼</div>
    <h1 class="cl_pageTitle">폼</h1>

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
