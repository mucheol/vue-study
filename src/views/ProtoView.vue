<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import TiltCardSection from '@/components/sections/proto/TiltCardSection.vue'

// ===== 지하철 실시간 노선도 =====
const LINES = [
  {
    id: '1002',
    name: '2호선',
    color: '#3DBE3D',
    // API 쿼리 기준역 (호선당 1회만 호출 → 일일 쿼터 절약)
    refStation: { name: '영등포구청', idx: 3 },
    stations: [
      { name: '홍대입구', x: 812, y: 36 },
      { name: '합정', x: 720, y: 80, hideLabel: true },
      { name: '당산', x: 628, y: 124 },
      { name: '영등포구청', x: 536, y: 168 },
      { name: '문래', x: 444, y: 212 },
      { name: '신도림', x: 352, y: 256 },
      { name: '대림', x: 260, y: 300 },
      { name: '구로디지털단지', x: 168, y: 344 },
    ],
    rightwardKeyword: '외선',
    segmentSec: 110,
    trainOffset: { 1: '20%', '-1': '-40%' }, // 외선(구로방향)→선로 아래, 내선(홍대방향)→선로 위
  },
  {
    id: '1006',
    name: '6호선',
    color: '#CD7C2F',
    refStation: { name: '마포구청', idx: 6 },
    flipLabels: true,
    stations: [
      { name: '구산', x: 80, y: 80 },
      { name: '응암', x: 160, y: 80 },
      { name: '새절', x: 240, y: 80 },
      { name: '증산', x: 320, y: 80 },
      { name: '디지털미디어시티', x: 400, y: 80 },
      { name: '월드컵경기장', x: 480, y: 80 },
      { name: '마포구청', x: 560, y: 80 },
      { name: '망원', x: 640, y: 80 },
      { name: '합정', x: 720, y: 80 },
      { name: '상수', x: 800, y: 80 },
    ],
    rightwardKeyword: '하',
    segmentSec: 130,
    trainOffset: { 1: '-80%', '-1': '10%' }, // 하행(상수방향)→선로 아래, 상행(구산방향)→선로 위
  },
  {
    id: '1007',
    name: '7호선',
    color: '#747F00',
    refStation: { name: '남구로', idx: 2 },
    flipLabels: true,
    stations: [
      { name: '신풍', x: 180, y: 300 },
      { name: '대림', x: 260, y: 300, hideLabel: true },
      { name: '남구로', x: 340, y: 300 },
      { name: '가산디지털단지', x: 420, y: 300 },
      { name: '철산', x: 500, y: 300 },
    ],
    rightwardKeyword: '하',
    segmentSec: 130,
    trainOffset: { 1: '-50%', '-1': '40%' }, // 하행(철산방향)→선로 위, 상행(신풍방향)→선로 아래
  },
]

const lineTrainsMap = ref({})
const nextRefreshIn = ref(120)
let subwayFetchTimer = null
let clockTimer = null

function trainPos(train, line) {
  const segmentsAway = train.barvlDt / line.segmentSec // 역 사이 구간 단위 거리 계산
  let pos =
    train.direction === 1
      ? train.baseStationIdx - segmentsAway
      : train.baseStationIdx + segmentsAway // 방향에 따라 위치 계산
  pos = Math.max(0, Math.min(line.stations.length - 1, pos)) // 선로 끝 도달 후에도 같은 위치에 머무르도록 처리
  const i = Math.floor(pos) // 현재 역 인덱스
  const t = pos - i // 역 사이 비율
  const s1 = line.stations[Math.min(i, line.stations.length - 1)] // 선로 끝 도달 후에도 같은 위치에 머무르도록 처리
  const s2 = line.stations[Math.min(i + 1, line.stations.length - 1)] // 선로 끝 도달 후에도 같은 위치에 머무르도록 처리
  return { x: s1.x + (s2.x - s1.x) * t, y: s1.y + (s2.y - s1.y) * t } // 역 사이 간격이 일정하다고 가정
}

function trainAngle(train, line) {
  const segmentsAway = train.barvlDt / line.segmentSec
  let pos =
    train.direction === 1
      ? train.baseStationIdx - segmentsAway
      : train.baseStationIdx + segmentsAway
  pos = Math.max(0, Math.min(line.stations.length - 1, pos)) // 선로 끝 도달 후에도 같은 위치에 머무르도록 처리
  const i = Math.min(Math.floor(pos), line.stations.length - 2) // 마지막 역에서는 이전 역과의 각도로 고정
  const s1 = line.stations[i]
  const s2 = line.stations[i + 1]
  let angle = Math.atan2(s2.y - s1.y, s2.x - s1.x) * (180 / Math.PI)
  if (train.direction === -1) angle += 180 // 반대 방향은 180도 회전
  return angle
}

