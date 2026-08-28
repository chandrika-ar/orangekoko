import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function AccountPage() {
  const t = await getTranslations("nav");
  return (
    <SimplePage title={t("account")}>
      <p>
        [占位页面 — customer accounts / order history are not part of this
        MVP. Orders are confirmed by email after checkout. Add login here in
        a later phase once order volume justifies it.]
      </p>
    </SimplePage>
  );
}
