import { OpacaCollection } from "@/opaca/types/config";

export const Logs: OpacaCollection = {
  name: "Logs",
  icon: "Activity",
  rest: true,
  fields: [
    {
      name: "level",
      type: "text",
      required: true,
      default: "info",
      indexed: true,
    },
    {
      name: "message",
      type: "text",
      required: true,
    },
    {
      name: "timestamp",
      type: "date",
      required: true,
      default: new Date().toISOString(),
      indexed: true,
    },
  ]
}