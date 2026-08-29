import createImageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "../env";

const builder =
  projectId && dataset ? createImageUrlBuilder({ projectId, dataset }) : null;

export function urlForImage(source: SanityImageSource) {
  return builder?.image(source) ?? null;
}
