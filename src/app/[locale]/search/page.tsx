import { getAllProducts } from "@/lib/products";
import { SearchClient } from "@/components/shop/search-client";

export default async function SearchPage() {
  const allProducts = await getAllProducts();
  return <SearchClient allProducts={allProducts} />;
}
