import { pinterestGet } from "../../../../../../lib/pinterest";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; return pinterestGet(request, `boards/${encodeURIComponent(id)}/sections?page_size=100`); }
