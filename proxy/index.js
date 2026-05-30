const express = require('express')
const app = express()
app.use(express.json())

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

app.listen(3000)
