export async function GET(request: Request) {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
  if (!clientId || !clientSecret) return Response.redirect(new URL("/?pinterest=unavailable", request.url));
  const state = crypto.randomUUID();
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const url = new URL("https://www.pinterest.com/oauth/");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${origin}/api/pinterest/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "boards:read,pins:read");
  url.searchParams.set("state", state);
  const response = Response.redirect(url);
  response.headers.append("Set-Cookie", `roomform_pin_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  return response;
}