async function fetchAllLines() {
  const key = import.meta.env.VITE_SUBWAY_API_KEY
  const newMap = {}

  await Promise.all(
    LINES.map(async (line) => {
      // 호선당 기준역 1개만 쿼리 (3회/갱신 → 하루 864회, 1000건 이내)
      const data = await fetch(
        `/subway-api/api/subway/${key}/json/realtimeStationArrival/0/10/${encodeURIComponent(line.refStation.name)}`,
      )
        .then((r) => r.json())
        .catch((err) => {
          console.error(`[subway] fetch 실패 (${line.name} ${line.refStation.name})`, err)
          return { realtimeArrivalList: [] }
        })

      if (data.errorMessage && data.errorMessage.status !== 200) {
        console.warn(`[subway] API 오류 (${line.name}):`, data.errorMessage)
      }

      // 해당 호선 열차만 필터링 (기준역에 다른 호선 열차 정보도 섞여 있을 수 있음)
      const arrivals = (data.realtimeArrivalList || []).filter(
        (a) => String(a.subwayId) === line.id,
      )

      // 각 도착 정보를 그대로 열차 1대로 변환 (기준역 1개 쿼리라 중복 없음)
      newMap[line.id] = arrivals.map((a, i) => {
        const barvlDt = Math.max(0, parseInt(a.barvlDt) || 0)
        const goingRight = a.updnLine.includes(line.rightwardKeyword)
        return {
          id: `${line.id}-${i}`,
          baseStationIdx: line.refStation.idx,
          barvlDt,
          direction: goingRight ? 1 : -1,
          destination: a.trainLineNm,
          arvlMsg: a.arvlMsg2,
        }
      })
    }),
  )

  lineTrainsMap.value = newMap
  nextRefreshIn.value = 120
}

// ===== 배경 애니메이션 =====
const scrollY = ref(0)
const mouseX = ref(0)
const mouseY = ref(0)
const cursorX = ref(0)
const cursorY = ref(0)
const time = ref(0)
let rafId = null
let lastRafTime = null
let prevMx = 0
let prevMy = 0

