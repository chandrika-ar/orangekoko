"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TryOnStage } from "@/components/atelier/try-on/try-on-stage";
import type { JourneyItem } from "@/components/atelier/journey/types";

export function TryOnPicker({items}: {items: JourneyItem[]}) {
 const t=useTranslations("tryOnShop"); const shop=useTranslations("cardShop"); const journey=useTranslations("atelierJourney");
 const [selected,setSelected]=useState(items[0]?.slug ?? "");
 const item=items.find(item=>item.slug === selected) ?? null;
 return <div className="mt-10 grid gap-10 md:grid-cols-2">
 <div className="border border-line bg-cream-deep p-6 sm:p-8"><h2 className="font-display text-2xl">{t("selectTitle")}</h2>
 {items.length ? <><label className="mt-6 block text-sm"><span>{t("selectLabel")}</span><select value={selected} onChange={event=>setSelected(event.target.value)} className="mt-3 w-full border border-line bg-cream p-3">{items.map(item=><option key={item.slug} value={item.slug}>{item.title} — {item.priceLabel}</option>)}</select></label>{item && <Link href={`/product/${item.slug}`} className="mt-6 inline-block border-b border-ink pb-1 text-sm">{journey("viewDetails")}</Link>}</> : <p className="mt-5 text-sm leading-relaxed text-ink-soft">{t("empty")}</p>}
 <Link href="/jewelry" className="mt-8 block w-fit border-b border-ink pb-1 text-sm">{shop("browseJewelry")}</Link></div>
 <div><TryOnStage item={item}/>{!item && <p className="mx-auto mt-4 max-w-xs text-center text-sm text-ink-soft">{t("cameraOnly")}</p>}</div>
 </div>;
}
