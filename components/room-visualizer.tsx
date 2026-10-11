"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Eye, Pencil, ShoppingBag, Sparkles, X } from "lucide-react";
import "./room-visualizer.css";
import {
  CATALOG,
  CATEGORIES,
  COLORWAYS,
  LOOKS,
  type CatalogProduct,
  type Category,
  type Colorway,
  type Placement,
  type Room,
  type RoomSlot,
  catalogById,
  colorsFor,
  colorwayById,
  layerFor,
  money,
  productInColor,
  productFitsSlot,
  seedPlacements,
  slotById,
  slotsFor,
} from "./room-catalog";
import { LAYER_BOX } from "./room-layers";

export type RoomCartLine = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  spots: string[];
};

type Placed = { slotId: string; productId: string; color?: Colorway; rotation: number; delay: number };

const STUDIO = "/vibes/moss-and-morning/studio";
const ROOM_PHOTO: Record<Room, string> = {
  living: `${STUDIO}/living.jpg?v=3`,
  bedroom: `${STUDIO}/bedroom.jpg?v=3`,
};
const ROOM_NAME: Record<Room, string> = { living: "Living room", bedroom: "Bedroom" };
const layerSrc = (layerId: string) => `${STUDIO}/layers/${layerId}.webp?v=4`;

const KIND_Z: Record<Placement, number> = {
  rug: 2,
  duvet: 3,
  curtain: 4,
  floorCushion: 5,
  tableTextile: 6,
  sofaPillow: 7,
  bedPillow: 7,
  throw: 9,
  lamp: 6,
};
const zFor = (slot: RoomSlot) => KIND_Z[slot.kind] + (slot.id === "bed-pillow-c" ? 1 : 0);

/** Alpha channel of each rendered layer, so clicks only land on actual fabric. */
const alphaCache = new Map<string, { w: number; h: number; data: Uint8ClampedArray }>();
function loadAlpha(layerId: string) {
  if (alphaCache.has(layerId) || typeof window === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  img.src = layerSrc(layerId);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    alphaCache.set(layerId, { w: canvas.width, h: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data });
  };
}
function hitsLayer(layerId: string, x: number, y: number) {
  const [l, t, w, h] = LAYER_BOX[layerId];
  if (x < l || x > l + w || y < t || y > t + h) return false;
  const alpha = alphaCache.get(layerId);
  if (!alpha) return true;
  const px = Math.min(alpha.w - 1, Math.floor(((x - l) / w) * alpha.w));
  const py = Math.min(alpha.h - 1, Math.floor(((y - t) / h) * alpha.h));
  return alpha.data[(py * alpha.w + px) * 4 + 3] > 40;
}

function boxStyle(slot: RoomSlot, extra?: React.CSSProperties, layerId = slot.id): React.CSSProperties {
  const [left, top, width, height] = LAYER_BOX[layerId] ?? slot.box;
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, zIndex: zFor(slot), ...extra };
}

