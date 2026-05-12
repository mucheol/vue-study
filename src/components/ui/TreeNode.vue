<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  node: Object, // { id, name, role, children: [...] }
})

const emit = defineEmits(['select', 'update'])

// ── 인라인 편집 상태 ──────────────────────────────────────────────
const isEditing = ref(false)
const editValue = ref('')
const inputRef = ref(null)

async function startEdit() {
  editValue.value = props.node.name
  isEditing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function cancelEdit() {
  isEditing.value = false
}

async function saveEdit() {
  const newName = editValue.value.trim()
  if (!newName || newName === props.node.name) {
    cancelEdit()
    return
  }
  try {
    const res = await fetch(`http://localhost:3001/api/org/${props.node.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    if (!res.ok) throw new Error('저장 실패')
    const updated = await res.json()
    emit('update', updated) // 변경된 노드를 OrgView까지 전달
  } catch {
    alert('저장 중 오류가 발생했습니다.')
  } finally {
    isEditing.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Enter') saveEdit()
  if (e.key === 'Escape') cancelEdit()
}
</script>

<template>
  <div class="orgNode">
    <!-- 노드 박스: 클릭=상세, 더블클릭=편집 -->
    <div
      class="nodeBox"
      :class="{ hasChildren: node.children?.length }"
      @click="emit('select', node)"
      @dblclick.stop="startEdit"
    >
      <template v-if="isEditing">
        <input
          ref="inputRef"
          v-model="editValue"
          class="editInput"
          @blur="saveEdit"
          @keydown="onKeydown"
          @click.stop
        />
      </template>
      <template v-else>
        <span class="nodeName">{{ node.name }}</span>
      </template>
      <span v-if="node.role" class="nodeRole">{{ node.role }}</span>
    </div>

    <!-- 자식 노드: 수평 병렬 배치 -->
    <div v-if="node.children?.length" class="childrenWrap">
      <div class="childrenRow">
        <div v-for="child in node.children" :key="child.id" class="childCol">
          <TreeNode
            :node="child"
            @select="emit('select', $event)"
            @update="emit('update', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── 노드 컨테이너 (세로 flex) ──────────────────────────────────── */
.orgNode {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── 노드 박스 ──────────────────────────────────────────────────── */
.nodeBox {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: #2a2a3e;
  border: 1px solid #444;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  min-width: 80px;
  text-align: center;
  user-select: none;
}
.nodeBox:hover {
  background: #3a3a5e;
}

/* 자식이 있는 박스 아래 → 20px 세로선 */
.nodeBox.hasChildren::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 20px;
  background: #555;
}

.nodeName {
  font-size: 14px;
  color: #e0e0ff;
}
.nodeRole {
  font-size: 11px;
  color: #888;
  background: #1a1a2e;
  padding: 2px 6px;
  border-radius: 4px;
}

/* ── 인라인 편집 input ──────────────────────────────────────────── */
.editInput {
  width: 100px;
  font-size: 14px;
  color: #e0e0ff;
  background: #1a1a2e;
  border: 1px solid #7070cc;
  border-radius: 4px;
  padding: 2px 6px;
  outline: none;
  text-align: center;
}

/* ── 자식 영역 ──────────────────────────────────────────────────── */
/* 20px: nodeBox::after(세로선)과 맞닿는 공간 */
.childrenWrap {
  margin-top: 20px;
}

.childrenRow {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

/* ── 각 자식 컬럼 ───────────────────────────────────────────────── */
.childCol {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 20px 16px 0; /* 상단 20px: 가로선 + 세로선 공간 */
}

/*
  ::before = 수평 연결선
  - 전체: left:0 right:0 (형제 전부 가로로 잇는 선)
  - 첫 자식: 왼쪽 절반 숨김 (선이 중앙에서 시작)
  - 마지막 자식: 오른쪽 절반 숨김 (선이 중앙에서 끝)
  - 자식이 하나뿐이면 두 규칙이 동시에 적용 → 너비 0 → 선 없음
*/
.childCol::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: #555;
}
.childCol:first-child::before {
  left: 50%;
}
.childCol:last-child::before {
  right: 50%;
}

/* ::after = 가로선에서 자식 박스까지 내려오는 세로선 */
.childCol::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 20px;
  background: #555;
}
</style>
