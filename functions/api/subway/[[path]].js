export async function onRequest({ request, env }) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const suffix = url.pathname.replace(/^\/api\/subway\/?/, "");
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

    const headers = new Headers(upstream.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "no-store");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
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
