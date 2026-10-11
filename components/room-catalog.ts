import { mossMorningInventory } from "../lib/moss-morning-inventory";
import { LAYER_BOX } from "./room-layers";

export type Room = "living" | "bedroom";

export type Placement =
  | "rug"
  | "sofaPillow"
  | "bedPillow"
  | "throw"
  | "curtain"
  | "duvet"
  | "floorCushion"
  | "tableTextile"
  | "lamp";

export type Category =
  | "Pillows"
  | "Rugs"
  | "Throws"
  | "Curtains"
  | "Bedding"
  | "Floor cushions"
  | "Table textiles"
  | "Lighting";

export type Colorway = "morning" | "sage" | "bramble";

export const COLORWAYS: { id: Colorway; name: string; swatch: string }[] = [
  { id: "morning", name: "Moss & Morning", swatch: "linear-gradient(135deg, #efe6d4 0 55%, #b9643c 55% 70%, #6f8a5e 70%)" },
  { id: "sage", name: "Fern Ledger", swatch: "linear-gradient(135deg, #b9c7ad 0 55%, #6f8a68 55%)" },
  { id: "bramble", name: "Mushroom Accent", swatch: "linear-gradient(135deg, #f1ebe0 0 55%, #7a5568 55% 72%, #4a4a48 72%)" },
];
export const colorwayById = new Map(COLORWAYS.map((entry) => [entry.id, entry]));

export type ColorVariant = { productId: string; name: string; image: string };

export type Motif =
  | "fern"
  | "toadstool"
  | "botanical"
  | "bark"
  | "leaf"
  | "knit"
  | "russet"
  | "vine"
  | "sheer"
  | "sage"
  | "olive"
  | "moss"
  | "flax";

export type TextileShape = "pillow" | "lumbar" | "rug" | "throw" | "curtain" | "duvet" | "pouf" | "runner" | "swatch";

export type CatalogProduct = {
  id: string;
  name: string;
  category: Category;
  price: number;
  motif: Motif;
  shape: TextileShape;
  rooms: Room[];
  placements: Placement[];
  /** Large pieces only fit the main anchor in a room. Small pieces can take side spots. */
  scale: "small" | "large";
  note: string;
  image?: string;
  /** CSS background-position used to crop a product photo into the room shape. */
  focus?: string;
  /** CSS background-size so a lifestyle photo crops down to cloth. */
  zoom?: string;
  /** Other Arcade colorways of the same piece. The base product is the Moss & Morning colorway. */
  colors?: Partial<Record<Exclude<Colorway, "morning">, ColorVariant>>;
};

export type RoomSlot = {
  id: string;
  room: Room;
  kind: Placement;
  label: string;
  role: "anchor" | "nook";
  /** Bounds of the rendered layer in canvas percentages: left, top, width, height. */
  box: [number, number, number, number];
};

export const CATEGORIES: Category[] = [
  "Pillows",
  "Rugs",
  "Throws",
  "Curtains",
  "Bedding",
  "Floor cushions",
  "Table textiles",
  "Lighting",
];

const pillow = "090a926b-a48e-4710-bd55-e2408317301f";
const outdoor = "71d16650-c0be-4642-81ac-b217f490b74f";
const sham = "3fcb0e04-c5e1-4f7a-82e9-35c06475fcfb";
const floorPillow = "c4547b61-1a29-4978-b99a-45d58f4cf230";
const curtain = "18ac1b60-0aaf-49b7-8c3f-7d5cb291ac43";
const duvet = "3cf1e4a9-9e14-45b3-a0a8-dd5a4c923f54";
const quilt = "f93a9cf3-7a1d-45e3-9e18-b98aa19647ed";
const tablecloth = "1c644cd6-ac21-41e3-bca7-e643df41a5ac";
const napkins = "9ab4f5d0-cc15-44bd-a894-b52ea36eeec0";
const towels = "4d93eda2-9639-4c91-ac17-9a6d07ac00b4";
const fabric = "4eaa1178-eb6d-47e4-addb-3b83eff6f2a2";
const imageById = new Map(mossMorningInventory.map((item) => [item.id, item.image]));
function img(id: string) {
  return imageById.get(id) ?? "";
}
function variant(productId: string, name: string): ColorVariant {
  return { productId, name, image: img(productId) };
}
const lampshade = "5835c11d-5546-42b1-b5dd-bd92b26df814";

