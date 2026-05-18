<script setup>
import { ref } from 'vue'
const tiltX = ref(0)
const tiltY = ref(0)
const tiltCardRef = ref(null)
const tiltTransition = ref('none')

function onTiltMove(e) {
  tiltTransition.value = 'none'
  const rect = tiltCardRef.value.getBoundingClientRect()
  tiltX.value = ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * -20
  tiltY.value = ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 20
}
function onTiltLeave() {
  tiltTransition.value = 'transform 0.4s ease'
  tiltX.value = 0
  tiltY.value = 0
}
</script>

<template>
  <section class="contentWrap tiltDemo">
    <h2 class="demoTitle">3D Card Tilt</h2>
    <div class="tiltScene">
      <div
        ref="tiltCardRef"
        class="tiltCard"
        :style="{
          transform: `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: tiltTransition,
        }"
        @mousemove="onTiltMove"
        @mouseleave="onTiltLeave"
      >
        <p class="tiltCardText">카드 Tilt</p>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.tiltDemo {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100px 0;
}
.tiltScene {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 400px;
}
.tiltCard {
  width: 500px;
  height: 530px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  cursor: pointer;
  will-change: transform;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.tiltCardText {
  color: #fff;
  font-size: 24px;
  text-align: center;
  pointer-events: none;
  user-select: none;
}
.demoTitle {
  font-size: 28px;
  color: #fff;
  margin-bottom: 16px;
  text-align: center;
}
</style>
