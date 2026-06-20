const TAGO_SUBWAY_BASE = "https://apis.data.go.kr/1613000/SubwayInfo";

const OPERATIONS = {
  getkwrdfndsubwaysttnlist: "GetKwrdFndSubwaySttnList",
  getsubwaysttnexitacctobusroutelist: "GetSubwaySttnExitAcctoBusRouteList",
  getsubwaysttnexitacctocfrfcltylist: "GetSubwaySttnExitAcctoCfrFcltyList",
  getsubwaysttnacctoschdullist: "GetSubwaySttnAcctoSchdulList",
};

export async function onRequest({ request, env }) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const apiKey = env.TAGO_SUBWAY_API_KEY || env.TAGO_API_KEY || "";
    if (!apiKey) {
      return jsonResponse(
        {
          error: {
            code: "CONFIG-001",
            message: "TAGO_SUBWAY_API_KEY environment variable is not configured.",
          },
        },
        500,
      );
    }

    const url = new URL(request.url);
    const operation = resolveOperation(url.pathname);
    if (!operation) {
      return jsonResponse(
        {
          error: {
            code: "REQUEST-001",
            message: "Unsupported TAGO subway operation.",
            allowedOperations: Object.values(OPERATIONS),
          },
        },
        400,
      );
    }

    const params = new URLSearchParams(url.search);
    params.delete("serviceKey");
    params.delete("ServiceKey");
    params.set("serviceKey", apiKey);
    if (!params.has("_type")) params.set("_type", "json");
    if (!params.has("numOfRows")) params.set("numOfRows", "10");
    if (!params.has("pageNo")) params.set("pageNo", "1");

    const target = `${TAGO_SUBWAY_BASE}/${operation}?${params.toString()}`;
    const upstream = await fetch(target, {
      headers: {
        Accept: request.headers.get("Accept") || "application/json",
        "User-Agent": "train-location-app/1.0",
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
        error: {
          code: "PROXY-001",
          message: error instanceof Error ? error.message : "TAGO subway proxy failed.",
        },
      },
      500,
    );
  }
}

function resolveOperation(pathname) {
  const suffix = pathname.replace(/^\/api\/tago\/subway\/?/, "").replace(/^\/+|\/+$/g, "");
  const [rawOperation] = suffix.split("/");
  if (!rawOperation) return "";
  return OPERATIONS[rawOperation.toLowerCase()] || "";
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
