<script setup>
import { RouterLink } from 'vue-router'
import { menuList } from '@/constants/menuList'

const menus = menuList
</script>

<template>
  <div class="pageOutWrap homePage">
    <div class="cl_subVisual">서브비쥬얼</div>
    <div class="cl_breadcrumb">HOME</div>
    <div class="cl_pageTitle">메인</div>
    <div id="content" class="contentWrap">
      <section>
        <h1>VUE 공부겸 만들어봄</h1>
        <p>Vue 템플릿에 softM CSS 정의서 기준의 기본 스타일과 레이아웃이 적용되었습니다.</p>

        <div class="listWrapper">
          <div class="lists">
            <div
              class="list"
              v-for="menu in menus.filter((m) => m.children?.length)"
              :key="menu.id"
            >
              <p class="cateTit" v-if="menu.children && menu.children.length > 0">
                {{ menu.label }}
              </p>
              <ul class="menu.name">
                <li v-for="child in menu.children" :key="child.id">
                  <RouterLink :to="`${menu.to}#${child.id}`">{{ child.label }}</RouterLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.listWrapper {
  width: 100%;
  padding: 40px 0;
}
.lists {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.lists .list {
  flex: 1 1 180px;
  padding: 20px 20px 16px;
  border-radius: 12px;
  border: 1px solid #e4e8f0;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}
.lists .list:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.11);
}
.lists .list p.cateTit {
  font-size: 15px;
  font-weight: 700;
  color: #1a2b4a;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4f7cff;
}
.lists .list ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.lists .list ul li {
  margin-bottom: 4px;
}
.lists .list ul li a {
  display: block;
  padding: 7px 10px 7px 14px;
  font-size: 13px;
  color: #555;
  border-radius: 6px;
  position: relative;
  transition:
    background 0.15s,
    color 0.15s;
}
.lists .list ul li a::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #c2ccdd;
  transition: background 0.15s;
}
.lists .list ul li a:hover {
  background: #f0f4ff;
  color: #4f7cff;
}
.lists .list ul li a:hover::before {
  background: #4f7cff;
}

@media (max-width: 768px) {
  .listWrapper {
    padding: 24px 0;
  }
  .lists {
    gap: 12px;
  }
  .lists .list {
    flex: 1 1 calc(50% - 6px);
    padding: 16px 14px 12px;
  }
  .lists .list p.cateTit {
    font-size: 14px;
    margin-bottom: 10px;
    padding-bottom: 8px;
  }
  .lists .list ul li a {
    font-size: 12px;
    padding: 6px 8px 6px 12px;
  }
}
</style>
