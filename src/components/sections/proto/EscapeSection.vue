<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref(new Date().toLocaleTimeString())
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

let rafId = null
let clockTimer = null
let prevMx = 0
let prevMy = 0
let mouseX = 0 // ref 불필요 — 템플릿에서 사용하지 않고 RAF 루프에서만 읽음
let mouseY = 0

function onMouseMove(e) {
  mouseX = e.clientX
  mouseY = e.clientY
}

function animate() {
  if (escapeSectionEl.value) {
    // 초기 렌더 시점에는 ref가 아직 바인딩되지 않았으므로 체크 필요
    const rect = escapeSectionEl.value.getBoundingClientRect() // 컨테이너 위치/크기
    const mx = mouseX - rect.left // 마우스 위치 (컨테이너 기준)
    const my = mouseY - rect.top // 마우스 위치 (컨테이너 기준)

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

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)

  const sRect = escapeSectionEl.value.getBoundingClientRect()
  btnX.value = sRect.width / 2
  btnY.value = sRect.height / 2
  renderX.value = btnX.value
  renderY.value = btnY.value

  animate()

  clockTimer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  cancelAnimationFrame(rafId)
  clearInterval(clockTimer)
})
</script>

<template>
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
</template>

<style scoped>
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
.demoTitle {
  font-size: 28px;
  color: #fff;
  margin-bottom: 16px;
  text-align: center;
  user-select: none;
  -webkit-user-drag: none;
}
.alertBox {
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
.alertMsg {
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
