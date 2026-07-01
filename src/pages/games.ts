export function gamesPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Megan Games — Earn MGC Coins</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a0f;color:#f0f0ff;font-family:system-ui}
    nav{padding:16px 24px;background:rgba(10,10,15,0.95);border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;align-items:center}
    nav .logo{font-size:18px;font-weight:800;background:linear-gradient(135deg,#6C63FF,#00E5A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    nav a{color:#8888aa;text-decoration:none;font-size:14px}
    .container{max-width:900px;margin:0 auto;padding:24px}
    h1{font-size:28px;margin-bottom:8px}
    p.sub{color:#8888aa;margin-bottom:24px}
    .games-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
    .game-card{background:#13131a;border:1px solid #1a1a24;border-radius:16px;padding:24px;text-align:center;transition:border-color .3s;text-decoration:none;color:#f0f0ff}
    .game-card:hover{border-color:#6C63FF}
    .game-icon{font-size:48px;margin-bottom:12px}
    .game-card h3{font-size:18px;margin-bottom:8px}
    .game-card p{color:#8888aa;font-size:13px}
  </style>
</head>
<body>
  <nav>
    <a href="/" class="logo">Megan AI</a>
    <div><a href="/">Home</a> • <a href="/playground">Playground</a> • <a href="/api/endpoints">Docs</a></div>
  </nav>

  <div class="container">
    <h1>🎮 Megan Games</h1>
    <p class="sub">Play games to earn MGC coins! Use coins for higher API limits.</p>

    <div class="games-grid">
      <a href="https://megan-coins.trackerwanga254.workers.dev" class="game-card">
        <div class="game-icon">🎰</div>
        <h3>Spin the Wheel</h3>
        <p>Spin daily to win up to 100 MGC coins!</p>
      </a>
      <a href="https://megan-coins.trackerwanga254.workers.dev" class="game-card">
        <div class="game-icon">🧠</div>
        <h3>Trivia</h3>
        <p>Answer questions correctly to earn coins.</p>
      </a>
      <a href="https://megan-coins.trackerwanga254.workers.dev" class="game-card">
        <div class="game-icon">🤔</div>
        <h3>Riddles</h3>
        <p>Solve riddles and earn bonus MGC.</p>
      </a>
      <a href="https://megan-coins.trackerwanga254.workers.dev" class="game-card">
        <div class="game-icon">🎯</div>
        <h3>Number Predict</h3>
        <p>Guess the number for big rewards!</p>
      </a>
      <a href="https://megan-coins.trackerwanga254.workers.dev" class="game-card">
        <div class="game-icon">📝</div>
        <h3>Word Scramble</h3>
        <p>Unscramble words to earn coins.</p>
      </a>
      <a href="https://megan-coins.trackerwanga254.workers.dev" class="game-card">
        <div class="game-icon">🏆</div>
        <h3>Leaderboard</h3>
        <p>See top earners and compete!</p>
      </a>
    </div>
  </div>
</body>
</html>`;
}
