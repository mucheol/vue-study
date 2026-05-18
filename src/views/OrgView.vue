<script setup>
import { ref, onMounted } from 'vue'
import TreeNode from '@/components/ui/TreeNode.vue'
import OrgAdminList from '@/components/ui/OrgAdminList.vue'

// 관리자 모드 여부 (true = 관리자, false = 사용자)
const isAdmin = ref(false)
const tree = ref([]) // API에서 받아온 트리 데이터
const selected = ref(null) // 클릭한 노드 (상세패널에 표시)
const loading = ref(true)
const error = ref(null)

async function fetchTree() {
  try {
    const res = await fetch('http://localhost:3001/api/org')
    if (!res.ok) throw new Error('네트워크 응답이 올바르지 않습니다.')
    tree.value = await res.json()
  } catch (err) {
    error.value = '데이터를 불러올 수 없습니다. 백엔드 서버가 실행중인지 확인하세요'
  } finally {
    loading.value = false
  }
}

function onSelect(node) {
  selected.value = node // TreeNode에서 emit한 클릭이벤트 처리
}

// 노드 이름이 수정됐을 때: 트리를 다시 fetch하지 않고 해당 노드만 교체
function updateNodeInTree(nodes, updated) {
  for (const node of nodes) {
    if (node.id === updated.id) {
      node.name = updated.name
      return true
    }
    if (node.children?.length && updateNodeInTree(node.children, updated)) return true
  }
  return false
}

onMounted(fetchTree)

function onUpdate(updated) {
  updateNodeInTree(tree.value, updated)
  // 상세 패널에 열려 있는 노드도 갱신
  if (selected.value?.id === updated.id) {
    selected.value = { ...selected.value, name: updated.name }
  }
}
</script>

<template>
  <a href="#content" class="skipNav">본문 바로가기</a>
  <div class="pageOutWrap orgPage">
    <div class="cl_subVisual"></div>
    <div class="cl_breadcrumb">HOME / 조직도</div>
    <div class="cl_pageTitle">조직도</div>

    <!-- 관리자/사용자 모드 전환 버튼 -->
    <div class="modeToggleWrap">
      <button type="button" class="modeBtn" :class="{ active: !isAdmin }" @click="isAdmin = false">
        사용자보기
      </button>
      <button type="button" class="modeBtn" :class="{ active: isAdmin }" @click="isAdmin = true">
        관리자 모드
      </button>
    </div>

    <div id="content" class="contentWrap">
      <!-- 로딩 / 에러 상태 -->
      <p v-if="loading" class="statusMsg">불러오는 중...</p>
      <p v-else-if="error" class="statusMsg error">{{ error }}</p>

      <div v-else class="orgLayout">
        <!-- 관리자모드 : 목록형 -->
        <OrgAdminList v-if="isAdmin" :tree="tree" @change="fetchTree" />

        <!-- 사용자모드 : 트리 + 상세패널 -->
        <template v-else>
          <div class="treeWrap">
            <TreeNode
              v-for="node in tree"
              :key="node.id"
              :node="node"
              :isAdmin="isAdmin"
              @select="onSelect"
              @update="onUpdate"
            />
          </div>

          <aside v-if="selected" class="detailPanel">
            <h3 class="detailName">{{ selected.name }}</h3>
            <dl class="detailInfo">
              <dt>직책</dt>
              <dd>{{ selected.role || '-' }}</dd>
              <dt>하위 조직 수</dt>
              <dd>{{ selected.children?.length ?? 0 }}개</dd>
              <dt>ID</dt>
              <dd>#{{ selected.id }}</dd>
            </dl>
          </aside>
          <div class="detailPlaceholder" v-else>노드를 클릭하면 상세 정보가 표시됩니다.</div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 모드 전환 버튼 */
.modeToggleWrap {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.modeBtn {
  padding: 6px 16px;
  font-size: 13px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #1a1a2e;
  color: #bbb;
  cursor: pointer;
}
/* 선택된 버튼 강조 */
.modeBtn.active {
  background: #3a3a5e;
  border-color: #7070cc;
  color: #e0e0ff;
}

.contentWrap {
  position: relative;
  padding-top: 140px;
}
.orgLayout {
  padding: 40px 0;
}
.treeWrap {
  flex: 1;
  min-width: 0;
}
.treeRoot {
  list-style: none;
  padding: 0;
  margin: 0;
}

.statusMsg {
  padding: 40px 0;
  color: #aaa;
  font-size: 14px;
}
.statusMsg.error {
  color: #e05555;
}

/* 상세 패널 */
.detailPanel {
  position: absolute;
  top: 0;
  right: 0;
  width: 240px;
  flex-shrink: 0;
  background: #1e1e2e;
  border: 1px solid #444;
  border-radius: 10px;
  padding: 20px;
}
.detailName {
  margin: 0 0 16px;
  font-size: 18px;
  color: #e0e0ff;
}
.detailInfo {
  margin: 0;
}
.detailInfo dt {
  font-size: 11px;
  color: #ccc;
  margin-bottom: 2px;
  margin-top: 12px;
}
.detailInfo dt:first-child {
  margin-top: 0;
}
.detailInfo dd {
  margin: 0;
  font-size: 14px;
  color: #e8e8e8;
}

.detailPlaceholder {
  position: absolute;
  top: 0;
  right: 0;
  width: 240px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #888;
  text-align: center;
  border: 1px dashed #555;
  border-radius: 10px;
  padding: 40px 20px;
}
</style>
