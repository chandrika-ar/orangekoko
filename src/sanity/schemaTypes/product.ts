import { defineField, defineType } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (used in the product URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Pierced Earrings", value: "earrings-studs" },
          { title: "Ear Clips", value: "ear-clips" },
          { title: "Necklaces", value: "necklaces" },
          { title: "Handmade Cards", value: "handmade-cards" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "jewelryKind", title: "Jewelry provenance", type: "string", initialValue: "artisan",
      options: { list: [{ title: "Handcrafted by an artisan in Japan", value: "artisan" }] },
      description: "Only verified artisan jewelry is displayed. Do not reclassify earlier listings without confirming who made them.",
      hidden: ({ document }) => document?.category === "handmade-cards",
      validation: (rule) => rule.custom((value, context) => context.document?.category !== "handmade-cards" && value !== "artisan" ? "Confirm artisan provenance" : true),
    }),
    defineField({
      name: "maker", title: "Artisan / maker", type: "string",
      hidden: ({ document }) => document?.category === "handmade-cards",
      validation: (rule) => rule.custom((value, context) => context.document?.category !== "handmade-cards" && !value ? "Name the artisan or workshop" : true),
    }),
    defineField({ name: "craftTechnique", title: "Craft technique", type: "string", hidden: ({ document }) => document?.category === "handmade-cards" }),
    defineField({
      name: "madeIn", title: "Place made", type: "string",
      hidden: ({ document }) => document?.category === "handmade-cards",
      validation: (rule) => rule.custom((value, context) => context.document?.category !== "handmade-cards" && !value ? "Confirm where the piece was made" : true),
    }),
    defineField({
      name: "packSize", title: "Cards per pack", type: "number", initialValue: 1,
      options: { list: [{ title: "Single card", value: 1 }, { title: "Three-card set", value: 3 }] },
      hidden: ({ document }) => document?.category !== "handmade-cards",
      validation: (rule) => rule.custom((value, context) => context.document?.category === "handmade-cards" && value !== 1 && value !== 3 ? "Choose one or three cards" : true),
    }),
    defineField({
      name: "fulfilment", title: "Fulfilment", type: "string", initialValue: "stock",
      options: { list: [{ title: "Ready to ship", value: "stock" }, { title: "Preorder", value: "preorder" }] },
      hidden: ({ document }) => document?.category !== "handmade-cards",
    }),
    defineField({
      name: "stock", title: "Ready-to-ship packs in stock", type: "number", initialValue: 0,
      description: "Count packs, not individual cards. Single-card and three-card listings have separate physical stock.",
      hidden: ({ document }) => document?.category !== "handmade-cards",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "preorderCapacity", title: "Preorder packs available", type: "number", initialValue: 0,
      hidden: ({ document }) => document?.category !== "handmade-cards" || document?.fulfilment !== "preorder",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "dispatchBy", title: "Preorders: dispatch by", type: "date",
      hidden: ({ document }) => document?.category !== "handmade-cards" || document?.fulfilment !== "preorder",
      validation: (rule) => rule.custom((value, context) => context.document?.fulfilment === "preorder" && (!value || value < new Date().toISOString().slice(0, 10)) ? "Set a future dispatch date" : true),
    }),
    defineField({
      name: "packedWeightGrams", title: "Packed shipping weight (grams)", type: "number",
      description: "Weigh the finished parcel with envelope or box; this records actual weight for future shipping-rate decisions.",
      validation: (rule) => rule.positive(),
    }),
    defineField({
      name: "priceEur",
      title: "Price (EUR)",
      type: "number",
      description: "e.g. 88 for €88.00",
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: "images",
      title: "Photos",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "condition",
      title: "Finish / condition details",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "materials",
      title: "Materials",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "measurements",
      title: "Measurements",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description (one paragraph per line)",
      type: "array",
      of: [{ type: "text", rows: 3 }],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "sold",
      title: "Sold",
      type: "boolean",
      description: "Turn on when this listing is no longer available.",
      initialValue: false,
    }),
    defineField({
      name: "projectTags",
      title: "Project / Collection tags",
      type: "array",
      of: [{ type: "string" }],
      description:
        'Optional. Add a tag (e.g. "autumn-edit-01") to feature this piece on the matching /projects page. Leave empty for a regular product.',
    }),
  ],
  preview: {
    select: { title: "title", media: "images.0", subtitle: "category" },
  },
});