export default function RoomVisualizer({
  seedIds = [],
  onBack,
  onChange,
  onAddToCart,
  onOpenCart,
}: {
  seedIds?: string[];
  onBack: () => void;
  onChange?: (productIds: string[]) => void;
  onAddToCart?: (roomName: string, lines: RoomCartLine[]) => void;
  onOpenCart?: () => void;
}) {
  const [room, setRoom] = useState<Room>("living");
  const [placements, setPlacements] = useState<Record<Room, Placed[]>>(() => seedPlacements(seedIds));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const [exiting, setExiting] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | "All">("All");
  const [shopOpen, setShopOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [preview, setPreview] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [status, setStatus] = useState("Add a piece, then choose where it lives.");
  const [carted, setCarted] = useState<Record<Room, string | null>>({ living: null, bedroom: null });
  const [looks, setLooks] = useState<Record<Room, number | null>>({ living: null, bedroom: null });
  const [fading, setFading] = useState<{ slotId: string; layerId: string } | null>(null);
  const reported = useRef("");

  const current = placements[room];
  const pending = pendingId ? catalogById.get(pendingId) ?? null : null;
  const selected = current.find((item) => item.slotId === selectedSlot) ?? null;
  const selectedProduct = selected ? catalogById.get(selected.productId) ?? null : null;
  const selectedMeta = selected ? slotById.get(selected.slotId) ?? null : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    Object.keys(LAYER_BOX).forEach(loadAlpha);
    (Object.values(ROOM_PHOTO) as string[]).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const ids = [...placements.living, ...placements.bedroom].map((item) => item.productId);
    const signature = ids.join("|");
    if (reported.current === signature) return;
    reported.current = signature;
    onChange?.(ids);
  }, [placements, onChange]);

  const roomRef = useRef(room);
  const selectedRef = useRef(selectedSlot);
  roomRef.current = room;
  selectedRef.current = selectedSlot;

  const subtotal = current.reduce((sum, item) => sum + (catalogById.get(item.productId)?.price ?? 0), 0);
  const otherRoom: Room = room === "living" ? "bedroom" : "living";
  const other = placements[otherRoom];
  const otherTotal = other.reduce((sum, item) => sum + (catalogById.get(item.productId)?.price ?? 0), 0);
  const roomCatalog = CATALOG.filter((product) => product.rooms.includes(room));
  const roomCategories = CATEGORIES.filter((entry) => roomCatalog.some((product) => product.category === entry));
  const visibleCatalog = roomCatalog.filter((product) => category === "All" || product.category === category);
  const selectedColors = selected && selectedProduct ? colorsFor(selectedProduct, selected.slotId) : [];
  const selectedLook = selected && selectedProduct ? productInColor(selectedProduct, selected.color) : null;
  const lookIndex = looks[room];
  const cartLines = useMemo(() => {
    const lines = new Map<string, RoomCartLine>();
    current.forEach((item) => {
      const product = catalogById.get(item.productId);
      const slot = slotById.get(item.slotId);
      if (!product || !slot) return;
      const look = productInColor(product, item.color);
      const line = lines.get(look.id);
      if (line) {
        line.quantity += 1;
        line.spots.push(slot.label);
      } else {
        lines.set(look.id, { id: look.id, name: look.name, category: product.category, price: product.price, image: look.image, quantity: 1, spots: [slot.label] });
      }
    });
    return [...lines.values()];
  }, [current]);
  const cartSignature = cartLines.map((line) => `${line.id}x${line.quantity}`).sort().join("|");
  const inCart = carted[room] !== null && carted[room] === cartSignature;

  function addRoomToCart() {
    if (!cartLines.length) return;
    onAddToCart?.(ROOM_NAME[room], cartLines);
    setCarted((value) => ({ ...value, [room]: cartSignature }));
    setStatus(`${ROOM_NAME[room]} added to your cart as one group.`);
  }
  const pickSlots = pending ? slotsFor(pending, room) : [];
  const moveSlots = useMemo(() => {
    if (!selectedProduct || pending) return [];
    return slotsFor(selectedProduct, room).filter((slot) => slot.id !== selectedSlot);
  }, [selectedProduct, pending, room, selectedSlot]);

  function switchRoom(next: Room) {
    setRoom(next);
    setPendingId(null);
    setSelectedSlot(null);
    setConfirmReset(false);
    setCategory((value) => (value === "All" || CATALOG.some((product) => product.category === value && product.rooms.includes(next)) ? value : "All"));
    setStatus(next === "living" ? "Sofa, window, floor and coffee table are open." : "Bed, window, floor and nightstands are open.");
  }

  function place(slot: RoomSlot, product: CatalogProduct) {
    setPlacements((currentPlacements) => {
      const previous = currentPlacements[slot.room].find((item) => item.slotId === slot.id);
      const color = previous?.productId === product.id && colorsFor(product, slot.id).includes(previous.color ?? "morning") ? previous.color : undefined;
      return {
        ...currentPlacements,
        [slot.room]: [
          ...currentPlacements[slot.room].filter((item) => item.slotId !== slot.id),
          { slotId: slot.id, productId: product.id, color, rotation: 0, delay: 0 },
        ],
      };
    });
    setPendingId(null);
    setSelectedSlot(slot.id);
    setRoom(slot.room);
    setStatus(`${product.name} · ${slot.label.toLowerCase()}.`);
  }

  function beginAdd(product: CatalogProduct) {
    setConfirmReset(false);
    setPreview(false);
    if (selected && selectedMeta && productFitsSlot(product, selectedMeta)) {
      place(selectedMeta, product);
      setStatus(`${product.name} swapped in · ${selectedMeta.label.toLowerCase()}.`);
      return;
    }
    const options = slotsFor(product, room);
    if (options.length === 1) {
      place(options[0], product);
      return;
    }
    setSelectedSlot(null);
    setPendingId(product.id);
    setStatus(`Where should the ${product.name} go?`);
  }

  function removeSlot(slotId: string, from: Room) {
    setExiting(slotId);
    window.setTimeout(() => {
      setPlacements((currentPlacements) => ({
        ...currentPlacements,
        [from]: currentPlacements[from].filter((item) => item.slotId !== slotId),
      }));
      setExiting((value) => (value === slotId ? null : value));
      setSelectedSlot((value) => (value === slotId ? null : value));
    }, 260);
  }

  function moveSelected(to: RoomSlot) {
    if (!selected || !selectedProduct || !productFitsSlot(selectedProduct, to)) return;
    setPlacements((currentPlacements) => {
      const list = currentPlacements[room];
      const occupant = list.find((item) => item.slotId === to.id);
      if (!occupant) {
        return {
          ...currentPlacements,
          [room]: list.map((item) => (item.slotId === selected.slotId ? { ...item, slotId: to.id } : item)),
        };
      }
      const otherProduct = catalogById.get(occupant.productId);
      const from = slotById.get(selected.slotId);
      if (!otherProduct || !from || !productFitsSlot(otherProduct, from)) return currentPlacements;
      return {
        ...currentPlacements,
        [room]: list.map((item) => {
          if (item.slotId === selected.slotId) return { ...occupant, slotId: selected.slotId };
          if (item.slotId === to.id) return { ...selected, slotId: to.id };
          return item;
        }),
      };
    });
    setSelectedSlot(to.id);
    setStatus(`${selectedProduct.name} moved · ${to.label.toLowerCase()}.`);
  }

  function slotAt(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const hits = current
      .filter((item) => hitsLayer(layerFor(item.slotId, item.color), x, y))
      .map((item) => slotById.get(item.slotId))
      .filter((slot): slot is RoomSlot => !!slot)
      .sort((a, b) => zFor(b) - zFor(a));
    return hits[0] ?? null;
  }

  function onCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    if (preview || pendingId) return;
    const slot = slotAt(event);
    if (!slot) {
      setSelectedSlot(null);
      return;
    }
    if (selectedSlot && selectedSlot !== slot.id && moveSlots.some((candidate) => candidate.id === slot.id)) {
      moveSelected(slot);
      return;
    }
    setSelectedSlot((value) => (value === slot.id ? null : slot.id));
  }

  function onCanvasMove(event: React.MouseEvent<HTMLDivElement>) {
    if (preview || pendingId) {
      if (hoverSlot) setHoverSlot(null);
      return;
    }
    const id = slotAt(event)?.id ?? null;
    if (id !== hoverSlot) setHoverSlot(id);
  }

  function styleRoom(index = lookIndex ?? 0) {
    const options = LOOKS[room];
    const next = (index + options.length) % options.length;
    const look = options[next];
    const plan = look.items.map((item, order) => ({ ...item, rotation: 0, delay: order * 70 }));
    setPlacements((currentPlacements) => ({ ...currentPlacements, [room]: plan }));
    setLooks((value) => ({ ...value, [room]: next }));
    setPendingId(null);
    setSelectedSlot(null);
    setConfirmReset(false);
    setStatus(`${look.name} · look ${next + 1} of ${options.length}. Tap any piece to change its colorway.`);
  }

  function setColor(color: Colorway) {
    if (!selected || !selectedProduct || (selected.color ?? "morning") === color) return;
    const slotId = selected.slotId;
    setFading({ slotId, layerId: layerFor(slotId, selected.color) });
    window.setTimeout(() => setFading((value) => (value?.slotId === slotId ? null : value)), 520);
    setPlacements((currentPlacements) => ({
      ...currentPlacements,
      [room]: currentPlacements[room].map((item) => (item.slotId === slotId ? { ...item, color, delay: 0 } : item)),
    }));
    setStatus(`${productInColor(selectedProduct, color).name} · ${colorwayById.get(color)?.name} colorway.`);
  }

  function finish() {
    setPendingId(null);
    setSelectedSlot(null);
    setConfirmReset(false);
    setPreview(true);
  }

  const removeRef = useRef(removeSlot);
  removeRef.current = removeSlot;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "Escape") {
        setPendingId(null);
        setSelectedSlot(null);
        setShopOpen(false);
        setConfirmReset(false);
        setPreview(false);
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedRef.current) {
        event.preventDefault();
        removeRef.current(selectedRef.current, roomRef.current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function resetRoom() {
    if (!confirmReset && current.length) {
      setConfirmReset(true);
      return;
    }
    setPlacements((currentPlacements) => ({ ...currentPlacements, [room]: [] }));
    setLooks((value) => ({ ...value, [room]: null }));
    setPendingId(null);
    setSelectedSlot(null);
    setConfirmReset(false);
    setPreview(false);
    setStatus("Back to a quiet room.");
  }

  const occupied = new Set(current.map((item) => item.slotId));
  const choiceSlots = preview ? [] : pending ? pickSlots : moveSlots;

  return (
    <section className={preview ? "viz is-preview" : "viz"}>
      <div className="viz-toolbar">
        <button className="viz-back" type="button" onClick={onBack}>← Moss & Morning</button>
        <div className="viz-title">
          <span>{preview ? "YOUR ROOM" : "ROOM STUDIO"}</span>
          <strong>{ROOM_NAME[room]}</strong>
        </div>
        <div className="viz-switch" role="group" aria-label="Room type">
          <button type="button" aria-pressed={room === "living"} onClick={() => switchRoom("living")}>Living room</button>
          <button type="button" aria-pressed={room === "bedroom"} onClick={() => switchRoom("bedroom")}>Bedroom</button>
        </div>
        {!preview && (
          <>
            {lookIndex === null ? (
              <button className="viz-text-btn" type="button" onClick={() => styleRoom(0)}><Sparkles size={14} /> Style this room</button>
            ) : (
              <div className="viz-looks" role="group" aria-label="Styled looks">
                <button type="button" aria-label="Previous look" onClick={() => styleRoom(lookIndex - 1)}><ChevronLeft size={16} /></button>
                <button className="viz-look-name" type="button" onClick={() => styleRoom(lookIndex)} title="Restyle with this look">
                  <Sparkles size={13} />
                  <span><small>Look {lookIndex + 1} / {LOOKS[room].length}</small>{LOOKS[room][lookIndex].name}</span>
                </button>
                <button type="button" aria-label="Next look" onClick={() => styleRoom(lookIndex + 1)}><ChevronRight size={16} /></button>
              </div>
            )}
            <button className={confirmReset ? "viz-ghost-btn viz-danger" : "viz-ghost-btn"} type="button" onClick={resetRoom}>
              {confirmReset ? "Clear this room?" : "Reset"}
            </button>
            <button className="viz-done" type="button" onClick={finish} disabled={!current.length}><Check size={15} /> Done</button>
          </>
        )}
      </div>

      <div className="viz-body">
        <div className="viz-stage">
          <img key={`ambient-${room}`} className="stage-ambient" src={ROOM_PHOTO[room]} alt="" aria-hidden draggable={false} />
          <div
            className={`viz-canvas${hoverSlot ? " is-hovering" : ""}${comparing ? " is-comparing" : ""}`}
            onClick={onCanvasClick}
            onMouseMove={onCanvasMove}
            onMouseLeave={() => setHoverSlot(null)}
          >
            <img key={room} className="room-photo" src={ROOM_PHOTO[room]} alt={`A styled, empty ${ROOM_NAME[room].toLowerCase()}`} draggable={false} />
            {current.map((item) => {
              const slot = slotById.get(item.slotId);
              if (!slot) return null;
              const layerId = layerFor(slot.id, item.color);
              const was = fading?.slotId === slot.id && fading.layerId !== layerId ? fading.layerId : null;
              const classes = ["layer", `kind-${slot.kind}`];
              if (was) classes.push("is-recolor");
              if (item.slotId === selectedSlot && !preview) classes.push("is-selected");
              if (item.slotId === hoverSlot && item.slotId !== selectedSlot) classes.push("is-hover");
              if (exiting === item.slotId) classes.push("is-out");
              return [
                was && (
                  <img
                    key={`${slot.id}:was`}
                    className="layer is-fading"
                    src={layerSrc(was)}
                    alt=""
                    aria-hidden
                    draggable={false}
                    style={boxStyle(slot, undefined, was)}
                  />
                ),
                <img
                  key={`${item.slotId}:${item.productId}:${layerId}`}
                  className={classes.join(" ")}
                  src={layerSrc(layerId)}
                  alt=""
                  aria-hidden
                  draggable={false}
                  style={boxStyle(slot, { animationDelay: `${item.delay}ms` }, layerId)}
                />,
              ];
            })}
            {choiceSlots.filter((slot) => (pending ? true : !occupied.has(slot.id))).map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`ghost slot-${slot.id}`}
                style={boxStyle(slot, { zIndex: 20 })}
                onClick={(event) => {
                  event.stopPropagation();
                  if (pending) place(slot, pending);
                  else moveSelected(slot);
                }}
              >
                <img src={layerSrc(slot.id)} alt="" draggable={false} />
                <span className="ghost-label">{occupied.has(slot.id) ? `Replace · ${slot.label}` : slot.label}</span>
              </button>
            ))}
            <div className="room-light" aria-hidden />
            <div className="room-grain" aria-hidden />
          </div>
        </div>

        <aside className="viz-panel" inert={preview} aria-hidden={preview}>
          <header>
            <div>
              <span>YOUR ROOM</span>
              <strong>{current.length ? `${current.length} piece${current.length === 1 ? "" : "s"}` : "Empty"}</strong>
            </div>
            <p className="viz-status" aria-live="polite">{status}</p>
          </header>

          {pending && (
            <div className="viz-focus is-pending">
              <span className="swatch"><img src={pending.image} alt="" /></span>
              <div>
                <small>Choose a spot</small>
                <strong>{pending.name}</strong>
                <em>Tap a glowing spot in the room.</em>
              </div>
              <div className="row">
                <button className="viz-mini" type="button" onClick={() => setPendingId(null)}>Cancel</button>
              </div>
            </div>
          )}

          {!pending && selected && selectedProduct && selectedMeta && (
            <div className="viz-focus">
              <span className="swatch"><img src={selectedLook?.image} alt="" /></span>
              <div>
                <small>{selectedMeta.label}</small>
                <strong>{selectedLook?.name}</strong>
                <em>{moveSlots.length ? "Tap a glowing spot to move it." : money(selectedProduct.price)}</em>
              </div>
              {selectedColors.length > 0 && (
                <div className="viz-colors" role="radiogroup" aria-label="Colorway">
                  <small>Colorway · <b>{colorwayById.get(selected.color ?? "morning")?.name}</b></small>
                  <div>
                    {selectedColors.map((color) => {
                      const entry = colorwayById.get(color);
                      const on = (selected.color ?? "morning") === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          aria-label={entry?.name}
                          title={entry?.name}
                          className={on ? "is-on" : undefined}
                          style={{ background: entry?.swatch }}
                          onClick={() => setColor(color)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="row">
                <button className="viz-mini danger" type="button" onClick={() => removeSlot(selected.slotId, room)}><X size={13} /> Remove</button>
                <button className="viz-mini solid" type="button" onClick={() => setSelectedSlot(null)}><Check size={13} /> Done</button>
              </div>
            </div>
          )}

          <div className="viz-list">
            {current.length === 0 && <div className="viz-empty">Nothing here yet. Pick a piece below, or let us <button type="button" onClick={() => styleRoom(0)}>style the whole room</button>.</div>}
            {current.map((item) => {
              const product = catalogById.get(item.productId);
              const slot = slotById.get(item.slotId);
              if (!product || !slot) return null;
              const look = productInColor(product, item.color);
              return (
                <div key={item.slotId} className={item.slotId === selectedSlot ? "viz-line-wrap is-on" : "viz-line-wrap"}>
                  <button className="viz-line" type="button" onClick={() => { setPreview(false); setSelectedSlot(item.slotId); }}>
                    <span className="swatch"><img src={look.image} alt="" /></span>
                    <span>
                      <strong>{look.name}</strong>
                      <small>{slot.label}</small>
                    </span>
                    <em>{money(product.price)}</em>
                  </button>
                  <button className="icon-x" type="button" aria-label={`Remove ${product.name}`} onClick={() => removeSlot(item.slotId, room)}><X size={14} /></button>
                </div>
              );
            })}
          </div>
          <footer>
            {other.length > 0 && (
              <button className="viz-other" type="button" onClick={() => switchRoom(otherRoom)}>
                <span>{ROOM_NAME[otherRoom]} · {other.length}</span>
                <span>{money(otherTotal)}</span>
              </button>
            )}
            <div className="viz-total"><span>Subtotal</span><b>{money(subtotal)}</b></div>
            <button className="viz-shop" type="button" disabled={!current.length} onClick={() => setShopOpen(true)}>
              <ShoppingBag size={15} /> Shop this room
            </button>
            <p className="viz-fine">{inCart ? "This room is in your cart." : "Live Arcade prices. Review the room, then add it to your cart."}</p>
          </footer>
        </aside>
      </div>

      {preview ? (
        <div className="viz-finale">
          <div>
            <small>MOSS & MORNING · {ROOM_NAME[room].toUpperCase()}</small>
            <strong>{current.length} pieces, made to order · {money(subtotal)}</strong>
          </div>
          <button
            className="viz-ghost-btn"
            type="button"
            onPointerDown={() => setComparing(true)}
            onPointerUp={() => setComparing(false)}
            onPointerLeave={() => setComparing(false)}
            onKeyDown={(event) => { if (event.key === " ") setComparing(true); }}
            onKeyUp={() => setComparing(false)}
          >
            <Eye size={14} /> Hold to see before
          </button>
          <button className="viz-text-btn" type="button" onClick={() => setPreview(false)}><Pencil size={14} /> Keep editing</button>
          <button className="viz-shop" type="button" onClick={() => setShopOpen(true)}><ShoppingBag size={15} /> Shop this room</button>
        </div>
      ) : (
        <div className="viz-dock">
          <div className="viz-dock-head">
            <div>
              <strong>Moss & Morning</strong>
              <p>Made-to-order Arcade textiles. Small pieces let you pick their spot.</p>
            </div>
            <div className="viz-filters" role="group" aria-label="Product categories">
              <button type="button" aria-pressed={category === "All"} onClick={() => setCategory("All")}>All</button>
              {roomCategories.map((entry) => (
                <button key={entry} type="button" aria-pressed={category === entry} onClick={() => setCategory(entry)}>{entry}</button>
              ))}
            </div>
          </div>
          <div className="viz-cards">
            {visibleCatalog.map((product) => {
              const placedHere = current.some((item) => item.productId === product.id);
              const onlySlot = slotsFor(product, room);
              let label = "Add to room";
              if (pendingId === product.id) label = "Choosing a spot…";
              else if (selectedMeta && productFitsSlot(product, selectedMeta)) label = "Swap in";
              else if (placedHere && onlySlot.length === 1) label = "In your room";
              return (
                <article key={product.id} className={`viz-card${pendingId === product.id ? " is-pending" : ""}${placedHere ? " is-placed" : ""}`}>
                  <div className="swatch">
                    <img src={product.image} alt="" />
                    {placedHere && <span className="placed-dot"><Check size={11} /></span>}
                  </div>
                  <div className="meta">
                    <small>{product.category}</small>
                    <strong>{product.name}</strong>
                    <b>
                      {money(product.price)}
                      {product.colors && (
                        <span className="viz-dots" title={`${COLORWAYS.length} colorways`}>
                          {COLORWAYS.map((entry) => <i key={entry.id} style={{ background: entry.swatch }} />)}
                        </span>
                      )}
                    </b>
                    <button className="viz-add" type="button" onClick={() => beginAdd(product)}>{label}</button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {shopOpen && (
        <div className="shop-shade" onClick={() => setShopOpen(false)}>
          <section className="shop-sheet" role="dialog" aria-labelledby="shop-title" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <div className="kicker">MOSS & MORNING · {ROOM_NAME[room].toUpperCase()}</div>
                <h2 id="shop-title">Shop this room</h2>
              </div>
              <button className="icon-x" type="button" aria-label="Close" onClick={() => setShopOpen(false)}><X size={16} /></button>
            </header>
            <div className="shop-lines">
              {current.map((item) => {
                const product = catalogById.get(item.productId);
                const slot = slotById.get(item.slotId);
                if (!product || !slot) return null;
                const look = productInColor(product, item.color);
                return (
                  <div key={item.slotId}>
                    <span className="swatch"><img src={look.image} alt="" /></span>
                    <span><strong>{look.name}</strong><small>{slot.label}</small></span>
                    <b>{money(product.price)}</b>
                  </div>
                );
              })}
            </div>
            <div className="shop-total"><span>Subtotal</span><b>{money(subtotal)}</b></div>
            <p>
              {inCart
                ? `Your ${ROOM_NAME[room].toLowerCase()} is in your cart, grouped together so you know what goes where.`
                : `Every piece is printed to order by Arcade. They go into your cart together as “${ROOM_NAME[room]}”, and Arcade’s bulk discounts come off automatically at checkout when the order qualifies.`}
            </p>
            {inCart ? (
              <button className="viz-primary" type="button" onClick={() => { setShopOpen(false); onOpenCart?.(); }}>
                <Check size={15} /> In your cart · View cart
              </button>
            ) : (
              <button className="viz-primary" type="button" onClick={addRoomToCart}>
                <ShoppingBag size={15} /> {carted[room] ? "Update room in cart" : "Add room to cart"} · {money(subtotal)}
              </button>
            )}
            <button className="viz-text-btn shop-back" type="button" onClick={() => setShopOpen(false)}>Back to the room <ArrowRight size={14} /></button>
          </section>
        </div>
      )}
    </section>
  );
}
