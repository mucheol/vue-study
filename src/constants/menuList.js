const menuList = [
  { to: '/', name: 'home', label: '홈' },
  {
    to: '/data-binding',
    name: 'dataBinding',
    label: '데이터바인딩',
    children: [
      { id: 'text', label: '텍스트 출력' },
      { id: 'attribute', label: '속성 바인딩' },
      { id: 'class', label: '클래스 바인딩' },
      { id: 'style', label: '스타일 바인딩' },
    ],
  },
  {
    to: '/condition',
    name: 'condition',
    label: '조건부 & 반복',
    children: [
      { id: 'if', label: 'v-if / v-else-if / v-else' },
      { id: 'show', label: 'v-show' },
      { id: 'for', label: 'v-for(배열, 객체, 숫자)' },
    ],
  },
  {
    to: '/event',
    name: 'event',
    label: '이벤트',
    children: [
      { id: 'click', label: '@click @keyup @submit' },
      { id: 'modifier', label: '이벤트수식어 .prevent .stop .self' },
      { id: 'key', label: '키 수식어 .enter .esc' },
    ],
  },
  {
    to: '/form',
    name: 'form',
    label: '폼',
    children: [
      { id: 'model', label: 'v-model (input, textarea, select)' },
      { id: 'modifiers', label: 'v-model 수식어 .trim .number .lazy' },
      { id: 'checkbox-radio', label: '체크박스, 라디오' },
    ],
  },
  {
    to: '/components',
    name: 'components',
    label: '컴포넌트',
    children: [
      { id: 'props', label: 'props' },
      { id: 'emit', label: 'emit' },
      { id: 'slot', label: 'slot' },
    ],
  },
  {
    to: '/reactive',
    name: 'reactive',
    label: '반응형 & 상태',
    children: [
      { id: 'ref', label: 'ref' },
      { id: 'reactive', label: 'reactive' },
      { id: 'computed', label: 'computed' },
      { id: 'watch', label: 'watch' },
    ],
  },
  {
    to: '/pattern',
    name: 'pattern',
    label: '실전패턴',
    children: [
      { id: 'lifecycle', label: '라이프사이클' },
      { id: 'template-ref', label: 'template ref (Swiper, GSAP)' },
      { id: 'transition', label: 'Transition 애니메이션' },
      { id: 'dynamic-components', label: '동적 컴포넌트' },
    ],
  },
  {
    to: '/proto',
    name: 'proto',
    label: '이것저것',
  },
]

export { menuList }
