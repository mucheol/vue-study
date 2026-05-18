<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import TiltCardSection from '@/components/sections/proto/TiltCardSection.vue'
import SubwaySection from '@/components/sections/proto/SubwaySection.vue'
import EscapeSection from '@/components/sections/proto/EscapeSection.vue'

// ===== 배경 애니메이션 =====
const scrollY = ref(0)
const mouseX = ref(0)
const mouseY = ref(0)
const cursorX = ref(0)
const cursorY = ref(0)
const time = ref(0)
let rafId = null

function animate(timestamp) {
  time.value = timestamp / 1000
  cursorX.value += (mouseX.value - cursorX.value) * 0.1
  cursorY.value += (mouseY.value - cursorY.value) * 0.1
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

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  window.addEventListener('mousemove', onMouseMove)
  animate()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('mousemove', onMouseMove)
  cancelAnimationFrame(rafId)
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

      <TiltCardSection />
      <hr class="sectionDivider" />
      <SubwaySection />
      <hr class="sectionDivider" />
      <EscapeSection />
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
</style>
