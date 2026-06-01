const express = require('express')
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Proxy ke NexusGGR
app.post('/nexus', async (req, res) => {
  try {
    const response = await fetch('https://api.nexusggr.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Forward callback dari JayaPay ke Cloudflare Pages
app.post('/callback', async (req, res) => {
  try {
    console.log('JayaPay callback received:', JSON.stringify(req.body))
    const response = await fetch('https://indonetwork.pages.dev/deposit/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RenderProxy/1.0',
        'X-Forwarded-From': 'render-proxy',
      },
      body: JSON.stringify(req.body)
    })
    const text = await response.text()
    console.log('Cloudflare response:', text)
    res.send(text)
  } catch (err) {
    console.error('Callback forward error:', err.message)
    res.send('SUCCESS') // Tetap return SUCCESS ke JayaPay
  }
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.listen(3000, () => console.log('Proxy running on port 3000'))
