import { defineField, defineType } from "sanity";

export const newsletterSubscriberType = defineType({
  name: "newsletterSubscriber",
  title: "Newsletter Subscriber",
  type: "document",
  fields: [
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "locale",
      title: "Locale",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "subscribedAt",
      title: "Subscribed at",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: "email", subtitle: "subscribedAt" },
  },
});
