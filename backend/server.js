import express from 'express'
import cors from 'cors'
import orgRouter from './routes/org.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use('/api/org', orgRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`서버 실행 중 : http://localhost:${PORT}`)
})