/** Real Moss & Morning Arcade products, with a room job for each one. */
export const CATALOG: CatalogProduct[] = [
  { id: pillow, name: "Everyday Cotton Pillow Cover", category: "Pillows", price: 43.56, motif: "botanical", shape: "pillow", rooms: ["living", "bedroom"], placements: ["sofaPillow", "bedPillow"], scale: "small", note: "Any seat or pillow spot", image: img(pillow), focus: "center 48%", zoom: "190%", colors: { sage: variant("2415ead2-df4a-4ff5-90b0-ae3a42ccf61a", "Fern Ledger Pillow Cover"), bramble: variant("b1586b98-70bc-4f98-8f55-9650dc306242", "Mushroom Accent Pillow Cover") } },
  { id: outdoor, name: "Outdoor Heavyweight Pillow Cover", category: "Pillows", price: 40.56, motif: "fern", shape: "pillow", rooms: ["living", "bedroom"], placements: ["sofaPillow", "bedPillow"], scale: "small", note: "A second pillow, wherever you want it", image: img(outdoor), focus: "center 48%", zoom: "190%" },
  { id: sham, name: "Organic Cotton Quilted Sham", category: "Pillows", price: 63.62, motif: "sage", shape: "pillow", rooms: ["bedroom"], placements: ["bedPillow"], scale: "small", note: "Bedroom pillows only", image: img(sham), focus: "center 48%", zoom: "190%" },
  { id: floorPillow, name: "Everyday Cotton Floor Pillow Cover", category: "Floor cushions", price: 85.43, motif: "olive", shape: "pouf", rooms: ["living", "bedroom"], placements: ["floorCushion"], scale: "small", note: "Choose a spot on the floor", image: img(floorPillow), focus: "center 50%", zoom: "200%" },
  { id: curtain, name: "Printed Everyday Cotton Curtain Panel", category: "Curtains", price: 68.74, motif: "vine", shape: "curtain", rooms: ["living", "bedroom"], placements: ["curtain"], scale: "small", note: "Left or right side of the window", image: img(curtain), focus: "9% 50%", zoom: "auto 118%", colors: { sage: variant("0f4ddf94-b448-4208-b8ec-f7010d965731", "Fern Ledger Curtain Panel"), bramble: variant("7d1ea0a3-cb5a-4a6f-96b3-3e8457d8e90d", "Mushroom Accent Curtain Panel") } },
  { id: duvet, name: "Cotton Percale Duvet Cover", category: "Bedding", price: 151.04, motif: "botanical", shape: "duvet", rooms: ["bedroom"], placements: ["duvet"], scale: "large", note: "Replaces the bed dressing", image: img(duvet), focus: "center 60%", zoom: "150%", colors: { sage: variant("79148008-ed3e-4fa7-a527-4fa458f1da29", "Fern Ledger Duvet Cover"), bramble: variant("2d3c3921-79f4-41c9-b05a-4c607003902a", "Mushroom Accent Duvet Cover") } },
  { id: quilt, name: "Organic Cotton Cambric Quilt", category: "Throws", price: 182.6, motif: "botanical", shape: "throw", rooms: ["living"], placements: ["throw"], scale: "small", note: "Draped over the sofa arm", image: img(quilt), focus: "center 55%", zoom: "180%", colors: { sage: variant("cb22ee87-1bb5-45c7-a34d-45cfdce3acd9", "Fern Ledger Quilt"), bramble: variant("459b5565-1a15-46d4-924b-0aec817f76f1", "Mushroom Accent Quilt") } },
  { id: tablecloth, name: "Everyday Cotton Tablecloth", category: "Table textiles", price: 91.36, motif: "flax", shape: "runner", rooms: ["living"], placements: ["tableTextile"], scale: "large", note: "Dresses the coffee table", image: img(tablecloth), focus: "center 55%", zoom: "180%" },
  { id: napkins, name: "Everyday Cotton Dinner Napkins", category: "Table textiles", price: 33.96, motif: "botanical", shape: "runner", rooms: ["living", "bedroom"], placements: ["tableTextile"], scale: "small", note: "Coffee table or either nightstand", image: img(napkins), focus: "center 55%", zoom: "200%" },
  { id: towels, name: "Crisp Linen Tea Towels", category: "Table textiles", price: 57.2, motif: "flax", shape: "runner", rooms: ["living", "bedroom"], placements: ["tableTextile"], scale: "small", note: "A small cloth, a few places it can land", image: img(towels), focus: "center 55%", zoom: "200%" },
  { id: fabric, name: "Moss & Morning Fabric by the Yard", category: "Rugs", price: 48.89, motif: "leaf", shape: "rug", rooms: ["living", "bedroom"], placements: ["rug"], scale: "small", note: "Lay the yardage under the seating or off to the side", image: img(fabric), focus: "center 60%", zoom: "140%" },
  { id: lampshade, name: "Fern Ledger Drum Lampshade", category: "Lighting", price: 164, motif: "fern", shape: "swatch", rooms: ["living", "bedroom"], placements: ["lamp"], scale: "small", note: "Reading lamp or either bedside lamp", image: "/vibes/moss-and-morning/studio/fern-ledger-lampshade.png" },
];

