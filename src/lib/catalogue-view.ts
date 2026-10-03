export function splitCollections<T extends {category: string; packSize?: number}>(products: T[], limit?: number): {jewelry: T[]; cards: T[]} {
 const jewelry=products.filter(p=>["ear-clips","earrings-studs","necklaces"].includes(p.category));
 const cards=products.filter(p=>p.category === "handmade-cards" && (p.packSize ?? 1) === 1);
 return {jewelry: limit === undefined ? jewelry : jewelry.slice(0,limit), cards: limit === undefined ? cards : cards.slice(0,limit)};
}
