<template>
  <header class="header" role="banner">
    <div class="headerInner">
      <div class="logo">
        <RouterLink to="/">VUE 기초!</RouterLink>
      </div>
      <nav class="gnb" role="navigation" aria-label="주요 메뉴">
        <ul class="gnbList">
          <li><RouterLink to="/">홈</RouterLink></li>
          <li><RouterLink to="/data-binding">데이터바인딩</RouterLink></li>
          <li><RouterLink to="/condition">조건부&amp;반복</RouterLink></li>
          <li><RouterLink to="/event">이벤트</RouterLink></li>
          <li><RouterLink to="/form">폼</RouterLink></li>
          <li><RouterLink to="/components">컴포넌트</RouterLink></li>
          <li><RouterLink to="/reactive">반응형&amp;상태</RouterLink></li>
          <li><RouterLink to="/pattern">실전패턴</RouterLink></li>
          <li><RouterLink to="/proto">이것저것</RouterLink></li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.header {
  display: block;
  position: sticky;
  top: 0;
  width: 100%;
  height: 80px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  z-index: 100;
}
.headerInner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1920px;
  height: 100%;
  padding: 0 40px;
  box-sizing: border-box;
  margin: 0 auto;
}
.logo a {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #222222;
}
.gnb {
  display: flex;
  align-items: center;
}
.gnbList {
  display: flex;
  align-items: center;
  gap: 24px;
}
.gnbList li a {
  display: block;
  font-size: 14px;
  color: #333333;
  white-space: nowrap;
}
.gnbList li a:hover,
.gnbList li a.router-link-active {
  color: #0056b3;
  font-weight: 700;
}
/* 시각적으로만 숨기고, 스크린 리더와 검색 엔진은 읽을 수 있음 */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 1200px) {
  .headerInner {
    padding: 0 24px;
  }
  .gnbList {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .header {
    height: 56px;
  }
  .headerInner {
    padding: 0 16px;
  }
  .logo a {
    font-size: 18px;
  }
  .gnb {
    display: none;
  }
}
</style>
