export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const suffix = url.pathname.replace(/^\/api\/subway\/?/, "");
  const target = `http://swopenapi.seoul.go.kr/api/subway/${suffix}${url.search}`;
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

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };
}
