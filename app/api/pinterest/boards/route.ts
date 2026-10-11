import { pinterestGet } from "../../../../lib/pinterest";
export async function GET(request: Request) { return pinterestGet(request, "boards?page_size=100"); }
