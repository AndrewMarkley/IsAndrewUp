const STATUS_KEY = 'current';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method === 'POST' && url.pathname === '/update') {
      const auth = req.headers.get('authorization') || '';
      if (auth !== `Bearer ${env.SHARED_SECRET}`) {
        return json({ error: 'unauthorized' }, { status: 401 });
      }

      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: 'invalid json' }, { status: 400 });
      }

      if (typeof body.isAndrewUp !== 'boolean') {
        return json({ error: 'isAndrewUp must be boolean' }, { status: 400 });
      }

      const now = new Date().toISOString();
      const stored = await env.STATE.get(STATUS_KEY);
      const prev = stored ? JSON.parse(stored) : null;
      const wasUp = prev?.isAndrewUp === true;
      const isUp = body.isAndrewUp;

      let awakeSince = prev?.awakeSince ?? null;
      let asleepSince = prev?.asleepSince ?? null;
      if (isUp) {
        asleepSince = null;
        if (!wasUp || !awakeSince) awakeSince = now;
      } else {
        awakeSince = null;
        if (wasUp || !asleepSince) asleepSince = now;
      }

      const payload = {
        isAndrewUp: isUp,
        signals: body.signals ?? {},
        updatedAt: now,
        awakeSince,
        asleepSince,
      };

      await env.STATE.put(STATUS_KEY, JSON.stringify(payload));
      return json({ ok: true, ...payload });
    }

    if (req.method === 'GET' && url.pathname === '/status') {
      const stored = await env.STATE.get(STATUS_KEY);
      if (!stored) {
        return json({ isAndrewUp: null, signals: {}, updatedAt: null });
      }
      return new Response(stored, {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
          ...corsHeaders,
        },
      });
    }

    return json({ error: 'not found' }, { status: 404 });
  },
};