function animate(timestamp) {
  // delta: 이전 프레임과의 경과 시간(초). 탭 전환 등으로 큰 점프가 생기면 0으로 처리
  const delta = lastRafTime != null ? Math.min((timestamp - lastRafTime) / 1000, 0.5) : 0
  lastRafTime = timestamp

  // 열차 위치 60fps 갱신 (barvlDt를 실수로 감소 → 부드러운 이동)
  if (delta > 0) {
    nextRefreshIn.value = Math.max(0, nextRefreshIn.value - delta)
    Object.values(lineTrainsMap.value).forEach((trains) => {
      trains.forEach((t) => {
        if (t.barvlDt > 0) t.barvlDt = Math.max(0, t.barvlDt - delta)
      })
    })
  }

  time.value = timestamp / 1000
  cursorX.value += (mouseX.value - cursorX.value) * 0.1
  cursorY.value += (mouseY.value - cursorY.value) * 0.1

  /* 도망버튼 flee 로직 */
  if (escapeSectionEl.value) {
    // 초기 렌더 시점에는 ref가 아직 바인딩되지 않았으므로 체크 필요
    const rect = escapeSectionEl.value.getBoundingClientRect() // 컨테이너 위치/크기
    const mx = mouseX.value - rect.left // 마우스 위치 (컨테이너 기준)
    const my = mouseY.value - rect.top // 마우스 위치 (컨테이너 기준)

    const velX = mx - prevMx // 마우스 이동 속도 (이전 프레임 대비 이동량)
    const velY = my - prevMy
    prevMx = mx // 다음 프레임 비교를 위해 현재 위치 저장
    prevMy = my

    const LOOKAHEAD = 5 // 예측 프레임 수 (클수록 더 일찍 반응)
    const predictX = mx + velX * LOOKAHEAD // 현재 속도로 N프레임 후 마우스 예측 위치
    const predictY = my + velY * LOOKAHEAD

    const dx = predictX - btnX.value // 예측 위치 기준으로 거리/방향 계산
    const dy = predictY - btnY.value
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < FLEE_RADIUS && dist > 0) {
      // 감지반경 안에 마우스 들어오면 도망
      const nx = -(dx / dist) // 버튼과 마우스 사이의 단위 벡터 (도망 방향)
      const ny = -(dy / dist)
      const speed = FLEE_FORCE * (1 - dist / FLEE_RADIUS) // 마우스가 가까울수록 더 빠르게 도망
      btnX.value += nx * speed
      btnY.value += ny * speed

      // 경계 클램핑
      if (escapeButtonEl.value) {
        const bRect = escapeButtonEl.value.getBoundingClientRect() // 버튼 크기
        const hw = bRect.width / 2 // 버튼의 절반 너비
        const hh = bRect.height / 2 // 버튼의 절반 높이

        // 벽 반발력
        const dLeft = btnX.value - hw
        const dRight = rect.width - (btnX.value + hw)
        const dTop = btnY.value - hh
        const dBottom = rect.height - (btnY.value + hh)

        if (dLeft < WALL_ZONE) btnX.value += (1 - dLeft / WALL_ZONE) * WALL_PUSH
        if (dRight < WALL_ZONE) btnX.value -= (1 - dRight / WALL_ZONE) * WALL_PUSH
        if (dTop < WALL_ZONE) btnY.value += (1 - dTop / WALL_ZONE) * WALL_PUSH
        if (dBottom < WALL_ZONE) btnY.value -= (1 - dBottom / WALL_ZONE) * WALL_PUSH

        btnX.value = Math.max(hw, Math.min(rect.width - hw, btnX.value)) // 버튼이 컨테이너 밖으로 나가지 않도록 클램핑
        btnY.value = Math.max(hh, Math.min(rect.height - hh, btnY.value))
      }
    }
  }
  // btnX, btnY는 즉시 이동하지만 renderX, renderY는 SPRING 계수로 부드럽게 따라감 → 자연스러운 관성 효과
  const SPRING = 0.14
  renderX.value += (btnX.value - renderX.value) * SPRING
  renderY.value += (btnY.value - renderY.value) * SPRING
  rafId = requestAnimationFrame(animate)
}

const shapeMap = {
  circle: '50%',
  square: '6px',
  blob1: '40% 60% 70% 30% / 50% 40% 60% 50%',
  blob2: '60% 40% 30% 70% / 50% 60% 40% 50%',
  pill: '100px',
}
const shapeKeys = Object.keys(shapeMap)

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}
function createObj() {
  const shape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)]
  return {
    id: Date.now() + Math.random(),
    size: randomBetween(120, 500),
    color: `hsl(${randomBetween(0, 360)}, 65%, 60%)`,
    top: randomBetween(0, 95),
    left: randomBetween(-8, 88),
    opacity: randomBetween(0.06, 0.18),
    speedY: randomBetween(-1.0, 1.1),
    speedX: randomBetween(-1.2, 1.2),
    phase: randomBetween(0, Math.PI * 2),
    freq: randomBetween(1.2, 1.6),
    amplitude: randomBetween(20, 60),
    borderRadius: shapeMap[shape],
  }
}

const objects = ref(Array.from({ length: 15 }, createObj))
const lastSpawnY = ref(0)
watch(scrollY, (val) => {
  if (val - lastSpawnY.value > 500) {
    for (let i = 0; i < 3; i++) objects.value.push(createObj())
    if (objects.value.length > 60) objects.value.splice(0, 3)
    lastSpawnY.value = val
  }
})

function onScroll() {
  scrollY.value = window.scrollY
}
function onMouseMove(e) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

/* *** 도망 버튼 *** */
const btnX = ref(0) // 버튼의 현재 위치
const btnY = ref(0)
const renderX = ref(0) // 렌더링에 사용되는 위치 (애니메이션 프레임마다 btnX로 부드럽게 이동)
const renderY = ref(0)
const escapeSectionEl = ref(null) // 컨테이너 크기, 위치 읽어 경계 계산에 사용
const escapeButtonEl = ref(null)
const FLEE_RADIUS = 100 // 마우스가 이 반경 안으로 들어오면 버튼이 도망가기 시작
const FLEE_FORCE = 120 // 버튼이 도망갈 때 이동하는 픽셀 수 (클수록 더 멀리 도망감)
const WALL_ZONE = 1 // 컨테이너 가장자리에서 버튼이 멈추기 시작하는 지점 (px)
const WALL_PUSH = 3 // 버튼이 벽에 닿았을 때 밀려나는 힘 (px)
const currentTime = ref(new Date().toLocaleTimeString())

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  window.addEventListener('mousemove', onMouseMove)
  animate()

  // 지하철 초기 로드
  fetchAllLines()
  subwayFetchTimer = setInterval(fetchAllLines, 120000) // 2분마다 (9~19시 기준 900콜/일 = 1000건 이내)

  const sRect = escapeSectionEl.value.getBoundingClientRect()
  btnX.value = sRect.width / 2
  btnY.value = sRect.height / 2
  renderX.value = btnX.value
  renderY.value = btnY.value

  clockTimer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('mousemove', onMouseMove)
  cancelAnimationFrame(rafId)
  clearInterval(subwayFetchTimer)
  clearInterval(clockTimer)
})
</script>

