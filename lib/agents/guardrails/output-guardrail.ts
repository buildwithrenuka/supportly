
import type { OutputGuardrail } from "@openai/agents";

export const outputGuardrail: OutputGuardrail = {
  name: "Sensitive Information Guardrail",

  execute: async ({ agentOutput }) => {
    const response = String(agentOutput).toLowerCase();

    const blockedPatterns = [
      "my password is",
      "api key:",
      "secret key:",
    ];

    const matchedPattern = blockedPatterns.find((pattern) =>
      response.includes(pattern)
    );

    return {
      outputInfo: {
        matchedPattern: matchedPattern ?? null,
      },
      tripwireTriggered: Boolean(matchedPattern),
    };
  },
};
