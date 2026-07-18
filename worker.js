export default {
  async fetch(request) {
    const results = {};
    
    // Helper: retry with backoff
    async function fetchWithRetry(url, options, retries = 3) {
      const UAS = [
        'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0',
      ];
      
      for (let i = 0; i < retries; i++) {
        const headers = {
          ...options.headers,
          'User-Agent': UAS[Math.floor(Math.random() * UAS.length)],
        };
        
        const resp = await fetch(url, { ...options, headers });
        
        if (resp.status === 429) {
          // Rate limited - wait and retry
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
          continue;
        }
        
        return { status: resp.status, body: await resp.text() };
      }
      return { error: 'Max retries exceeded' };
    }

    // Test 1: Get domain
    results.getDomain = await fetchWithRetry(
      'https://h5-api.aoneroom.com/wefeed-h5api-bff/media-player/get-domain',
      { headers: { 'Accept': 'application/json' } }
    );

    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));

    // Test 2: Home
    results.home = await fetchWithRetry(
      'https://h5-api.aoneroom.com/wefeed-h5api-bff/home?host=moviebox.ph',
      { headers: { 'Origin': 'https://moviebox.ph' } }
    );

    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
