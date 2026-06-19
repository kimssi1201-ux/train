export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const suffix = url.pathname.replace(/^\/api\/subway\/?/, "");
  const targetPath = withInternalKey(suffix, env);
  if (!targetPath) {
    return Response.json(
      {
        errorMessage: {
          code: "CONFIG-001",
          message: "SEOUL_SUBWAY_API_KEY environment variable is not configured.",
        },
      },
      {
        status: 500,
        headers: corsHeaders(),
      },
    );
  }

  const target = `http://swopenapi.seoul.go.kr/api/subway/${targetPath}${url.search}`;
  const upstream = await fetch(target, {
    headers: {
      Accept: request.headers.get("Accept") || "application/json",
    },
  });

  const headers = new Headers(upstream.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cache-Control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
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

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };
}
