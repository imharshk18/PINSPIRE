export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Add GEMINI_API_KEY to .env.local and restart the app." }, { status: 503 });
  const input = await request.json() as { prompt?: string; roomImage?: string; products?: string[]; kind?: "room" | "moodboard" };
  const instruction = input.kind === "moodboard"
    ? `Create a sophisticated editorial interior design moodboard photograph on an ivory tabletop. Show a rich but orderly flat-lay of coordinated original fabric swatches, pillow corner, woven throw, rug sample, linen drape, color chips and material details. These represent the proposed home textile collection: ${(input.products || []).join(", ")}. Creative direction: ${input.prompt || "warm contemporary"}. All pieces share one original design language. No words, logos, labels or watermarks. Landscape view.`
    : `Create one photorealistic editorial interior design visualization. ${input.roomImage ? "Use the supplied room photograph as the exact architecture and preserve its layout, windows, walls and major furniture. Replace or add only home textiles: rugs, pillows, throws, bedding, curtains, table linens, and wall textile art where appropriate." : "Show a complete, plausible living room styled with matching home textiles."} Creative direction: ${input.prompt || "warm contemporary"}. Textile types in the proposed Arcade collection: ${(input.products || []).join(", ")}. Make the textile designs coordinate beautifully. No text, watermarks, labels, or split screens. Landscape view.`;
  const parts: unknown[] = [{ text: instruction }];
  const match = input.roomImage && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(input.roomImage);
  if (match) parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
  try {
    const body = JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } });
    let response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent", {
      method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body,
    });
    if (response.status === 404) {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent", {
        method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body,
      });
    }
    const data = await response.json() as Record<string, any>;
    if (!response.ok) return Response.json({ error: data.error?.message || "Scene generation failed" }, { status: response.status });
    const image = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data || p.inline_data?.data);
    const blob = image?.inlineData || image?.inline_data;
    if (!blob) return Response.json({ error: "Gemini returned no image" }, { status: 502 });
    return Response.json({ image: `data:${blob.mimeType || blob.mime_type || "image/png"};base64,${blob.data}` });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Scene generation failed" }, { status: 502 });
  }
}
