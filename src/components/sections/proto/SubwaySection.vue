<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

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
let rafId = null
let lastRafTime = null

async function fetchAllLines() {
  const key = import.meta.env.VITE_SUBWAY_API_KEY

  // ALL: 전 노선·전 역 도착정보를 1회 호출로 수신
  const data = await fetch(`/subway-api/api/subway/${key}/json/realtimeStationArrival/ALL`)
    .then((r) => r.json())
    .catch((err) => {
      console.error('[subway] fetch 실패', err)
      return { realtimeArrivalList: [] }
    })

  if (data.errorMessage && data.errorMessage.status !== 200) {
    console.warn('[subway] API 오류:', data.errorMessage)
  }

  const allArrivals = data.realtimeArrivalList || []
  const newMap = {}

  LINES.forEach((line) => {
    // 1) 해당 호선만 추출
    const lineArrivals = allArrivals.filter((a) => String(a.subwayId) === line.id)

    // 2) btrainNo 기준 중복 제거 — 열차당 가장 가까운 다음 역 1건만 유지
    const trainMap = new Map()
    lineArrivals.forEach((a) => {
      const barvlDt = Math.max(0, parseInt(a.barvlDt) || 0)
      const prev = trainMap.get(a.btrainNo)
      if (!prev || barvlDt < prev.barvlDt) trainMap.set(a.btrainNo, { ...a, barvlDt })
    })

    // 3) 우리가 표시하는 역 범위 안에 있는 항목만 매핑
    newMap[line.id] = [...trainMap.values()]
      .map((a) => {
        const stIdx = line.stations.findIndex((s) => s.name === a.statnNm)
        if (stIdx === -1) return null // 표시 범위 밖 역은 제외

        // recptnDt 기준 경과 시간만큼 barvlDt 선보정 (API 데이터는 최대 30초 지연 가능)
        const rawBarvlDt = Math.max(0, parseInt(a.barvlDt) || 0)
        const elapsed = a.recptnDt
          ? Math.max(
              0,
              (Date.now() - new Date(a.recptnDt.replace(' ', 'T') + '+09:00').getTime()) / 1000,
            )
          : 0
        const barvlDt = Math.max(0, rawBarvlDt - elapsed)

        const goingRight = a.updnLine.includes(line.rightwardKeyword)
        const direction = goingRight ? 1 : -1

        // 열차의 추정 위치가 표시 범위(0 ~ stations.length-1) 밖이면 제외
        const rawPos = direction === 1 ? stIdx - barvlDt / line.segmentSec : stIdx + barvlDt / line.segmentSec
        if (rawPos < 0 || rawPos > line.stations.length - 1) return null

        return {
          id: `${line.id}-${a.btrainNo}`,
          baseStationIdx: stIdx,
          barvlDt,
          direction,
          destination: a.trainLineNm,
          arvlMsg: a.arvlMsg2,
        }
      })
      .filter(Boolean)
  })

  lineTrainsMap.value = newMap
  nextRefreshIn.value = 70
}

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

function tick(timestamp) {
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
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  // 지하철 초기 로드
  fetchAllLines()
  subwayFetchTimer = setInterval(fetchAllLines, 70000) // 70초마다 (ALL 1콜 × 1002회/일 ≈ 쿼터 한계치)
  tick()
})
onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearInterval(subwayFetchTimer)
})
</script>

<template>
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
</template>

<style scoped>
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
</style>
