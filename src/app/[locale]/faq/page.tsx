import { getTranslations } from "next-intl/server";
import { Accordion } from "@/components/shop/accordion";

export default async function FaqPage() {
  const t = await getTranslations("faq");
  const footerT = await getTranslations("footer");

  const items = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    return {
      title: t(`q${n}`),
      content: (
        <div className="space-y-3">
          {t(`a${n}`)
            .split("\n\n")
            .map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
        </div>
      ),
    };
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl">{footerT("faq")}</h1>
      <div className="mt-8">
        <Accordion items={items} />
      </div>
    </div>
  );
}