<template>
  <div class="pageOutWrap formPage">
    <div
      class="cursorFollower"
      aria-hidden="true"
      :style="{ transform: `translate(${cursorX - 20}px, ${cursorY - 20}px)` }"
    ></div>
    <div class="cl_subVisual"></div>
    <div class="cl_breadcrumb">HOME / etc</div>
    <h1 class="cl_pageTitle">etc</h1>

    <div id="content" class="contentWrapper">
      <!-- 배경 레이어 -->
      <div class="scrollBg" aria-hidden="true">
        <span
          v-for="obj in objects"
          :key="obj.id"
          class="obj"
          :style="{
            width: obj.size + 'px',
            height: obj.size + 'px',
            top: obj.top + '%',
            left: obj.left + '%',
            opacity: obj.opacity,
            background: obj.color,
            borderRadius: obj.borderRadius,
            transform: `translateY(${
              Math.sin(time * obj.freq + obj.phase) * obj.amplitude + scrollY * obj.speedY
            }px) translateX(${
              Math.cos(time * obj.freq + obj.phase) * obj.amplitude * 0.5 + scrollY * obj.speedX
            }px)`,
          }"
        ></span>
      </div>

      <!-- /* 카드 3D Tilt 데모 - 마우스 위치에 따라 카드가 3D로 기울어지는 효과 */ -->
      <TiltCardSection></TiltCardSection>

      <hr class="sectionDivider" />
      <!-- /* *** 지하철 실시간 노선도 실시간 API 활용 예시 (공식 서울열린데이터광장) *** */ -->
      <section class="contentWrap subwaySection">
        <h2 class="demoTitle">회사 좋아~</h2>
        <p class="refreshBadge">{{ Math.ceil(nextRefreshIn) }}초 후 갱신</p>
        /* 디버그: 열차 감지 현황 (콘솔도 확인) */
        <p class="debugBadge">
          <span v-for="line in LINES" :key="'dbg-' + line.id" :style="{ color: line.color }">
            {{ line.name }} {{ (lineTrainsMap[line.id] || []).length }}대&nbsp;
          </span>
        </p>

        <div class="subwayMap">
          <div class="svgWrap">
            <svg
              class="subwaySvg"
              viewBox="0 0 920 380"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              /* 선로 */
              <polyline
                v-for="line in LINES"
                :key="'track-' + line.id"
                :points="line.stations.map((s) => `${s.x},${s.y}`).join(' ')"
                :stroke="line.color"
                stroke-width="5"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.85"
              />

              /* 환승역 표시 (합정, 대림) */
              <circle cx="720" cy="80" r="10" fill="#1a1a2e" stroke="#6464c3" stroke-width="4" />
              <circle cx="260" cy="300" r="10" fill="#1a1a2e" stroke="#6464c3" stroke-width="4" />

              /* 역 원 */
              <template v-for="line in LINES" :key="'dots-' + line.id">
                <circle
                  v-for="s in line.stations"
                  :key="line.id + s.name"
                  :cx="s.x"
                  :cy="s.y"
                  :r="s.name === '가산디지털단지' || s.name === '응암' ? 9 : 6"
                  :fill="s.name === '가산디지털단지' || s.name === '응암' ? '#fff' : '#1a1a2e'"
                  :stroke="line.color"
                  :stroke-width="s.name === '가산디지털단지' || s.name === '응암' ? 3 : 3"
                />
              </template>

              /* 역명 텍스트 */
              <template v-for="line in LINES" :key="'labels-' + line.id">
                <template v-for="(s, i) in line.stations" :key="'txt-' + line.id + s.name">
                  <text
                    v-if="!s.hideLabel"
                    :x="s.x"
                    :y="(line.flipLabels ? i % 2 !== 0 : i % 2 === 0) ? s.y - 14 : s.y + 22"
                    text-anchor="middle"
                    :fill="
                      s.name === '가산디지털단지' || s.name === '응암'
                        ? '#fff'
                        : 'rgba(255,255,255,0.5)'
                    "
                    :font-size="s.name === '가산디지털단지' || s.name === '응암' ? 14 : 10"
                  >
                    {{ s.name }}
                  </text>
                </template>
              </template>
            </svg>

            /* 열차 아이콘 (SVG 위에 절대 위치) */
            <template v-for="line in LINES" :key="'trains-' + line.id">
              <img
                v-for="train in lineTrainsMap[line.id] || []"
                :key="train.id"
                src="@/assets/images/icon_train.png"
                class="trainCar"
                :style="{
                  left: (trainPos(train, line).x / 920) * 100 + '%',
                  top: (trainPos(train, line).y / 400) * 100 + '%',
                  transform: `translate(-50%, ${line.trainOffset?.[train.direction] ?? '-50%'}) rotate(${trainAngle(train, line)}deg)`,
                }"
                :alt="train.destination"
                :title="train.destination"
              />
            </template>
          </div>
        </div>
      </section>

      <hr class="sectionDivider" />
      <!-- /* *** 도망 버튼 *** */ -->
      <section ref="escapeSectionEl" class="escapeSection">
        <h2 class="demoTitle">현재시간 : {{ currentTime }}</h2>
        <div
          ref="escapeButtonEl"
          class="alertBox"
          draggable="false"
          :style="{
            left: renderX + 'px',
            top: renderY + 'px',
            transform: 'translate(-50%, -50%)',
          }"
        >
          <p class="alertMsg">퇴근하시겠습니까?</p>
          <button class="alertBtn" type="button">확인</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cursorFollower {
  position: fixed;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  pointer-events: none;
  z-index: 999;
  will-change: transform;
  mix-blend-mode: difference;
  background: rgba(255, 255, 255, 0.15);
}
.contentWrapper {
  position: relative;
  min-height: 300vh;
}
.scrollBg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.obj {
  position: absolute;
  pointer-events: none;
  will-change: transform;
}
.contentWrapper > *:not(.scrollBg) {
  position: relative;
  z-index: 1;
}
.sectionDivider {
  display: block;
  width: 80%;
  height: 1px;
  margin: 100px auto;
  border: none;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.25) 20%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.25) 80%,
    transparent
  );
}
.demoTitle {
  font-size: 28px;
  color: #fff;
  margin-bottom: 16px;
  text-align: center;
}

