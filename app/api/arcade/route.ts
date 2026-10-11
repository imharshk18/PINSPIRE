const allowed = new Set([
  "categories/list", "categories/get", "patterns/create", "jobs/get",
  "products/create", "products/get", "products/list", "checkouts/create",
]);

export async function POST(request: Request) {
  const key = process.env.ARCADE_API_KEY;
  if (!key) return Response.json({ error: "Add ARCADE_API_KEY to .env.local and restart the app." }, { status: 503 });
  let body: { action?: string; payload?: Record<string, unknown> };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.action || !allowed.has(body.action)) return Response.json({ error: "Unsupported Arcade action" }, { status: 400 });
  try {
    const response = await fetch(`https://platform.arcade.ai/v1/${body.action}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "User-Agent": "RoomformHackathon/1.0 (+https://roomform-arcade-hackathon.harsh-kadodwala.chatgpt.site)",
      },
      body: JSON.stringify(body.payload ?? {}),
    });
    const raw = await response.text();
    let result: unknown;
    try { result = JSON.parse(raw); } catch { result = { error: raw || response.statusText }; }
    return Response.json(result, { status: response.status });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Arcade unavailable" }, { status: 502 });
  }
}
