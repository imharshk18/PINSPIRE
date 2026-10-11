export function cookie(request: Request, name: string): string | undefined {
  return request.headers.get("cookie")?.split("; ").find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function pinterestGet(request: Request, path: string) {
  const token = cookie(request, "roomform_pin_token");
  if (!token) return Response.json({ error: "Connect Pinterest first" }, { status: 401 });
  const response = await fetch(`https://api.pinterest.com/v5/${path}`, {
    headers: { Authorization: `Bearer ${decodeURIComponent(token)}`, Accept: "application/json" },
  });
  const payload = await response.json();
  return Response.json(payload, { status: response.status, headers: { "Cache-Control": "no-store" } });
}
