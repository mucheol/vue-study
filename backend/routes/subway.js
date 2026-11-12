import { Router } from 'express'

const router = Router()
const SEOUL_API = 'http://swopenAPI.seoul.go.kr/api/subway'

// GET /api/subway/arrivals -> 전 노선 실시간 도착정보 (키는 서버에서만 사용)
router.get('/arrivals', async (req, res) => {
  const key = process.env.SUBWAY_API_KEY
  if (!key) return res.status(500).json({ error: 'SUBWAY_API_KEY가 설정되지 않았습니다.' })
  try {
    const upstream = await fetch(`${SEOUL_API}/${encodeURIComponent(key)}/json/realtimeStationArrival/ALL`)
    res.status(upstream.status).json(await upstream.json())
  } catch (err) {
    console.error('[subway] 서울 API 호출 실패', err)
    res.status(502).json({ error: '지하철 API 호출에 실패했습니다.' })
  }
})

export default router
