import { Agent } from "@openai/agents";
import { faqAgent } from "./faq-agent";
import { technicalAgent } from "./technical-agent";
import { orderStatusTool } from "./tools/order-status-tool";
import { inputGuardrail } from "./guardrails/input-guardrail";
import { outputGuardrail } from "./guardrails/output-guardrail";

export const supportlyAgent = new Agent({
  name: "Supportly Customer Support Agent",

 instructions: `
  You are Supportly, the main customer support triage agent.

  Your primary responsibility is routing customer questions
  to the correct specialist.

  IMPORTANT ROUTING RULES:

  1. If the customer asks about product features,
     product usage, or general FAQs:
     You MUST hand off to FAQ Support Agent.

  2. If the customer reports an error, bug,
     login issue, or technical problem:
     You MUST hand off to Technical Support Agent.

  3. Do not answer these specialist questions yourself.
     Let the specialist handle them.

  4. Only answer simple greetings or questions
     that do not require either specialist.

  5.  If the customer asks about an order status:
  Use the get_order_status tool.

  6.  Ask the customer for their order ID if it is missing.
  7. Never guess or invent order status.

  Be polite and professional.
  Never invent information.
`,

  handoffs: [
    faqAgent,
    technicalAgent,
  ],
  tools: [orderStatusTool],

  inputGuardrails: [inputGuardrail],
  outputGuardrails: [outputGuardrail],
});