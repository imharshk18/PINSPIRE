"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Leaf, LoaderCircle, Plus, Search, ShoppingBag, Sparkles, Upload, X } from "lucide-react";
import RoomVisualizer, { type RoomCartLine } from "@/components/room-visualizer";
import { mossMorningInventory } from "../lib/moss-morning-inventory";
import { curatedGalleryRevision, mossMorningGalleries } from "../lib/moss-morning-galleries";

type ArcadeProduct = { id: string; name: string; category: string; price: string; image?: string; images?: string[]; status: "creating" | "ready" | "error"; error?: string };
/** A cart line. Lines added from the room visualizer share a group named after the room. */
type CartLine = ArcadeProduct & { key: string; quantity: number; group?: string; detail?: string };
const priceOf = (price: string) => Number(price.replace(/[^\d.]/g, "")) || 0;
/** Arcade quote for one product at a quantity: unit price before the maker's volume discount. */
type BulkQuote = { unit: number; makerId: string; maker: string; tiers: { min: number; percent: number }[] };
function quoteFrom(value: any): BulkQuote | null {
  const data = unwrap(value); const unit = Number(data?.unitPrice?.amount);
  if (!Number.isFinite(unit)) return null;
  const tiers = (data?.volumeDiscounts?.tiers ?? []).map((tier: any) => ({ min: Number(tier.minimumSpend), percent: Number(tier.discountPercent) })).filter((tier: { min: number; percent: number }) => Number.isFinite(tier.min) && Number.isFinite(tier.percent)).sort((a: { min: number }, b: { min: number }) => a.min - b.min);
  return { unit, makerId: data?.maker?.makerId ?? data?.maker?.name ?? "maker", maker: data?.maker?.name ?? "the maker", tiers };
}
const usd = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

