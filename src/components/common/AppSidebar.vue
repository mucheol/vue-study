<script setup>
import { useScrollSpy } from '@/composables/useScroll'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { menuList } from '@/constants/menuList'

const route = useRoute()
const { activeSectionId } = useScrollSpy()

const activeMenu = computed(() => {
  return menuList.find((m) => {
    // 메인 메뉴 이름과 현재 라우트 이름이 같을때
    if (m.name === route.name) return true
    return false
  })
})

// 찾은 메인 메뉴의 라벨 (사이드바 타이틀용)
const activePageName = computed(() => activeMenu.value?.label ?? '')

// 찾은 메인 메뉴의 서브 메뉴 리스트 (v-for 렌더링용)
const activeMenuChilderen = computed(() => activeMenu.value?.children ?? [])
</script>

<template>
  <aside class="sidebar" role="complementary" aria-label="사이드 메뉴">
    <nav class="sideNav" role="navigation" aria-label="사이드 내비게이션">
      <p class="activePageName">{{ activePageName }}</p>
      <ul class="sideNavList">
        <li v-for="subMenu in activeMenuChilderen" :key="subMenu.id">
          <a :href="`#${subMenu.id}`" :class="{ 'is-active': activeSectionId === subMenu.id }">
            {{ subMenu.label }}</a
          >
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  display: block;
  width: 240px;
  min-width: 240px;
  padding: 32px 0;
  background: #f8f8f8;
  border-right: 1px solid #e0e0e0;
  overflow-x: hidden;
}
.activePageName {
  margin: 0 0 16px;
  padding: 0 24px;
  font-size: 16px;
  font-weight: 700;
  color: #0056b3;
}
.sideNav {
  position: fixed;
  top: 120px;
}
.sideNavList {
  display: flex;
  flex-direction: column;
}
.sideNavList li a {
  display: block;
  padding: 12px 24px;
  font-size: 13px;
  color: #333333;
  border-bottom: 1px solid #eeeeee;
}
.sideNavList li a:hover,
.sideNavList li a.router-link-active {
  background: #e9f1ff;
  color: #0056b3;
  font-weight: 700;
}

.subNavList {
  display: flex;
  flex-direction: column;
  background: #fdfdfd;
}
.subNavList li a {
  padding: 10px 24px 10px 40px; /* 들여쓰기 효과를 위해 좌측 패딩 추가 */
  font-size: 13px;
  color: #555;
  border-bottom: none;
}
.sideNavList li a.is-active {
  font-weight: 700;
  color: #0056b3;
}
.subNavList li a:hover,
.subNavList li a.router-link-exact-active {
  /* 서브메뉴는 exact-active 사용 */
  background: #f0f5ff;
  color: #0056b3;
  font-weight: 700;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
