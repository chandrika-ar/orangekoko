import { useTranslations } from "next-intl";

export function ConditionSection() {
  const t = useTranslations("home");

  const left = [t("condition1"), t("condition2"), t("condition3")];
  const right = [t("condition4"), t("condition5"), t("condition6")];

  return (
    <section className="bg-cream-deep">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_220px] lg:px-8">
        <div className="text-center lg:text-left">
          <h2 className="font-display text-3xl">{t("conditionTitle")}</h2>
          <span className="mx-auto mt-3 mb-8 block h-px w-10 bg-accent lg:mx-0" />
          <div className="grid grid-cols-1 gap-x-10 gap-y-2 text-sm leading-relaxed text-ink-soft sm:grid-cols-2">
            <ul className="space-y-2">
              {left.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <ul className="space-y-2">
              {right.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/condition-illustration.svg"
          alt=""
          className="hidden aspect-[3/4] w-full object-cover lg:block"
        />
      </div>
    </section>
  );
}
