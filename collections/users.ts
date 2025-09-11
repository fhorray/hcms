import { OpacaCollection } from "@/cms/types";

export const Users: OpacaCollection = {
  name: "Users",
  slug: "users",
  icon: "User", // matches a valid Lucide icon name
  primaryKey: "id",
  fields: {
    id: {
      type: "text",
      required: true,
      unique: true,
    },
    name: {
      type: "text",
      required: true,
    },
    email: {
      type: "email",
      required: true,
      unique: true,
      indexed: true,
    },
    emailVerified: {
      type: "checkbox", // boolean flag
      default: false,
      required: true,
      columnName: "email_verified",
    },
    image: {
      type: "text",
    },
    createdAt: {
      type: "date",
      required: true,
      columnName: "created_at",
    },
    updatedAt: {
      type: "date",
      required: true,
      columnName: "updated_at",
    },
    role: {
      type: "text",
    },
    banned: {
      type: "checkbox",
      default: false,
    },
    banReason: {
      type: "text",
      columnName: "ban_reason",
    },
    banExpires: {
      type: "date",
      columnName: "ban_expires",
    },
  },
};