export const SLOTS: RoomSlot[] = [
  { id: "liv-rug-main", room: "living", kind: "rug", label: "Under the coffee table", role: "anchor", box: LAYER_BOX["liv-rug-main"] },
  { id: "liv-pillow-l", room: "living", kind: "sofaPillow", label: "Left seat", role: "anchor", box: LAYER_BOX["liv-pillow-l"] },
  { id: "liv-pillow-c", room: "living", kind: "sofaPillow", label: "Middle seat", role: "anchor", box: LAYER_BOX["liv-pillow-c"] },
  { id: "liv-pillow-r", room: "living", kind: "sofaPillow", label: "Right seat", role: "anchor", box: LAYER_BOX["liv-pillow-r"] },
  { id: "liv-throw-arm", room: "living", kind: "throw", label: "Over the arm", role: "anchor", box: LAYER_BOX["liv-throw-arm"] },
  { id: "liv-curtain-l", room: "living", kind: "curtain", label: "Left of the window", role: "anchor", box: LAYER_BOX["liv-curtain-l"] },
  { id: "liv-curtain-r", room: "living", kind: "curtain", label: "Right of the window", role: "nook", box: LAYER_BOX["liv-curtain-r"] },
  { id: "liv-pouf-l", room: "living", kind: "floorCushion", label: "Front left", role: "anchor", box: LAYER_BOX["liv-pouf-l"] },
  { id: "liv-pouf-r", room: "living", kind: "floorCushion", label: "By the window", role: "nook", box: LAYER_BOX["liv-pouf-r"] },
  { id: "liv-runner", room: "living", kind: "tableTextile", label: "Coffee table", role: "anchor", box: LAYER_BOX["liv-runner"] },
  { id: "liv-lamp", room: "living", kind: "lamp", label: "Reading lamp", role: "anchor", box: LAYER_BOX["liv-lamp"] },
  { id: "bed-rug-main", room: "bedroom", kind: "rug", label: "Under the bed", role: "anchor", box: LAYER_BOX["bed-rug-main"] },
  { id: "bed-duvet", room: "bedroom", kind: "duvet", label: "On the bed", role: "anchor", box: LAYER_BOX["bed-duvet"] },
  { id: "bed-pillow-l", room: "bedroom", kind: "bedPillow", label: "Left pillow", role: "anchor", box: LAYER_BOX["bed-pillow-l"] },
  { id: "bed-pillow-c", room: "bedroom", kind: "bedPillow", label: "Center accent", role: "anchor", box: LAYER_BOX["bed-pillow-c"] },
  { id: "bed-pillow-r", room: "bedroom", kind: "bedPillow", label: "Right pillow", role: "anchor", box: LAYER_BOX["bed-pillow-r"] },
  { id: "bed-curtain-l", room: "bedroom", kind: "curtain", label: "Left of the window", role: "anchor", box: LAYER_BOX["bed-curtain-l"] },
  { id: "bed-curtain-r", room: "bedroom", kind: "curtain", label: "Right of the window", role: "nook", box: LAYER_BOX["bed-curtain-r"] },
  { id: "bed-pouf-l", room: "bedroom", kind: "floorCushion", label: "By the window", role: "anchor", box: LAYER_BOX["bed-pouf-l"] },
  { id: "bed-runner-l", room: "bedroom", kind: "tableTextile", label: "Left nightstand", role: "anchor", box: LAYER_BOX["bed-runner-l"] },
  { id: "bed-runner-r", room: "bedroom", kind: "tableTextile", label: "Right nightstand", role: "nook", box: LAYER_BOX["bed-runner-r"] },
  { id: "bed-lamp-l", room: "bedroom", kind: "lamp", label: "Left bedside lamp", role: "anchor", box: LAYER_BOX["bed-lamp-l"] },
  { id: "bed-lamp-r", room: "bedroom", kind: "lamp", label: "Right bedside lamp", role: "nook", box: LAYER_BOX["bed-lamp-r"] },
];