function unwrap(value: any): any { return value?.data ?? value?.result ?? value; }
function productId(value: any): string | undefined { const data = unwrap(value); return data?.productId ?? data?.result?.productId; }
function jobId(value: any): string | undefined { const data = unwrap(value); return data?.jobId ?? data?.result?.jobId; }
function patternId(value: any): string | undefined { const data = unwrap(value); return data?.patternId ?? data?.result?.patternId; }
function asPrice(value: any): string { const price = unwrap(value)?.unitPrice; if (!price) return "Price loading"; const amount = Number(price.amount ?? price.value ?? price); return Number.isFinite(amount) ? new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency ?? "USD" }).format(amount) : "Price loading"; }
function homeTextile(value: any) { return value?.world === "print" && /pillow|cushion|throw|blanket|rug|carpet|curtain|drap|bedding|duvet|sheet|quilt|comforter|table|napkin|towel|bath|fabric|wall|tapestry|placemat|runner|tea towel|shower/i.test([value.name, value.category?.name, value.description].join(" ")); }
async function arcade(action: string, payload: Record<string, unknown>) { const response = await fetch("/api/arcade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) }); const result: any = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? result.error ?? "Arcade request failed"); return result; }
async function waitForArcadeJob(id: string) { for (let attempt = 0; attempt < 55; attempt++) { await new Promise(resolve => setTimeout(resolve, 3000)); const result = await arcade("jobs/get", { jobId: id }); const state = String(unwrap(result)?.status ?? "").toLowerCase(); if (state === "succeeded" || state === "completed") return result; if (state === "failed" || state === "cancelled") throw new Error(unwrap(result)?.error?.message ?? "Arcade could not create this item"); } throw new Error("Arcade is still making this collection. Keep the page open and try again shortly."); }

const base = "/vibes/moss-and-morning/";
const pins = [
  ["01-mushroom-bedding.png", "Mushroom embroidered bedding", "tall"],
  ["02-fern-curtain.png", "Fern print linen curtains", "tall"],
  ["03-forest-cabin.png", "Rainy forest cabin", "tall"],
  ["04-botanical-pillows.png", "Botanical pillow study", "medium"],
  ["05-floral-rug.png", "Sculpted green rug", "tall"],
  ["06-sage-bedroom.png", "Sage linen bedroom", "wide"],
  ["07-poufs.png", "Soft moss floor cushions", "medium"],
  ["08-leaf-rug.png", "Oversized leaf rug", "tall"],
  ["09-green-living.png", "Deep green living room", "tall"],
  ["10-sage-room.png", "Quiet green geometry", "wide"],
] as const;

const saltPins = [
  ["01-living.png", "Sunlit great room", "tall"],
  ["02-entry.png", "Quiet entryway", "tall"],
  ["03-linen-living.png", "Linen living room", "tall"],
  ["04-kitchen.png", "Brass and white kitchen", "wide"],
  ["05-bedroom.png", "Soft white bedroom", "tall"],
  ["06-bedroom-city.png", "City light bedroom", "tall"],
  ["07-bedroom-warm.png", "Warm oak bedroom", "wide"],
  ["08-bedroom-rug.png", "Blue rug bedroom", "tall"],
  ["09-bedroom-candlelight.png", "Candlelit soft room", "tall"],
  ["10-bedroom-cloud.png", "Cloud-white bedroom", "wide"],
] as const;

const petalPins = [
  ["01-flower-bed.png", "Flower-bed morning", "tall"],
  ["02-pink-study.png", "Pink study nook", "tall"],
  ["03-brass-bed.png", "Brass and blush bedroom", "wide"],
  ["04-pink-rug-bed.png", "Soft pink rug bedroom", "wide"],
  ["05-girl-era.png", "Petal reading corner", "tall"],
  ["06-petal-living.png", "Petal living room", "wide"],
  ["07-pink-sofa.png", "Sunlit pink sofa", "tall"],
  ["08-petal-lounge.png", "Blush lounge", "tall"],
  ["09-pink-salon.png", "Pink salon", "tall"],
] as const;

const featuredVibes = [
  { id: "moss", label: "FEATURED VIBE · 01", name: "Moss & Morning", description: "Forest-cabin calm for the softest corner of your world.", image: "/vibes/moss-and-morning/03-forest-cabin.png", open: true, tone: "moss" },
  { id: "salt", label: "NOT DEMO READY · 02", name: "Salt & Sunlight", description: "Quiet whites, warm oak, linen layers, and the kind of light that stays all afternoon.", image: "/vibes/salt-and-sunlight/03-linen-living.png", open: false, tone: "salt" },
  { id: "petal", label: "NOT DEMO READY · 03", name: "Petal Hour", description: "Blush textures, warm lamps, tiny bows, and an unapologetically sweet point of view.", image: "/vibes/petal-hour/08-petal-lounge.png", open: false, tone: "petal" },
] as const;

export default function Home() {
  const [screen, setScreen] = useState<"feed" | "board" | "room">("feed");
  const [seenRoom, setSeenRoom] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [shopCart, setShopCart] = useState<CartLine[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [productViews, setProductViews] = useState<Record<string, string[]>>(mossMorningGalleries);
  const [viewIndex, setViewIndex] = useState<Record<string, number>>({});
  useEffect(() => {
    setProductViews(current => ({ ...current, ...mossMorningGalleries }));
    setViewIndex(current => {
      const next = { ...current };
      Object.keys(mossMorningGalleries).forEach(id => { next[id] = 0; });
      return next;
    });
  }, [curatedGalleryRevision]);
  const [variantIndex, setVariantIndex] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showConnect, setShowConnect] = useState(false);
  const [arcadeProducts, setArcadeProducts] = useState<ArcadeProduct[]>(mossMorningInventory);
  const [arcadeProgress, setArcadeProgress] = useState("");
  const [arcadeError, setArcadeError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const shopTotal = shopCart.reduce((total, line) => total + priceOf(line.price) * line.quantity, 0);
  const featured = featuredVibes[featuredIndex];
  const cycleFeatured = (direction: -1 | 1) => setFeaturedIndex(index => (index + direction + featuredVibes.length) % featuredVibes.length);
  const homePins = featured.id === "salt" ? saltPins : featured.id === "petal" ? petalPins : pins;
  const homePinBase = featured.id === "salt" ? "/vibes/salt-and-sunlight/" : featured.id === "petal" ? "/vibes/petal-hour/" : base;
  const homeTitle = featured.id === "salt" ? <>Make room for<br/><em>lighter living.</em></> : featured.id === "petal" ? <>Make room for<br/><em>your softest self.</em></> : <>Find the room<br/><em>you keep saving.</em></>;
  const cartCount = shopCart.reduce((total, line) => total + line.quantity, 0);
  const [bulkQuotes, setBulkQuotes] = useState<Record<string, BulkQuote | null>>({});
  const cartQuantities = useMemo(() => {
    const quantities = new Map<string, number>();
    shopCart.forEach(line => quantities.set(line.id, (quantities.get(line.id) ?? 0) + line.quantity));
    return [...quantities];
  }, [shopCart]);
  useEffect(() => {
    cartQuantities.forEach(([id, quantity]) => {
      const key = `${id}:${quantity}`;
      if (key in bulkQuotes) return;
      setBulkQuotes(current => ({ ...current, [key]: null }));
      arcade("products/get", { productId: id, quantity }).then(result => setBulkQuotes(current => ({ ...current, [key]: quoteFrom(result) }))).catch(() => {});
    });
  }, [cartQuantities, bulkQuotes]);
  const bulk = useMemo(() => {
    if (!cartQuantities.length) return null;
    const makers = new Map<string, { maker: string; spend: number; tiers: BulkQuote["tiers"] }>();
    for (const [id, quantity] of cartQuantities) {
      const quote = bulkQuotes[`${id}:${quantity}`];
      if (!quote) return { pending: true as const };
      const entry = makers.get(quote.makerId) ?? { maker: quote.maker, spend: 0, tiers: quote.tiers };
      entry.spend += quote.unit * quantity;
      makers.set(quote.makerId, entry);
    }
    let estimate = 0; let nudge: { maker: string; gap: number; percent: number } | null = null; let best = 0; let topSpend = 0;
    makers.forEach(entry => {
      const tier = [...entry.tiers].reverse().find(candidate => entry.spend >= candidate.min);
      const percent = tier?.percent ?? 0;
      best = Math.max(best, percent);
      estimate += entry.spend * (1 - percent / 100);
      if (entry.spend <= topSpend) return;
      topSpend = entry.spend;
      const next = entry.tiers.find(candidate => candidate.min > entry.spend && candidate.percent > percent);
      nudge = next ? { maker: entry.maker, gap: next.min - entry.spend, percent: next.percent } : null;
    });
    return { pending: false as const, estimate, savings: Math.max(0, shopTotal - estimate), percent: best, nudge: nudge as { maker: string; gap: number; percent: number } | null };
  }, [cartQuantities, bulkQuotes, shopTotal]);
  const cartGroups = useMemo(() => {
    const groups = new Map<string, CartLine[]>();
    shopCart.forEach(line => { const name = line.group ?? ""; groups.set(name, [...(groups.get(name) ?? []), line]); });
    return [...groups.entries()].sort(([a], [b]) => (a === "" ? 1 : 0) - (b === "" ? 1 : 0));
  }, [shopCart]);
  const catalogueGroups = useMemo(() => Array.from(new Map(arcadeProducts.map(product => [product.category, arcadeProducts.filter(candidate => candidate.category === product.category)])).entries()), [arcadeProducts]);
  const chooseBoard = () => { setScreen("board"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openRoom = () => { setSeenRoom(true); setScreen("room"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  async function makeWithArcade() {
    setArcadeError(""); setIsCreating(true); setArcadeProgress("Finding every home textile Arcade can make…");
    try {
      const categoriesResponse = await arcade("categories/list", {});
      const catalogue = (unwrap(categoriesResponse)?.items ?? []).filter(homeTextile);
      if (!catalogue.length) throw new Error("Your Arcade account did not return any printable home-textile categories.");
      setArcadeProducts(catalogue.map((item: any) => ({ id: item.categoryId, name: item.name, category: item.category?.name ?? "Home textile", price: "Creating", status: "creating" })));
      setArcadeProgress("Creating Moss & Morning’s original botanical textile pattern…");
      const patternStart = await arcade("patterns/create", { requestId: crypto.randomUUID(), prompt: "An original sophisticated home textile print: tiny woodland ferns, mossy branches, delicate wildflowers and a few subtle toadstool silhouettes on warm flax linen. Quiet forest-cabin mood, muted sage, deep moss, cream and a touch of russet, hand-drawn ink texture, seamless repeat, no text, no logos." });
      const completedPattern = jobId(patternStart) ? await waitForArcadeJob(jobId(patternStart)!) : patternStart;
      const createdPattern = patternId(completedPattern);
      if (!createdPattern) throw new Error("Arcade did not return the Moss & Morning pattern.");
      let next = 0; let complete = 0;
      const worker = async () => {
        while (next < catalogue.length) {
          const category = catalogue[next++];
          try {
            setArcadeProgress(`Making ${complete + 1} of ${catalogue.length} products with Arcade…`);
            const options = await arcade("categories/get", { categoryId: category.categoryId, selections: {} });
            const resolved = unwrap(options);
            if (resolved.canManufacture === false) throw new Error("No manufacturable default configuration");
            const started = await arcade("products/create", { requestId: crypto.randomUUID(), patternId: createdPattern, categoryId: category.categoryId, selections: resolved.selections });
            const finished = jobId(started) ? await waitForArcadeJob(jobId(started)!) : started;
            const id = productId(finished); if (!id) throw new Error("No product ID returned");
            const product = await arcade("products/get", { productId: id, quantity: 1 }); const item = unwrap(product);
            setArcadeProducts(current => current.map(x => x.id === category.categoryId ? { ...x, id, name: item.title ?? category.name, category: item.category?.name ?? category.category?.name ?? "Home textile", price: asPrice(product), image: item.imageUrl ?? item.images?.[0]?.url, status: "ready" } : x));
          } catch (error) { setArcadeProducts(current => current.map(x => x.id === category.categoryId ? { ...x, status: "error", price: "Unavailable", error: error instanceof Error ? error.message : "Arcade creation failed" } : x)); }
          complete++;
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, catalogue.length) }, worker));
      setArcadeProgress("Your Moss & Morning collection is ready.");
    } catch (error) { setArcadeError(error instanceof Error ? error.message : "Could not create the Arcade collection."); }
    finally { setIsCreating(false); }
  }
  async function checkoutArcade(product?: ArcadeProduct) {
    const selected = product ? [{ ...product, quantity: 1 }] : shopCart.length ? shopCart : arcadeProducts.filter(item => item.status === "ready").map(item => ({ ...item, quantity: 1 }));
    if (!selected.length) return;
    const quantities = new Map<string, number>();
    selected.forEach(item => quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity));
    try {
      const result = await arcade("checkouts/create", { requestId: crypto.randomUUID(), lines: [...quantities].map(([productId, quantity]) => ({ productId, quantity })), dropShip: true });
      const url = unwrap(result)?.checkoutUrl; if (!url) throw new Error("Arcade did not return a checkout URL.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) { setArcadeError(error instanceof Error ? error.message : "Checkout could not open."); }
  }
  function addToShopCart(product: ArcadeProduct) {
    setShopCart(current => current.some(item => item.key === product.id) ? current : [...current, { ...product, key: product.id, quantity: 1 }]);
    setShowCart(true);
  }
  function addRoomToCart(room: string, lines: RoomCartLine[]) {
    const roomLines: CartLine[] = lines.map(line => ({ id: line.id, key: `${room}:${line.id}`, name: line.name, category: line.category, price: usd(line.price), image: line.image, status: "ready", quantity: line.quantity, group: room, detail: line.spots.join(" · ") }));
    setShopCart(current => {
      if (!current.some(line => line.group === room)) return [...roomLines, ...current];
      return current.flatMap(line => line.group !== room ? [line] : line === current.find(item => item.group === room) ? roomLines : []);
    });
  }
  function removeFromShopCart(key: string) { setShopCart(current => current.filter(line => line.key !== key)); }
  function removeCartGroup(group: string) { setShopCart(current => current.filter(line => line.group !== group)); }
  async function hydrateProductViews(product: ArcadeProduct) {
    let views = productViews[product.id] ?? product.images ?? (product.image ? [product.image] : []);
    if (views.length > 1) return views;
    try {
      const result = await arcade("products/get", { productId: product.id, quantity: 1 });
      const raw = (unwrap(result)?.images ?? []).map((image: { url?: string }) => image.url).filter(Boolean);
      // Arcade returns the styled in-room mockup last. Put that visual proof first.
      views = raw.length > 1 ? [raw[raw.length - 1], ...raw.slice(0, -1)] : raw;
      if (!views.length && product.image) views = [product.image];
      setProductViews(current => ({ ...current, [product.id]: views }));
      return views;
    } catch { return views; }
  }
  async function changeProductView(product: ArcadeProduct, direction: -1 | 1) {
    const views = await hydrateProductViews(product);
    if (views.length > 1) setViewIndex(current => ({ ...current, [product.id]: ((current[product.id] ?? 0) + direction + views.length) % views.length }));
  }

  return <main className={`pinspired ${screen === "feed" ? `${featured.tone}-home` : ""}`}>
    <header className="pin-header">
      <button className="pin-logo" onClick={() => setScreen("feed")} aria-label="Pinspired home"><span className="pin-logo-letter">P</span><span className="pin-logo-pin"/></button><button className="brand-wordmark" onClick={() => setScreen("feed")} aria-label="Pinspired home">pinspired<span>®</span></button>
      <button className={screen === "feed" ? "nav-pill selected" : "nav-pill"} onClick={() => setScreen("feed")}>Home</button>
      <button className="nav-pill" onClick={chooseBoard}>Explore</button>
      <label className="search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for a feeling"/></label>
      <button className="icon-button" onClick={() => setShowConnect(true)} aria-label="Connect Pinterest"><Upload size={18}/></button>
      <button className="cart-button" onClick={() => setShowCart(true)}><ShoppingBag size={18}/><span>{cartCount}</span></button>
      <button className="avatar">K</button>
    </header>

    {screen === "feed" && <>
      <section className="discover-head">
        <div><span className="kicker"><Leaf size={13}/> {featured.id === "salt" ? "THE LIGHT HOME EDIT" : featured.id === "petal" ? "THE PETAL HOUR EDIT" : "THE PINspired HOME EDIT"}</span><h1>{homeTitle}</h1><p>{featured.id === "salt" ? "A study in soft white, natural oak, and the pieces that let daylight do the work." : featured.id === "petal" ? "An affectionate mix of blush, cream, bows, and rooms that feel like a little celebration." : "Explore a point of view. Bring it home through a collection of made-to-order textiles."}</p></div>
        <div className="connect-card"><div className="connect-mark pinterest-mark"><img src="/pinterest-mark.png" alt="Pinterest"/></div><div><strong>{featured.id === "salt" || featured.id === "petal" ? "Your next look is waiting." : "Your boards already know."}</strong><span>{featured.id === "salt" ? "Connect Pinterest to build a personal edit from every light-filled room you save." : featured.id === "petal" ? "Connect Pinterest to turn the sweetest corners you save into a personal home edit." : "Connect Pinterest to turn your saved inspiration into a home collection."}</span></div><button onClick={() => setShowConnect(true)}>Connect <ArrowRight size={15}/></button></div>
      </section>
      <section className={`vibe-carousel ${featured.tone}`} aria-label="Featured home aesthetics">
        <article className={`vibe-hero ${featured.open ? "is-open" : "is-preview"}`} onClick={featured.open ? chooseBoard : undefined} role={featured.open ? "button" : undefined} tabIndex={featured.open ? 0 : undefined}>
          <img key={featured.image} src={featured.image} alt={`${featured.name} home inspiration`}/>
          <div className="vibe-overlay" key={featured.id}><span>{featured.label}</span><h2>{featured.name}</h2><p>{featured.description}</p>{featured.open && <button>Open the board <ArrowRight size={18}/></button>}{!featured.open && <div className="coming-soon">Not demo ready</div>}</div>
        </article>
        <button className="vibe-nav previous" onClick={() => cycleFeatured(-1)} aria-label="Previous aesthetic"><ChevronLeft size={17}/></button>
        <button className="vibe-nav next" onClick={() => cycleFeatured(1)} aria-label="Next aesthetic"><ChevronRight size={17}/></button>
        <div className="vibe-pagination">{featuredVibes.map((vibe, index) => <button key={vibe.id} className={index === featuredIndex ? "active" : ""} onClick={() => setFeaturedIndex(index)} aria-label={`Show ${vibe.name}`}>{String(index + 1).padStart(2, "0")}</button>)}</div>
      </section>
      <section className="feed-title"><div><h2>{featured.id === "salt" ? "Salt & Sunlight saved" : featured.id === "petal" ? "Petal Hour saved" : "Home ideas for you"}</h2><p>{featured.id === "salt" ? "A warm-white collection, for browsing now." : featured.id === "petal" ? "A blush-toned collection, for browsing now." : "Choose a mood. We&apos;ll make it shoppable."}</p></div><span>{featured.open ? "3 featured vibes" : "Not demo ready"}</span></section>
      <section className="pin-grid">{homePins.filter(([, title]) => title.toLowerCase().includes(search.toLowerCase())).map(([file, title, shape]) => <article className={`pin ${shape} ${featured.open ? "is-open" : "is-preview"} ${file === "02-pink-study.png" ? "pin-tight-crop" : ""}`} key={file} onClick={featured.open ? chooseBoard : undefined}><img src={`${homePinBase}${file}`} alt={title}/><div className="pin-hover"><button onClick={e => { e.stopPropagation(); setSaved(x => x.includes(file) ? x.filter(id => id !== file) : [...x, file]); }}><Heart size={17} fill={saved.includes(file) ? "currentColor" : "none"}/></button><span>{featured.name}</span></div></article>)}</section>
    </>}

    {screen === "board" && <>
      <section className="board-head"><button className="back" onClick={() => setScreen("feed")}>← Home</button><div className="board-actions"><button onClick={() => setShowConnect(true)}>Connect your Pinterest</button><button className="primary" onClick={openRoom}>Decorate a room <ArrowRight size={16}/></button></div></section>
      <section className="mood-intro"><div className="board-cover"><img src={`${base}03-forest-cabin.png`} alt="Moss & Morning"/></div><div><span className="kicker"><Leaf size={13}/> VIBE 01 / 04</span><h1>Moss &amp; Morning</h1><p>Earthy, tucked-in, and just a little enchanted. Moss &amp; Morning layers sage linen, botanical drawings, soft amber light, and the feeling of rain gathering on the windows.</p><div className="palette"><i/><i/><i/><i/><span>sage · bark · cream · mushroom</span></div><div className="tag-row"><span>forest cabin</span><span>botanical</span><span>slow mornings</span><span>soft texture</span></div></div></section>
      <section className="board-pins">{pins.slice(0, 6).map(([file, title]) => <figure key={file}><img src={`${base}${file}`} alt={title}/><figcaption>{title}</figcaption></figure>)}</section>
      <section className="shop-head"><div><span className="kicker">MADE WITH ARCADE</span><h2>Bring Moss &amp; Morning home.</h2><p>These are real, ready-to-buy Arcade products with current product images and guaranteed prices.</p></div><div className="shop-actions"><button className="secondary" onClick={makeWithArcade} disabled={isCreating}>{isCreating ? <><LoaderCircle className="spin" size={17}/> Making</> : <><Sparkles size={17}/> Make a fresh collection</>}</button><button className="primary" onClick={() => checkoutArcade()}>Shop ready pieces <ShoppingBag size={17}/></button></div></section>
      {arcadeProgress && <div className="arcade-progress"><LoaderCircle className={isCreating ? "spin" : ""} size={16}/>{arcadeProgress}</div>}{arcadeError && <div className="arcade-error">{arcadeError}</div>}
      <section className="catalogue-grid">{catalogueGroups.map(([category, variants]) => { const selected = variants[variantIndex[category] ?? 0]; const views = productViews[selected.id] ?? selected.images ?? (selected.image ? [selected.image] : []); const image = views[viewIndex[selected.id] ?? 0] ?? selected.image; const designName = (product: ArcadeProduct) => product.name.includes("Fern") ? "Fern Ledger" : product.name.includes("Mushroom") ? "Mushroom Accent" : "Botanical Main"; return <article className="product" key={category}><div className="product-img">{image ? <img key={image} src={image} alt={selected.name} loading="eager" fetchPriority="high"/> : <div className="product-placeholder"><Leaf size={44}/></div>}<span>ARCADE MADE</span><button className="image-arrow previous" onClick={() => changeProductView(selected, -1)} aria-label="Previous product view"><ChevronLeft size={18}/></button><button className="image-arrow next" onClick={() => changeProductView(selected, 1)} aria-label="Next product view"><ChevronRight size={18}/></button>{views.length > 1 && <div className="image-dots">{views.map((_, view) => <i className={view === (viewIndex[selected.id] ?? 0) ? "active" : ""} key={view}/>)}</div>}</div><div className="product-info"><small>{category}</small><h3>{selected.name}</h3><div className="price-row"><b>{selected.price}</b><div className="design-swatches" aria-label={`${category} design options`}>{variants.map((variant, index) => <button key={variant.id} className={`${designName(variant).toLowerCase().replace(/ /g, "-")} ${index === (variantIndex[category] ?? 0) ? "selected" : ""}`} onClick={() => { setVariantIndex(current => ({ ...current, [category]: index })); setViewIndex(current => ({ ...current, [variant.id]: 0 })); hydrateProductViews(variant); }} title={designName(variant)} aria-label={`Select ${designName(variant)}`}/>)}</div></div><div className="card-actions"><button className="visualize" onClick={openRoom}>Visualize</button><button onClick={() => addToShopCart(selected)}>{shopCart.some(item => item.key === selected.id) ? "In cart" : <><Plus size={15}/> Add</>}</button></div><span className="design-label">{designName(selected)}</span></div></article>})}</section>
      <button className="custom-request"><Sparkles size={18}/><span><strong>Looking for something else?</strong> Tell us what you&apos;re imagining and we&apos;ll make it with Arcade.</span><ChevronRight size={20}/></button>
    </>}

    {seenRoom && <div style={{ display: screen === "room" ? "block" : "none" }}><RoomVisualizer seedIds={cart} onBack={() => setScreen("board")} onChange={setCart} onAddToCart={addRoomToCart} onOpenCart={() => setShowCart(true)} /></div>}

    {showConnect && <div className="modal-shade" onClick={() => setShowConnect(false)}><section className="connect-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowConnect(false)}><X size={19}/></button><div className="connect-mark pinterest-mark"><img src="/pinterest-mark.png" alt="Pinterest"/></div><span className="kicker">YOUR HOME, CURATED</span><h2>Connect your Pinterest.</h2><p>Choose the boards that feel most like you. When access is ready, Pinspired will use them to curate a home textile collection around your taste.</p><button className="primary" onClick={() => setShowConnect(false)}>Connect Pinterest <ArrowRight size={16}/></button><small>For today&apos;s demo, browse Moss &amp; Morning or upload inspiration images in the next version.</small></section></div>}
    {showCart && <div className="modal-shade" onClick={() => setShowCart(false)}><section className="cart-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowCart(false)}><X size={19}/></button><span className="kicker"><ShoppingBag size={13}/> YOUR PINspired CART</span><h2>Your home edit</h2>{shopCart.length ? <>{cartGroups.map(([group, lines]) => <div className={group ? "cart-group is-room" : "cart-group"} key={group || "pieces"}>{(group || cartGroups.length > 1) && <div className="cart-group-head"><span><small>{group ? "ROOM" : "PIECES"}</small><strong>{group || "Other pieces"}</strong><em>{lines.reduce((n, line) => n + line.quantity, 0)} items · {usd(lines.reduce((n, line) => n + priceOf(line.price) * line.quantity, 0))}</em></span>{group && <><button className="cart-group-edit" onClick={() => { setShowCart(false); openRoom(); }}>Edit room</button><button className="cart-group-remove" onClick={() => removeCartGroup(group)} aria-label={`Remove ${group} from cart`}><X size={15}/></button></>}</div>}<div className="checkout-items">{lines.map(line => <div key={line.key}><img src={line.image} alt=""/><span><strong>{line.name}{line.quantity > 1 && <i className="qty"> × {line.quantity}</i>}</strong><small>{line.detail ?? line.category}</small></span><b>{line.quantity > 1 ? usd(priceOf(line.price) * line.quantity) : line.price}</b><button onClick={() => removeFromShopCart(line.key)} aria-label={`Remove ${line.name}`}><X size={15}/></button></div>)}</div></div>)}<div className="checkout-total"><span>Total</span><strong>${shopTotal.toFixed(2)}</strong></div>{bulk && <div className={bulk.pending ? "bulk-note is-pending" : "bulk-note"}>{bulk.pending ? <span>Checking Arcade bulk pricing…</span> : <>{bulk.savings >= 0.5 ? <><div className="bulk-row"><span><Sparkles size={13}/> Bulk discount at checkout</span><b>−{usd(bulk.savings)}</b></div><div className="bulk-row is-total"><span>Estimated checkout total</span><strong>{usd(bulk.estimate)}</strong></div></> : null}<p>{bulk.savings >= 0.5 ? `Arcade applies its makers’ volume discounts automatically at checkout${bulk.percent ? ` (up to ${bulk.percent}% off this order)` : ""}, and multiples of the same piece cost less each. Your checkout total will be lower than the list price above.` : "Bulk discounts are applied automatically at checkout when your order qualifies: makers take a percentage off once you spend over a threshold, and multiples of the same piece cost less each."}{bulk.nudge ? ` Add ${usd(bulk.nudge.gap)} more from ${bulk.nudge.maker} to unlock ${bulk.nudge.percent}% off.` : ""}</p></>}</div>}<button className="primary checkout" onClick={() => checkoutArcade()}>Checkout with Arcade <ArrowRight size={16}/></button></> : <p className="empty-cart">Add a few Moss &amp; Morning pieces, then check out as one coordinated home edit.</p>}</section></div>}
  </main>;
}
