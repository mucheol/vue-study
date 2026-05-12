import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 기존 데이터 전체 삭제 (재실행 시 중복 방지)
  await prisma.node.deleteMany()

  // 루트 노드 (회사 최상위)
  const company = await prisma.node.create({
    data: { name: '무무소프트', role: '회사' },
  })

  // 경영진
  const mgmt = await prisma.node.create({
    data: { name: '경영진', role: '부문', parentId: company.id },
  })

  await prisma.node.createMany({
    data: [
      { name: '홍길동', role: 'CEO', parentId: mgmt.id },
      { name: '김영희', role: 'CFO', parentId: mgmt.id },
    ],
  })

  // 개발팀
  const dev = await prisma.node.create({
    data: { name: '개발팀', role: '팀', parentId: company.id },
  })

  // 프론트엔드팀
  const fe = await prisma.node.create({
    data: { name: '프론트엔드팀', role: '파트', parentId: dev.id },
  })
  await prisma.node.createMany({
    data: [
      { name: '이영자', role: '팀장', parentId: fe.id },
      { name: '김철수', role: '개발자', parentId: fe.id },
    ],
  })

  const be = await prisma.node.create({
    data: { name: '백엔드팀', role: '파트', parentId: dev.id },
  })
  await prisma.node.createMany({
    data: [
      { name: '최지원', role: '팀장', parentId: be.id },
      { name: '정다운', role: '개발자', parentId: be.id },
    ],
  })

  // 마케팅팀
  const mkt = await prisma.node.create({
    data: { name: '마케팅팀', role: '팀', parentId: company.id },
  })
  await prisma.node.createMany({
    data: [
      { name: 'SNS팀', role: '파트', parentId: mkt.id },
      { name: '광고팀', role: '파트', parentId: mkt.id },
    ],
  })

  console.log('시딩 완료!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
