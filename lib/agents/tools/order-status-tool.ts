import { tool } from "@openai/agents";
import { z } from "zod";

export const orderStatusTool = tool({
  name: "get_order_status",

  description:
    "Fetch the current status of a customer's order using order ID.",

  parameters: z.object({
    orderId: z.string().describe("Customer's order ID"),
  }),

  async execute({ orderId }) {
    // Temporary mock order data
    const orders: Record<string, string> = {
      "ORD-101": "Your order has been shipped.",
      "ORD-102": "Your order is being processed.",
      "ORD-103": "Your order has been delivered.",
    };

    const status = orders[orderId];

    if (!status) {
      return `No order found with ID ${orderId}.`;
    }

    return status;
  },
});