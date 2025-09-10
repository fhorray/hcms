import { UserIcon } from "lucide-react";
import { OpacaCollection } from "../types";

export const Users: OpacaCollection = {
  name: "Users",
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
