export function playgroundPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Megan AI Playground</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a0f;color:#f0f0ff;font-family:system-ui}
    nav{padding:16px 24px;background:rgba(10,10,15,0.95);border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;align-items:center}
    nav .logo{font-size:18px;font-weight:800;background:linear-gradient(135deg,#6C63FF,#00E5A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    nav a{color:#8888aa;text-decoration:none;font-size:14px}
    .container{max-width:900px;margin:0 auto;padding:24px}
    h1{font-size:28px;margin-bottom:8px}
    p.sub{color:#8888aa;margin-bottom:24px}
    .card{background:#13131a;border:1px solid #1a1a24;border-radius:12px;padding:24px;margin-bottom:16px}
    label{display:block;font-size:13px;color:#8888aa;margin-bottom:4px}
    input,select,textarea{width:100%;padding:10px;background:#0a0a0f;border:1px solid #2a2a3a;border-radius:8px;color:#f0f0ff;font-size:14px;margin-bottom:12px;font-family:monospace}
    textarea{min-height:80px;resize:vertical}
    .btn{padding:10px 24px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;border:none;background:#6C63FF;color:#fff}
    .btn:hover{background:#7B73FF}
    .btn-sm{padding:6px 14px;font-size:12px;background:#2a2a3a;margin-right:8px}
    .result{background:#0a0a0f;border:1px solid #2a2a3a;border-radius:8px;padding:16px;font-family:monospace;font-size:13px;white-space:pre-wrap;max-height:300px;overflow-y:auto;color:#00E5A0}
    .result.error{color:#f87171}
    .endpoint{display:inline-block;padding:4px 10px;background:#1a1a24;border-radius:4px;font-size:12px;margin:4px 4px 4px 0;cursor:pointer;color:#8888aa}
    .endpoint:hover,.endpoint.active{background:#6C63FF;color:#fff}
  </style>
</head>
<body>
  <nav>
    <a href="/" class="logo">Megan AI</a>
    <div><a href="/">Home</a> • <a href="/games">Games</a> • <a href="/api/endpoints">Docs</a></div>
  </nav>

  <div class="container">
    <h1>🧪 API Playground</h1>
    <p class="sub">Test Megan AI endpoints directly in your browser.</p>

    <div class="card">
      <label>API Key</label>
      <input id="apiKey" type="text" placeholder="megan_..." onchange="localStorage.setItem('megan_key',this.value)" />
      <p style="font-size:11px;color:#555;margin-top:-8px;margin-bottom:12px">Get your key at <a href="https://megan-coins.trackerwanga254.workers.dev" style="color:#6C63FF">Megan Coins</a></p>
    </div>

    <div class="card">
      <label>Endpoint</label>
      <div id="endpointList">
        <span class="endpoint active" onclick="setEndpoint('/api/ai/chat')">Chat</span>
        <span class="endpoint" onclick="setEndpoint('/api/ai/reason')">Reason</span>
        <span class="endpoint" onclick="setEndpoint('/api/ai/code')">Code</span>
        <span class="endpoint" onclick="setEndpoint('/api/ai/translate')">Translate</span>
        <span class="endpoint" onclick="setEndpoint('/api/vision/describe')">Vision</span>
        <span class="endpoint" onclick="setEndpoint('/api/vision/ocr')">OCR</span>
        <span class="endpoint" onclick="setEndpoint('/api/audio/tts')">TTS</span>
        <span class="endpoint" onclick="setEndpoint('/api/image/generate')">Image</span>
        <span class="endpoint" onclick="setEndpoint('/api/web/search')">Search</span>
        <span class="endpoint" onclick="setEndpoint('/api/text/summarize')">Summarize</span>
      </div>
    </div>

    <div class="card">
      <label id="methodLabel">Method: GET</label>
      <input id="endpoint" value="/api/ai/chat" readonly style="color:#6C63FF;font-weight:600" />
      <label>Prompt / Query</label>
      <textarea id="prompt" placeholder="Hello! Tell me about Megan AI.">Hello!</textarea>
      <label>System Prompt (optional)</label>
      <input id="system" placeholder="You are a helpful assistant." />
      <button class="btn" onclick="sendRequest()">🚀 Send Request</button>
    </div>

    <div class="card">
      <label>Response</label>
      <div id="response" class="result">Click "Send Request" to test the API...</div>
    </div>
  </div>

  <script>
    document.getElementById('apiKey').value = localStorage.getItem('megan_key') || '';
    
    let currentEndpoint = '/api/ai/chat';
    function setEndpoint(ep) {
      currentEndpoint = ep;
      document.getElementById('endpoint').value = ep;
      document.querySelectorAll('.endpoint').forEach(e=>e.classList.remove('active'));
      event.target.classList.add('active');
      const isPost = ep.includes('/vision/') || ep.includes('/text/');
      document.getElementById('methodLabel').textContent = 'Method: ' + (isPost ? 'POST' : 'GET');
    }

    async function sendRequest() {
      const key = document.getElementById('apiKey').value;
      const endpoint = document.getElementById('endpoint').value;
      const prompt = document.getElementById('prompt').value;
      const system = document.getElementById('system').value;
      const resDiv = document.getElementById('response');
      
      if (!key) { resDiv.textContent = 'Please enter your API key.'; resDiv.className = 'result error'; return; }
      
      resDiv.textContent = 'Loading...';
      resDiv.className = 'result';
      
      try {
        const url = new URL(window.location.origin + endpoint);
        url.searchParams.set('prompt', prompt);
        url.searchParams.set('api_key', key);
        if (system) url.searchParams.set('system', system);
        
        const res = await fetch(url);
        const data = await res.json();
        resDiv.textContent = JSON.stringify(data, null, 2);
        resDiv.className = data.success === false ? 'result error' : 'result';
      } catch(e) {
        resDiv.textContent = 'Error: ' + e.message;
        resDiv.className = 'result error';
      }
    }
  </script>
</body>
</html>`;
}
