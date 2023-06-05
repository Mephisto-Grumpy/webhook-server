const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { spawn } = require('child_process')

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

const server = http.createServer(app)
const io = require('socket.io')(server)

const events = []
const logFilePath = path.join(__dirname, 'webhook.log')

const loadEventsFromLog = () => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading webhook.log:', err)
    } else {
      if (data) {
        const lines = data.trim().split('\n')
        lines.forEach(line => {
          try {
            const event = JSON.parse(line)
            events.push(event)
          } catch (error) {
            console.error('Error parsing event from webhook.log:', error)
          }
        })
      }
    }
  })
}

loadEventsFromLog()

io.on('connection', socket => {
  console.log('A client connected')

  socket.on('disconnect', () => {
    console.log('A client disconnected')
  })
})

app.all('/webhook', (req, res) => {
  if (req.method === 'POST') {
    const event = req.body
    events.push(event)
    io.emit('newEvent', event)
    console.log('Received webhook event:', req.body)
    res.sendStatus(200)

    const logMessage = JSON.stringify(event) + '\n'

    fs.appendFile(logFilePath, logMessage, err => {
      if (err) {
        console.error('Error writing to webhook.log:', err)
      }
    })
  } else {
    res.send('Webhook endpoint is active.')
  }
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/api/events', (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading webhook.log:', err)
      res.status(500).send('Error reading webhook.log')
    } else {
      let events = []
      if (data) {
        const lines = data.trim().split('\n')
        lines.forEach(line => {
          try {
            const event = JSON.parse(line)
            events.push(event)
          } catch (error) {
            console.error('Error parsing event from webhook.log:', error)
          }
        })
      }
      res.json(events)
    }
  })
})

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'events.html'))
})

server.listen(3000, () => {
  console.log('Webhook server is running on port 3000')

  if (process.env.NODE_ENV === 'production') {
    checkCloudflaredInstallation()
  } else {
    console.log('Cloudflared not installed in development mode.')
  }
})

function checkCloudflaredInstallation() {
  const cloudflaredPath = './cloudflared'
  if (fs.existsSync(cloudflaredPath)) {
    console.log('Cloudflared already installed.')
    startCloudflaredTunnel()
  } else {
    console.log('Cloudflared not found. Downloading...')

    const arch = process.arch
    let downloadUrl = ''

    if (arch.includes('arm')) {
      downloadUrl =
        'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm'
    } else if (arch === 'aarch64') {
      downloadUrl =
        'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64'
    } else if (arch === 'x64') {
      downloadUrl =
        'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64'
    } else {
      downloadUrl =
        'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-386'
    }

    const file = fs.createWriteStream(cloudflaredPath)
    https
      .get(downloadUrl, response => {
        response.pipe(file)
        file.on('finish', () => {
          file.close(() => {
            console.log('Cloudflared downloaded successfully.')
            fs.chmodSync(cloudflaredPath, '755')
            startCloudflaredTunnel()
          })
        })
      })
      .on('error', error => {
        console.error('Error downloading Cloudflared:', error)
      })
  }
}

function startCloudflaredTunnel() {
  console.log('Starting the server...')

  const cloudflared = spawn('./cloudflared', [
    'tunnel',
    '--url',
    'http://localhost:3000'
  ])

  cloudflared.stdout.on('data', data => {
    const output = data.toString()
    const match = output.match(/https:\/\/[-0-9a-z]*\.trycloudflare.com/)
    if (match) {
      console.log('Tunnel URL:', match[0])
    } else {
      console.log('Error retrieving Cloudflared URL')
    }
  })

  cloudflared.stderr.on('data', data => {
    console.error(data.toString())
  })
}