/* ===== 지하철 노선도 ===== */
.subwaySection {
  width: 80%;
  padding: 20px 0 80px;
  background-color: #3d3d3d;
}
.refreshBadge {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}
.debugBadge {
  text-align: center;
  font-size: 11px;
  margin-bottom: 40px;
  font-weight: 700;
}
.subwayMap {
  display: flex;
  flex-direction: column;
  gap: 80px;
  padding: 0 10px;
}
.svgWrap {
  position: relative;
  width: 100%;
  padding-bottom: calc(380 / 920 * 100%);
}
.subwaySvg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.trainCar {
  position: absolute;
  width: 36px;
  height: auto;
  z-index: 2;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
  user-select: none;
  pointer-events: none;
  transform-origin: center center;
}

@media (max-width: 768px) {
  .stationName {
    font-size: 8px;
  }
  .subwayMap {
    gap: 60px;
    padding: 0 4px;
  }
  .trainCar {
    width: 28px;
  }
}

/* *** 도망 버튼 *** */
.escapeSection {
  position: relative; /* 자식 absolute 의 기준점 */
  width: 70%;
  margin: 0 auto 120px;
  height: 700px;
  overflow: hidden; /* 경계 밖 잘라냄 */
  border-radius: 16px;
  background: #0f0f1a;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
  box-sizing: border-box;
}
.escapeSection .demoTitle {
  user-select: none;
  -webkit-user-drag: none;
}
.escapeSection .alertBox {
  position: absolute; /* btnX, btnY 좌표로 자유롭게 이동 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 200px;
  height: 120px;
  padding: 20px 15px;
  background: #404069;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  user-select: none;
  -webkit-user-drag: none;
}
.escapeSection .alertMsg {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}
.alertBtn {
  width: 90px;
  height: 40px;
  background: #5b6af0;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: default;
  pointer-events: none;
}
</style>