const DEFAULT_SLOT: Record<string, string> = {
  [pillow]: "liv-pillow-l",
  [quilt]: "liv-throw-arm",
  [fabric]: "liv-rug-main",
  [curtain]: "liv-curtain-l",
  [duvet]: "bed-duvet",
  [floorPillow]: "liv-pouf-l",
};

export const catalogById = new Map(CATALOG.map((product) => [product.id, product]));
export const slotById = new Map(SLOTS.map((slot) => [slot.id, slot]));

export function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function slotsFor(product: CatalogProduct, room: Room) {
  return SLOTS.filter((slot) => {
    if (slot.room !== room) return false;
    if (!product.rooms.includes(room)) return false;
    if (!product.placements.includes(slot.kind)) return false;
    if (product.scale === "large" && slot.role !== "anchor") return false;
    return true;
  });
}

export function productFitsSlot(product: CatalogProduct, slot: RoomSlot) {
  return slotsFor(product, slot.room).some((candidate) => candidate.id === slot.id);
}

export type StyledPlacement = { slotId: string; productId: string; color?: Colorway };
export type Look = { name: string; items: StyledPlacement[] };

/** The rendered layer for a piece in a colorway, falling back to the Moss & Morning render. */
export function layerFor(slotId: string, color: Colorway = "morning") {
  const id = `${slotId}--${color}`;
  return color !== "morning" && LAYER_BOX[id] ? id : slotId;
}

/** Colorways that have both an Arcade product and a render for this spot. */
export function colorsFor(product: CatalogProduct, slotId: string): Colorway[] {
  if (!product.colors) return [];
  const options = COLORWAYS.map((entry) => entry.id).filter(
    (color) => color === "morning" || (product.colors?.[color] && LAYER_BOX[`${slotId}--${color}`]),
  );
  return options.length > 1 ? options : [];
}

export function productInColor(product: CatalogProduct, color: Colorway = "morning") {
  const option = color === "morning" ? undefined : product.colors?.[color];
  return { id: option?.productId ?? product.id, name: option?.name ?? product.name, image: option?.image ?? product.image ?? "" };
}

const at = (slotId: string, productId: string, color?: Colorway): StyledPlacement => ({ slotId, productId, color });

