import { cookie } from "../../../../lib/pinterest";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  if (!code || !state || state !== cookie(request, "roomform_pin_state")) return Response.redirect(`${origin}/?pinterest=error`);
  const id = process.env.PINTEREST_CLIENT_ID;
  const secret = process.env.PINTEREST_CLIENT_SECRET;
  if (!id || !secret) return Response.redirect(`${origin}/?pinterest=unavailable`);
  const basic = btoa(`${id}:${secret}`);
  const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: `${origin}/api/pinterest/callback` }),
  });
  const result = await response.json() as { access_token?: string };
  if (!response.ok || !result.access_token) return Response.redirect(`${origin}/?pinterest=error`);
  const redirect = Response.redirect(`${origin}/?pinterest=connected`);
  redirect.headers.append("Set-Cookie", `roomform_pin_token=${encodeURIComponent(result.access_token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  redirect.headers.append("Set-Cookie", "roomform_pin_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return redirect;
}
