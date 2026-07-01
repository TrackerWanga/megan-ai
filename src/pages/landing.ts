export function landingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Megan AI — Build with Intelligence</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a0f;color:#f0f0ff;font-family:system-ui;line-height:1.6}
    nav{position:fixed;top:0;width:100%;padding:16px 32px;background:rgba(10,10,15,0.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,0.05);z-index:1000;display:flex;justify-content:space-between;align-items:center}
    nav .logo{font-size:22px;font-weight:800;background:linear-gradient(135deg,#6C63FF,#00E5A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    nav a{color:#8888aa;text-decoration:none;margin-left:24px;font-size:14px}
    nav a:hover{color:#fff}
    .hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 24px 60px}
    .hero h1{font-size:clamp(36px,6vw,64px);font-weight:800;line-height:1.1;margin-bottom:20px}
    .hero p{font-size:clamp(16px,2vw,20px);color:#8888aa;margin-bottom:36px;max-width:600px;margin-left:auto;margin-right:auto}
    .hero-buttons{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
    .btn{padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;cursor:pointer;text-decoration:none;display:inline-block}
    .btn-primary{background:#6C63FF;color:#fff}.btn-primary:hover{background:#7B73FF}
    .btn-outline{border:1px solid rgba(255,255,255,0.2);color:#fff;background:transparent}
    .btn-outline:hover{border-color:#6C63FF}
    .code-block{background:#13131a;border:1px solid #2a2a3a;border-radius:12px;padding:24px;text-align:left;max-width:600px;margin:40px auto 0;overflow-x:auto}
    .code-block pre{color:#8888aa;font-size:13px;font-family:monospace}
    .kw{color:#6C63FF}.str{color:#00E5A0}.cm{color:#555}
    .features{padding:80px 24px;max-width:1200px;margin:0 auto}
    .features h2{text-align:center;font-size:clamp(28px,4vw,40px);margin-bottom:48px}
    .features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
    .feat-card{background:#13131a;border:1px solid #1a1a24;border-radius:16px;padding:32px;transition:border-color .3s}
    .feat-card:hover{border-color:#6C63FF}
    .feat-icon{font-size:36px;margin-bottom:16px}
    .feat-card h3{font-size:18px;margin-bottom:8px}
    .feat-card p{color:#8888aa;font-size:14px}
    footer{border-top:1px solid rgba(255,255,255,0.05);padding:24px;text-align:center;color:#555;font-size:13px}
    footer a{color:#6C63FF;text-decoration:none}
  </style>
</head>
<body>
  <nav>
    <div class="logo">Megan AI</div>
    <div>
      <a href="/playground">Playground</a>
      <a href="/games">Games</a>
      <a href="/api/endpoints">API Docs</a>
      <a href="https://github.com/TrackerWanga">GitHub</a>
    </div>
  </nav>

  <section class="hero">
    <div>
      <h1>Build AI Apps <span style="background:linear-gradient(135deg,#6C63FF,#00E5A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent">in Minutes</span></h1>
      <p>The complete AI platform — chat, vision, TTS, images, search, and more. 50+ endpoints. Free tier. Built in Kenya for the world.</p>
      <div class="hero-buttons">
        <a href="https://megan-coins.trackerwanga254.workers.dev/api/auth/signup" class="btn btn-primary">Sign Up Free</a>
        <a href="/playground" class="btn btn-outline">Try the Playground</a>
      </div>
      <div class="code-block">
        <pre><span class="kw">curl</span> <span class="str">"https://megan-ai.trackerwanga254.workers.dev/api/ai/chat?prompt=Hello&api_key=YOUR_KEY"</span></pre>
        <pre style="margin-top:8px"><span class="cm">// Returns: { "text": "Hello!", "provider": "workers-ai-glm", ... }</span></pre>
      </div>
    </div>
  </section>

  <section class="features">
    <h2>Everything You <span style="background:linear-gradient(135deg,#6C63FF,#00E5A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Need</span></h2>
    <div class="features-grid">
      <div class="feat-card"><div class="feat-icon">💬</div><h3>AI Chat</h3><p>7 models with automatic failover. Workers AI, GLM, Qwen, DeepSeek, and more.</p></div>
      <div class="feat-card"><div class="feat-icon">👁️</div><h3>Vision & OCR</h3><p>Describe images, read text, analyze scenes, transcribe handwriting.</p></div>
      <div class="feat-card"><div class="feat-icon">🎤</div><h3>Text to Speech</h3><p>Convert text to natural speech. Multiple voices and languages.</p></div>
      <div class="feat-card"><div class="feat-icon">🎨</div><h3>Image Generation</h3><p>Generate images from text. FLUX, Stable Diffusion, Pollinations.</p></div>
      <div class="feat-card"><div class="feat-icon">🌐</div><h3>Web Search</h3><p>Search the web, fetch articles, research topics with AI summaries.</p></div>
      <div class="feat-card"><div class="feat-icon">🔗</div><h3>Chains</h3><p>Combine multiple features. OCR → Translate → TTS in one call.</p></div>
      <div class="feat-card"><div class="feat-icon">💾</div><h3>Bring Your Own DB</h3><p>Connect PostgreSQL, MongoDB, Supabase, Firebase, Redis, or webhooks.</p></div>
      <div class="feat-card"><div class="feat-icon">🛡️</div><h3>Admin Dashboard</h3><p>Track requests, IPs, countries, providers. Full analytics.</p></div>
    </div>
  </section>

  <footer>
    <p>Built with ❤️ by <a href="https://github.com/TrackerWanga">Tracker Wanga</a> • Falcon Tech © 2026</p>
    <p style="margin-top:8px"><a href="/api/endpoints">API Docs</a> • <a href="/playground">Playground</a> • <a href="/games">Games</a></p>
  </footer>
</body>
</html>`;
}
