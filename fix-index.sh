#!/bin/bash
# Find the exact line of the 404
LINE=$(grep -n "return error('Not found', 404);" src/index.ts | head -1 | cut -d: -f1)
echo "404 line is: $LINE"

# Remove everything after the 404 line
head -n $((LINE - 1)) src/index.ts > src/index-new.ts

# Add memory endpoints
cat << 'MEMORY' >> src/index-new.ts

      // ═══ MEMORY / KEY-VALUE STORE ═══
      if (path === '/api/memory/save' && method === 'POST') {
        const body = await request.json();
        if (!body.key || body.value === undefined) return error('key and value required');
        await fbPatch(env, `memory/${user.uid}/${body.key}`, { value: body.value, updated_at: Date.now() });
        return ok({ success: true, key: body.key });
      }
      if (path === '/api/memory/get' && method === 'GET') {
        const key = url.searchParams.get('key');
        if (!key) return error('key required');
        const data = await fbGet(env, `memory/${user.uid}/${key}`);
        return ok({ key, data: data?.value || null });
      }
      if (path === '/api/memory/del' && method === 'DELETE') {
        const key = url.searchParams.get('key');
        if (!key) return error('key required');
        await fbPatch(env, `memory/${user.uid}/${key}`, null);
        return ok({ success: true, key });
      }
      if (path === '/api/memory/keys' && method === 'GET') {
        const memory = await fbGet(env, `memory/${user.uid}`) || {};
        return ok({ keys: Object.keys(memory) });
      }

      return error('Not found', 404);
    } catch (e: any) {
      return error(e.message || 'Internal error', 500);
    }
  },
};
MEMORY

# Replace old file
mv src/index-new.ts src/index.ts
echo "✅ Memory endpoints added"
