<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tree: Array, // OrgView에서 받아온 트리 데이터
})

// 추가/삭제 후 OrgView에 밀려서 데이터 다시 fetch하게 함
const emit = defineEmits(['change'])

// ── 트리 → 평탄한 목록 변환 ──────────────────────────────────────
// 재귀 없이 depth(들여쓰기 깊이)만 붙여서 1차원 배열로 만듦
function flattenTree(nodes, depth = 0) {
  const result = []
  for (const node of nodes) {
    result.push({ ...node, depth }) // 각 노드에 depth 추가
    if (node.children?.length) {
      //자식이 있으면 재귀적으로 평탄화
      result.push(...flattenTree(node.children, depth + 1))
    }
  }
  return result
}

// tree prop이 바뀔 때 마다 자동으로 flatList 재계산
const flatList = computed(() => flattenTree(props.tree))

// ── 추가 폼 상태 ─────────────────────────────────────────────────
// addForm이 null이면 폼 닫힘
// { parentId: null }이면 최상위 추가
// { parentId: 숫자 }이면 해당 노드 하위에 추가
const addForm = ref(null)
const newName = ref('')
const newRole = ref('')
const newType = ref('org') // 기본값 : 조직

function openAddForm(parentId) {
  addForm.value = { parentId }
  newName.value = ''
  newRole.value = ''
  newType.value = 'org' // 폼 열 때마다 기본값으로 초기화
}

function closeAddForm() {
  addForm.value = null
}

// 특정 parentId에 대해 폼이 열려있는지 확인
function isAddingUnder(parentId) {
  return addForm.value !== null && addForm.value.parentId === parentId
}

// ── API 호출 ─────────────────────────────────────────────────────
async function submitAdd(parentId) {
  if (!newName.value.trim()) return

  try {
    const res = await fetch('http://localhost:3001/api/org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.value.trim(),
        role: newRole.value.trim() || null, // 빈 문자열이면 null
        type: newType.value, // 'org' 또는 'person'전달
        parentId, // null이면 루트 노드
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error)
      return
    }
    closeAddForm()
    emit('change') // 부모(OrgView)에 변경 알림 -> 트리 재fetch
  } catch {
    alert('추가 중 오류가 발생했습니다.')
  }
}

async function deleteNode(id) {
  if (!confirm('삭제하시겠습니까?')) return

  try {
    const res = await fetch(`http://localhost:3001/api/org/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error) // 자식이 있으면 백엔드에서 에러 반환
      return
    }
    emit('change')
  } catch {
    alert('삭제 중 오류가 발생했습니다.')
  }
}
</script>

<template>
  <div class="adminList">
    <!-- 최상위 항목 추가 버튼 -->
    <div class="addRootWrap">
      <button
        v-if="!isAddingUnder(null)"
        type="button"
        class="addRootBtn"
        @click="openAddForm(null)"
      >
        + 최상위 항목 추가
      </button>

      <!-- 최상위 추가 폼 -->
      <div v-if="isAddingUnder(null)" class="addForm">
        <input v-model="newName" class="formInput" placeholder="이름 *" />
        <input v-model="newRole" class="formInput" placeholder="직책 (선택)" />
        <!-- 조직/사람 선택 드롭다운 -->
        <select v-model="newType" class="formSelect">
          <option value="org">조직</option>
          <option value="person">사람</option>
        </select>
        <button type="button" class="saveBtn" @click="submitAdd(null)">저장</button>
        <button type="button" class="cancelBtn" @click="closeAddForm">취소</button>
      </div>
    </div>

    <!-- 평탄화된 노드 목록 -->
    <div
      v-for="item in flatList"
      :key="item.id"
      class="adminRow"
      :style="{ paddingLeft: item.depth * 28 + 'px' }"
    >
      <!-- 노드 한 줄 -->
      <div class="rowContent">
        <span class="rowName">{{ item.name }}</span>
        <span v-if="item.role" class="rowRole">{{ item.role }}</span>
        <div class="rowActions">
          <!-- 이 노드 하위에 새 항목 추가 -->
          <button type="button" class="addChildBtn" @click="openAddForm(item.id)">+ 추가</button>
          <button type="button" class="deleteBtn" @click="deleteNode(item.id)">삭제</button>
        </div>
      </div>

      <!-- 이 노드 하위 추가 폼 -->
      <div v-if="isAddingUnder(item.id)" class="addForm">
        <input v-model="newName" class="formInput" placeholder="이름 *" />
        <input v-model="newRole" class="formInput" placeholder="직책 (선택)" />
        <!-- 조직/사람 선택 드롭다운 -->
        <select v-model="newType" class="formSelect">
          <option value="org">조직</option>
          <option value="person">사람</option>
        </select>
        <button type="button" class="saveBtn" @click="submitAdd(item.id)">저장</button>
        <button type="button" class="cancelBtn" @click="closeAddForm">취소</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.adminList {
  background: #12121e;
  border-radius: 10px;
  padding: 16px 20px;
}

/* 최상위 추가 버튼 */
.addRootWrap {
  margin-bottom: 16px;
}
.addRootBtn {
  padding: 6px 14px;
  font-size: 13px;
  background: #2a2a3e;
  border: 1px dashed #7070cc;
  border-radius: 6px;
  color: #9090ee;
  cursor: pointer;
}
.addRootBtn:hover {
  background: #3a3a5e;
}

/* 각 노드 행 */
.adminRow {
  border-bottom: 1px solid #2e2e4e;
  padding-top: 8px;
  padding-bottom: 8px;
}
.rowContent {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rowName {
  font-size: 14px;
  color: #e0e0ff;
  min-width: 80px;
}
.rowRole {
  font-size: 11px;
  color: #888;
  background: #1a1a2e;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 버튼 그룹 */
.rowActions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.addChildBtn {
  padding: 3px 10px;
  font-size: 12px;
  background: #1e3a1e;
  border: 1px solid #3a6a3a;
  border-radius: 4px;
  color: #7acc7a;
  cursor: pointer;
}
.addChildBtn:hover {
  background: #2a4a2a;
}
.deleteBtn {
  padding: 3px 10px;
  font-size: 12px;
  background: #3a1e1e;
  border: 1px solid #6a3a3a;
  border-radius: 4px;
  color: #cc7a7a;
  cursor: pointer;
}
.deleteBtn:hover {
  background: #4a2a2a;
}

/* 추가 폼 */
.addForm {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 8px 10px;
  background: #1a1a2e;
  border-radius: 6px;
  border: 1px solid #444;
}
.formInput {
  padding: 4px 8px;
  font-size: 13px;
  background: #0d0d1a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #e0e0ff;
  outline: none;
  width: 140px;
}
.formInput:focus {
  border-color: #7070cc;
}
.formSelect {
  padding: 4px 8px;
  font-size: 13px;
  background: #0d0d1a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #e0e0ff;
  outline: none;
  cursor: pointer;
}
.saveBtn {
  padding: 4px 12px;
  font-size: 12px;
  background: #3a3a5e;
  border: 1px solid #7070cc;
  border-radius: 4px;
  color: #e0e0ff;
  cursor: pointer;
}
.cancelBtn {
  padding: 4px 10px;
  font-size: 12px;
  background: transparent;
  border: 1px solid #555;
  border-radius: 4px;
  color: #888;
  cursor: pointer;
}
</style>
