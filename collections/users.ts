import { OpacaCollection } from "@/cms/types";
import { UserIcon } from "lucide-react";

export const Users: OpacaCollection = {
  name: "Users",
  slug: "users",
  icon: UserIcon,
  fields: {
    email:
    {
      type: "text",
      required: true,
      unique: true,
      indexed: true
    },
    name: {
      type: "text",
    }
  }
}
