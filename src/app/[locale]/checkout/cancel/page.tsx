import { CancelCheckout } from "@/components/cart/cancel-checkout";

export default async function CheckoutCancelPage({ searchParams }: { searchParams: Promise<{ reservation?: string }> }) {
  const { reservation } = await searchParams;
  return <CancelCheckout reservationId={typeof reservation === "string" ? reservation : undefined} />;
}
