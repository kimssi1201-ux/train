const CACHE_TTL_SECONDS = 900;

export async function onRequest({ request, env, waitUntil }) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "GET") {
      return jsonResponse(
        {
          errorMessage: {
            code: "METHOD-001",
            message: "Only GET requests are supported.",
          },
        },
        405,
      );
    }

    const url = new URL(request.url);
    const suffix = url.pathname.replace(/^\/api\/subway\/?/, "");
    const cache = request.method === "GET" && typeof caches !== "undefined" ? caches.default : null;
    const cacheKey = cache ? new Request(url.toString(), { method: "GET" }) : null;
    const cached = cacheKey ? await cache.match(cacheKey) : null;

    if (cached) {
      return withCors(cached, "HIT");
    }

    const targetPath = withInternalKey(suffix, env);
    if (!targetPath) {
      return jsonResponse(
        {
          errorMessage: {
            code: "CONFIG-001",
            message: "SEOUL_SUBWAY_API_KEY environment variable is not configured.",
          },
        },
        500,
      );
    }

    const target = `http://swopenapi.seoul.go.kr/api/subway/${targetPath}${url.search}`;
    const upstream = await fetch(target, {
      headers: {
        Accept: request.headers.get("Accept") || "application/json",
      },
    });
    const body = await upstream.text();
    const canCache = upstream.ok && isSuccessfulSeoulBody(body);

    const headers = new Headers(upstream.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
    headers.set("Cache-Control", canCache ? `public, max-age=${CACHE_TTL_SECONDS}` : "no-store");
    headers.set("X-Subway-Cache", canCache ? "MISS" : "BYPASS");

    const response = new Response(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });

    if (cacheKey && canCache) {
      const cacheWrite = cache.put(cacheKey, response.clone()).catch(() => {});
      if (typeof waitUntil === "function") {
        waitUntil(cacheWrite);
      } else {
        await cacheWrite;
      }
    }

    return response;
  } catch (error) {
    return jsonResponse(
      {
        errorMessage: {
          code: "PROXY-001",
          message: error instanceof Error ? error.message : "Subway proxy failed.",
        },
      },
      500,
    );
  }
}

function withCors(response, cacheStatus) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([key, value]) => headers.set(key, value));
  headers.set("X-Subway-Cache", cacheStatus);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withInternalKey(suffix, env) {
  const path = suffix.replace(/^\/+/, "");
  const key = env.SEOUL_SUBWAY_API_KEY || env.SUBWAY_API_KEY || "";
  const encodedKey = encodeURIComponent(key);
  const parts = path.split("/");
  const firstFormatIndex = parts.findIndex((part) => part === "json" || part === "xml");

  if (firstFormatIndex === -1) return path;
  if (!key) return "";
  return `${encodedKey}/${parts.slice(firstFormatIndex).join("/")}`;
}

function isSuccessfulSeoulBody(body) {
  try {
    const payload = JSON.parse(body);
    const code = payload?.errorMessage?.code || payload?.code;
    return code === "INFO-000" || code === "INFO-200";
  } catch (error) {
    return false;
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
