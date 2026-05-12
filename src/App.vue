<script setup>
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const showSidebar = computed(() => route.name !== 'home')
</script>

<template>
  <a href="#content" class="skipNav">본문 바로가기</a>
  <AppHeader />
  <div class="layoutBody">
    <AppSidebar v-if="showSidebar" />
    <main id="content" class="mainContent">
      <RouterView />
    </main>
  </div>
  <AppFooter />
</template>

<style>
.layoutBody {
  display: flex;
  width: 100%;
  min-height: calc(100vh - 80px - 80px);
}
.mainContent {
  flex: 1;
  min-width: 0;
}
</style>
