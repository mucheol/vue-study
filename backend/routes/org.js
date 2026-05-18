import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

//평탄한 배열 -> 트리 구조로 변환하는 함수
// parentID가 일치하는 노드를 재귀적으로 children에 넣음
function buildTree(nodes, parentId = null) {
  return nodes
    .filter((n) => n.parentId === parentId)
    .map((n) => ({
      ...n,
      children: buildTree(nodes, n.id), // 자식 노드도 같은 방식으로 재귀 처리
    }))
}

// GET /api/org -> 전체 조직도를 트리 구조로 변환
router.get('/', async (req, res) => {
  try {
    // DB에서 모든 노드를 평탄하게 가져옴
    const nodes = await prisma.node.findMany({ orderBy: { id: 'asc' } })
    //평탄한 배열을 트리구조로 변환
    res.json(buildTree(nodes))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/org/:id -> 특정 노드 1개 + 직계 자식만 반환
router.get('/:id', async (req, res) => {
  try {
    const node = await prisma.node.findUnique({
      where: { id: Number(req.params.id) },
      include: { children: true }, // 직계 자식 포함
    })
    if (!node) return res.status(404).json({ error: '노드를 찾을 수 없습니다' })
    res.json(node)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/org/:id -> 노드 이름 수정
router.patch('/:id', async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) return res.status(400).json({ error: '이름을 입력하세요' })
    const node = await prisma.node.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim() },
    })
    res.json(node)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/org -> 새 노드 추가 (파트 또는 직원)
router.post('/', async (req, res) => {
  try {
    // 요청 body에서 name, role, parentId를 꺼냄
    // parentId가 없으면 null (루트노드)
    const { name, role, type, parentId } = req.body

    if (!name || !name.trim()) return res.status(400).json({ error: '이름을 입력하세요' })

    // Prisma로 DB에 새 노드 생성
    const node = await prisma.node.create({
      data: {
        name: name.trim(),
        role: role?.trim() || null, // role은 선택값 - 없으면 null
        type: type || 'org',
        parentId: parentId ?? null, // parentId는 숫자 또는 null
      },
    })

    // 생성된 노드 객체를 응답으로 반환
    res.status(201).json(node)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/org/:id -> 노드 삭제
router.delete('/:id', async (req, res) => {
  try {
    // URL파라미터 id를 숫자로 변환
    const id = Number(req.params.id)

    // 삭제 전에 자식 노드가 있는지 확인
    const children = await prisma.node.findMany({ where: { parentId: id } })

    //자식이 있으면 삭제 거부 - 자식을 먼저 지워야 부모를 지울 수 있음
    if (children.length > 0) {
      return res.status(400).json({ error: '하위 항목을 먼저 삭제하세요' })
    }

    //자식이 없으면 해당 노드 삭제
    await prisma.node.delete({ where: { id } })

    //삭제 성공 시 빈 응답 (204 No Content)
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
