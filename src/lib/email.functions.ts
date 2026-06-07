import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  businessType: z.string().trim().min(1).max(100),
  businessName: z.string().trim().min(1).max(150),
  location: z.string().trim().min(1).max(150),
  service: z.string().trim().min(1).max(200),
  tone: z.number().int().min(1).max(5).default(3),
  agencyName: z.string().trim().max(100).optional(),
});

export type GenerateEmailInput = z.infer<typeof InputSchema>;
export type GenerateEmailResult = {
  subjectLines: string[];
  body: string;
};

function toneLabel(t: number) {
  return ["Very casual and friendly", "Casual and warm", "Friendly but professional", "Professional", "Formal and corporate"][t - 1];
}

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateEmailResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured. Please contact support.");

    const system = `You are an expert cold-outreach copywriter for a web design agency. Write short, punchy, deliverable cold emails that get replies. Rules:
- Under 130 words in the body
- Personal opener that references the prospect's business type and city naturally (no fake compliments)
- One specific value proposition tied to the service being pitched
- One clear CTA for a free 15-minute consultation or demo
- End with the signature placeholder: "— [Your Name]\\n[${data.agencyName || "Your Agency"}]"
- Tone: ${toneLabel(data.tone)}
- No emojis, no markdown, no headings, no bullet lists in the body
- Provide exactly 3 short subject lines (under 60 chars each), curiosity-driven, no clickbait`;

    const user = `Prospect:
- Business type: ${data.businessType}
- Business name: ${data.businessName}
- Location: ${data.location}
- Service to pitch: ${data.service}

Write the email.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "deliver_email",
              description: "Return the generated cold outreach email.",
              parameters: {
                type: "object",
                properties: {
                  subjectLines: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exactly 3 subject line options.",
                  },
                  body: { type: "string", description: "The email body text." },
                },
                required: ["subjectLines", "body"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "deliver_email" } },
      }),
    });

    if (resp.status === 429) throw new Error("Too many requests. Please try again in a moment.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      throw new Error("AI service is temporarily unavailable. Please try again.");
    }

    const json = await resp.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("Could not parse AI response.");
    const parsed = JSON.parse(call.function.arguments) as GenerateEmailResult;
    if (!Array.isArray(parsed.subjectLines) || !parsed.body) {
      throw new Error("Malformed AI response.");
    }
    return {
      subjectLines: parsed.subjectLines.slice(0, 3),
      body: parsed.body.trim(),
    };
  });
