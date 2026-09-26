const token = "puturtokenhere";

const response = await fetch("https://discord.com/api/v10/collectibles-categories", {
  headers: {
    Authorization: token,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
});

if (!response.ok) {
  throw new Error(`Discord returned ${response.status}: ${await response.text()}`);
}

const catalog = (await response.json()) as any;
const items: any[] = [];

const collect = (node: any, categoryName: string | null = null) => {
  if (!node || typeof node !== "object") return;

  const category =
    typeof node.name === "string" && Array.isArray(node.products) ? node.name : categoryName;

  if (
    node.type === 0 &&
    Array.isArray(node.items) &&
    node.items.some((item: any) => item.type === 0 && item.asset)
  ) {
    const item = node.items.find((entry: any) => entry.type === 0 && entry.asset);
    if (!item) return;

    const asset = item.asset;

    items.push({
      name: node.name ?? item.label ?? null,
      description: node.summary ?? null,
      category,
      skuId: node.sku_id ?? item.sku_id ?? null,
      asset,
      label: item.label ?? null,
      staticUrl: `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png`,
      animatedUrl: asset.startsWith("a_")
        ? `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?animated=true`
        : null,
    });

    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) collect(child, category);
    return;
  }

  for (const child of Object.values(node)) collect(child, category);
};

collect(catalog);

const decorations = [
  ...new Map(items.map((item) => [item.skuId, item])).values(),
];

await Bun.write("decorations.json", JSON.stringify(decorations, null, 2));
console.log(`Found ${decorations.length} avatar decorations.`);
console.log("Saved decorations.json");
