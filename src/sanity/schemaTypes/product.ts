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
        ],
      },
      validation: (rule) => rule.required(),
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
      title: "Condition",
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
      name: "era",
      title: "Era",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "origin",
      title: "Sourced in",
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
      description: "Turn on the moment this one-of-one piece sells.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", media: "images.0", subtitle: "category" },
  },
});
