export default {
  async fetch(request) {
    const results = {};
    
    // Test 1: Get domain
    try {
      const r1 = await fetch('https://h5-api.aoneroom.com/wefeed-h5api-bff/media-player/get-domain', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' }
      });
      results.getDomain = { status: r1.status, body: await r1.text() };
    } catch(e) { results.getDomain = { error: e.message }; }

    // Test 2: Search
    try {
      const r2 = await fetch('https://h5-api.aoneroom.com/wefeed-h5api-bff/search/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36', 'Origin': 'https://moviebox.ph' },
        body: JSON.stringify({ keyword: 'avatar', page: 1, perPage: 5 })
      });
      results.search = { status: r2.status, body: (await r2.text()).substring(0, 300) };
    } catch(e) { results.search = { error: e.message }; }

    // Test 3: Home
    try {
      const r3 = await fetch('https://h5-api.aoneroom.com/wefeed-h5api-bff/home?host=moviebox.ph', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36', 'Origin': 'https://moviebox.ph' }
      });
      results.home = { status: r3.status, body: (await r3.text()).substring(0, 300) };
    } catch(e) { results.home = { error: e.message }; }

    // Test 4: Stream
    try {
      const r4 = await fetch('https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/play?subjectId=4394044471852286152&se=0&ep=0&detailPath=the-furious-6lxRH1LLAe5', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36', 'Referer': 'https://moviebox.ph' }
      });
      results.stream = { status: r4.status, body: (await r4.text()).substring(0, 300) };
    } catch(e) { results.stream = { error: e.message }; }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
