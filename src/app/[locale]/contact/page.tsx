import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";
import { ChatWidget } from "@/components/contact/chat-widget";
import { isChatConfigured } from "@/lib/anthropic";

export default async function ContactPage() {
  const t = await getTranslations("footer");
  const tc = await getTranslations("chat");
  const supportEmail = process.env.SUPPORT_EMAIL;

  return (
    <SimplePage title={t("contact")}>
      <p>{tc("pageIntro")}</p>
      <ChatWidget configured={isChatConfigured} />
      <p className="text-sm">
        {tc("escalation")}
        {supportEmail && (
          <>
            {" "}
            <a href={`mailto:${supportEmail}`} className="underline">
              {supportEmail}
            </a>
          </>
        )}
      </p>
    </SimplePage>
  );
}
