export async function GET() {
  return Response.json({
    arcade: Boolean(process.env.ARCADE_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    pinterest: Boolean(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET),
  });
}
