import { OpacaCollection } from "@opaca/types/config";

export const Users: OpacaCollection = {
  name: "Users",
  icon: "UserIcon",
  fields: [
    {
      type: {
        row: [
          {
            name: "name",
            type: "text",
            required: true,
            layout: {
              col: 6
            }
          },
          {
            name: "email",
            type: "email",
            required: true,
            unique: true,
            indexed: true,
          },
        ]
      }
    },
    {
      name: "id",
      type: "text",
      required: true,
      unique: true,
      hidden: true,
    },
    {
      name: "emailVerified",
      type: "checkbox", // boolean flag
      default: false,
      required: true,
    },
    {
      name: "image",
      type: "text",
    },
    {
      name: "createdAt",
      type: "date",
      required: true,
      hidden: true,
    },
    {
      name: "updatedAt",
      type: "date",
      required: true,
      hidden: true,
    },
    {
      name: "role",
      type: {
        select: {
          options: [
            { label: "Admin", value: "admin" },
            { label: "Editor", value: "editor" },
            { label: "Viewer", value: "viewer" },
            { label: "Guest", value: "guest" },
          ],
          multiple: false,
          relationship: { to: "properties", valueField: "name" },
        },
      },
    },
    {
      name: "banned",
      type: "checkbox",
      default: false,
    },
    {
      name: "banReason",
      type: "textarea",
    },
    {
      name: "banExpires",
      type: "date",
    },
  ],
};