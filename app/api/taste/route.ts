export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Add GEMINI_API_KEY to .env.local and restart the app." }, { status: 503 });
  const input = await request.json() as { note?: string; images?: string[]; roomImage?: string; mode?: string };
  const parts: unknown[] = [{ text: `You are Pinspired's senior visual taste director and home-textile designer. You are analyzing a person's own inspiration images, not identifying a generic decor style.

Your job is to find the visual DNA that repeats across the images, rank it by evidence, and turn it into a coherent original made-to-order collection. Look closely at: palette proportions and temperature; light quality; material cues; silhouette language; scale; density versus negative space; texture; pattern rhythm; botanical or geometric motifs; craftsmanship cues; era and cultural references; and the emotional atmosphere. Distinguish what occurs repeatedly from one-off objects. Never copy a specific image, artist, logo, brand, textile, or recognizable composition.

The user's notes are: ${input.note || "none"}.
Their goal is: ${input.mode === "complement" ? "add textiles that harmonize with their existing room while preserving its architecture and key furniture" : "create a complete, cohesive textile transformation"}.

Return only valid JSON following this exact schema:
{
  "title": "3 to 5 evocative words",
  "summary": "one precise sentence",
  "confidence": 0.0,
  "visualDNA": {
    "palette": [{"hex":"#000000","name":"short material-aware color name","weight":0.0}],
    "lighting": "description",
    "materials": ["..."],
    "motifs": ["..."],
    "composition": "description of scale, rhythm, density and negative space",
    "mood": ["..."],
    "avoid": ["visual traits that would break the aesthetic"]
  },
  "designRules": ["5 concrete rules that every product must follow"],
  "keywords": ["4 short aesthetic phrases"],
  "productDirections": [
    {"productType":"home textile type","role":"anchor|supporting|accent","design":"specific original material/color/motif direction"}
  ],
  "patternPrompt": "A highly specific original seamless home-textile print prompt. Describe motif geometry, scale, line quality, palette proportions, texture, repeat behavior, substrate and printing constraints. Explicitly state no text, no logos, no copied art.",
  "roomPrompt": "A detailed room-staging prompt that preserves the current room when supplied and places products in plausible locations.",
  "suggestedProducts": ["home textile types"]
}

Only include conclusions grounded in repeated visual evidence. If the images disagree, state a restrained unifying direction in designRules rather than mashing every style together. If no images are supplied, infer a strong direction from the notes.` }];
  for (const url of (input.images || []).slice(0, 8)) {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(url);
    if (match) parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
  }
  const room = input.roomImage && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(input.roomImage);
  if (room) parts.push({ text: "This final image is the user's current room. Use it to understand existing architecture, furniture and color palette." }, { inline_data: { mime_type: room[1], data: room[2] } });
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } }),
    });
    const data = await response.json() as Record<string, any>;
    if (!response.ok) return Response.json({ error: data.error?.message || "Gemini analysis failed" }, { status: response.status });
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "{}";
    return Response.json(JSON.parse(text));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Taste analysis failed" }, { status: 502 });
  }
}
