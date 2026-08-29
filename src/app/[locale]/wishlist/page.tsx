import { getAllProducts } from "@/lib/products";
import { WishlistClient } from "@/components/shop/wishlist-client";

export default async function WishlistPage() {
  const allProducts = await getAllProducts();
  return <WishlistClient allProducts={allProducts} />;
}