/** Curated looks for Style this room, mixing Arcade products and colorways. */
export const LOOKS: Record<Room, Look[]> = {
  living: [
    {
      name: "Morning light",
      items: [
        at("liv-rug-main", fabric), at("liv-pillow-l", pillow), at("liv-pillow-r", outdoor), at("liv-pillow-c", pillow),
        at("liv-throw-arm", quilt), at("liv-curtain-l", curtain), at("liv-curtain-r", curtain),
        at("liv-pouf-l", floorPillow), at("liv-pouf-r", floorPillow), at("liv-runner", tablecloth),
      ],
    },
    {
      name: "Fern Ledger",
      items: [
        at("liv-rug-main", fabric), at("liv-pillow-l", pillow, "sage"), at("liv-pillow-c", pillow, "sage"), at("liv-pillow-r", pillow, "sage"),
        at("liv-throw-arm", quilt, "sage"), at("liv-curtain-l", curtain, "sage"), at("liv-curtain-r", curtain, "sage"),
        at("liv-pouf-l", floorPillow), at("liv-runner", tablecloth), at("liv-lamp", lampshade),
      ],
    },
    {
      name: "Mushroom & moss",
      items: [
        at("liv-rug-main", fabric), at("liv-pillow-l", pillow, "bramble"), at("liv-pillow-c", pillow), at("liv-pillow-r", pillow, "bramble"),
        at("liv-throw-arm", quilt, "bramble"), at("liv-curtain-l", curtain, "bramble"), at("liv-curtain-r", curtain, "bramble"),
        at("liv-pouf-r", floorPillow), at("liv-runner", napkins), at("liv-lamp", lampshade),
      ],
    },
    {
      name: "Sage & plum",
      items: [
        at("liv-rug-main", fabric), at("liv-pillow-l", pillow, "sage"), at("liv-pillow-c", pillow, "bramble"), at("liv-pillow-r", pillow, "sage"),
        at("liv-throw-arm", quilt), at("liv-curtain-l", curtain, "sage"), at("liv-curtain-r", curtain, "sage"),
        at("liv-pouf-l", floorPillow), at("liv-pouf-r", floorPillow), at("liv-lamp", lampshade),
      ],
    },
    {
      name: "Quiet edit",
      items: [
        at("liv-rug-main", fabric), at("liv-pillow-l", outdoor), at("liv-pillow-r", pillow, "bramble"),
        at("liv-curtain-l", curtain), at("liv-curtain-r", curtain), at("liv-runner", towels),
      ],
    },
  ],
  bedroom: [
    {
      name: "Morning light",
      items: [
        at("bed-rug-main", fabric), at("bed-duvet", duvet), at("bed-pillow-l", pillow), at("bed-pillow-r", outdoor), at("bed-pillow-c", sham),
        at("bed-curtain-l", curtain), at("bed-curtain-r", curtain), at("bed-pouf-l", floorPillow),
        at("bed-runner-l", towels), at("bed-runner-r", napkins),
      ],
    },
    {
      name: "Fern Ledger retreat",
      items: [
        at("bed-rug-main", fabric), at("bed-duvet", duvet, "sage"), at("bed-pillow-l", pillow, "sage"), at("bed-pillow-r", pillow, "sage"),
        at("bed-curtain-l", curtain, "sage"), at("bed-curtain-r", curtain, "sage"), at("bed-pouf-l", floorPillow),
        at("bed-lamp-l", lampshade), at("bed-lamp-r", lampshade),
      ],
    },
    {
      name: "Mushroom Accent",
      items: [
        at("bed-rug-main", fabric), at("bed-duvet", duvet, "bramble"), at("bed-pillow-l", pillow, "bramble"), at("bed-pillow-r", pillow, "bramble"),
        at("bed-curtain-l", curtain, "bramble"), at("bed-curtain-r", curtain, "bramble"), at("bed-pouf-l", floorPillow),
        at("bed-runner-l", towels), at("bed-runner-r", napkins),
      ],
    },
    {
      name: "Sage & plum",
      items: [
        at("bed-rug-main", fabric), at("bed-duvet", duvet, "bramble"), at("bed-pillow-l", pillow, "sage"), at("bed-pillow-r", pillow, "sage"),
        at("bed-curtain-l", curtain, "sage"), at("bed-curtain-r", curtain, "sage"),
        at("bed-lamp-l", lampshade), at("bed-lamp-r", lampshade), at("bed-runner-l", napkins),
      ],
    },
    {
      name: "Botanical mix",
      items: [
        at("bed-rug-main", fabric), at("bed-duvet", duvet, "sage"), at("bed-pillow-l", pillow, "bramble"), at("bed-pillow-r", pillow, "bramble"),
        at("bed-pillow-c", sham), at("bed-curtain-l", curtain, "bramble"), at("bed-curtain-r", curtain, "bramble"),
        at("bed-pouf-l", floorPillow), at("bed-lamp-l", lampshade), at("bed-lamp-r", lampshade),
      ],
    },
  ],
};

export function seedPlacements(ids: string[]) {
  const living: { slotId: string; productId: string; rotation: number; delay: number }[] = [];
  const bedroom: { slotId: string; productId: string; rotation: number; delay: number }[] = [];
  ids.forEach((id, index) => {
    const slotId = DEFAULT_SLOT[id];
    const slot = slotId ? slotById.get(slotId) : undefined;
    const product = catalogById.get(id);
    if (!slot || !product || !productFitsSlot(product, slot)) return;
    const entry = { slotId, productId: id, rotation: 0, delay: index * 40 };
    if (slot.room === "living") living.push(entry);
    else bedroom.push(entry);
  });
  return { living, bedroom };
}
