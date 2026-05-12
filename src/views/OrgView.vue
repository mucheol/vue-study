<script setup>
import { ref, onMounted } from 'vue'
import TreeNode from '@/components/ui/TreeNode.vue'

const tree = ref([]) // API에서 받아온 트리 데이터
const selected = ref(null) // 클릭한 노드 (상세패널에 표시)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/org')
    if (!res.ok) throw new Error('네트워크 응답이 올바르지 않습니다.')
    tree.value = await res.json()
  } catch (error) {
    error.value = '데이터를 불러올 수 없습니다. 백엔드 서버가 실행중인지 확인하세요'
  } finally {
    loading.value = false
  }
})

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

    <div id="content" class="contentWrap">
      <!-- 로딩 / 에러 상태 -->
      <p v-if="loading" class="statusMsg">불러오는 중...</p>
      <p v-else-if="error" class="statusMsg error">{{ error }}</p>

      <div v-else class="orgLayout">
        <!-- 트리 영역 -->
        <div class="treeWrap">
          <TreeNode
            v-for="node in tree"
            :key="node.id"
            :node="node"
            @select="onSelect"
            @update="onUpdate"
          />
        </div>

        <!-- 노드 클릭 시 우측 상세 패널 -->
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
        <div v-else class="detailPlaceholder">노드를 클릭하면 상세 정보가 표시됩니다</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  color: #888;
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
  color: #888;
  margin-bottom: 2px;
  margin-top: 12px;
}
.detailInfo dt:first-child {
  margin-top: 0;
}
.detailInfo dd {
  margin: 0;
  font-size: 14px;
  color: #ccc;
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
  color: #555;
  text-align: center;
  border: 1px dashed #333;
  border-radius: 10px;
  padding: 40px 20px;
}
</style>
