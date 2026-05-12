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

export default router
