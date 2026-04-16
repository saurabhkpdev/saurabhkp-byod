// Edge function to extract structured rows from unstructured content using Lovable AI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExtractRequest {
  // Either text content or an image (data URL)
  text?: string;
  imageDataUrl?: string;
  fileName?: string;
  hint?: string; // optional user hint about what to extract
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as ExtractRequest;
    const { text, imageDataUrl, fileName, hint } = body;

    if (!text && !imageDataUrl) {
      return new Response(
        JSON.stringify({ error: "Provide either text or imageDataUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `You are a data extraction assistant. Your job is to look at unstructured input (a document, image, or text) and extract a structured tabular dataset.

Rules:
- Identify the most meaningful repeating entities or records and turn them into rows.
- Pick clean, snake_case column names that describe each field.
- All rows MUST share the same set of columns. Use null when a value is missing.
- Prefer numbers/booleans/dates over strings when the value clearly represents one.
- Do NOT invent data. Only extract what is present.
- If the document has multiple tables, pick the most prominent one or merge if they are clearly the same entity.
- If you cannot find any tabular data, return an empty rows array.`;

    const userParts: Array<Record<string, unknown>> = [];
    const userInstruction = `Extract structured rows from this ${fileName ? `file "${fileName}"` : "input"}.${hint ? ` Hint from user: ${hint}` : ""}`;
    userParts.push({ type: "text", text: userInstruction });

    if (imageDataUrl) {
      userParts.push({ type: "image_url", image_url: { url: imageDataUrl } });
    } else if (text) {
      // Truncate very long text to keep token usage sane
      const trimmed = text.length > 60000 ? text.slice(0, 60000) + "\n...[truncated]" : text;
      userParts.push({ type: "text", text: `\n\nDocument content:\n${trimmed}` });
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userParts },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_dataset",
                description: "Return the extracted dataset as columns + rows.",
                parameters: {
                  type: "object",
                  properties: {
                    columns: {
                      type: "array",
                      description: "Ordered list of column names.",
                      items: { type: "string" },
                    },
                    rows: {
                      type: "array",
                      description: "Array of row objects keyed by column name.",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["columns", "rows"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_dataset" } },
        }),
      },
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiResponse.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: { columns: string[]; rows: Record<string, unknown>[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Normalize: ensure every row has every column
    const cols = parsed.columns || [];
    const normalizedRows = (parsed.rows || []).map((r) => {
      const out: Record<string, unknown> = {};
      for (const c of cols) {
        out[c] = r[c] ?? null;
      }
      return out;
    });

    return new Response(
      JSON.stringify({ columns: cols, rows: normalizedRows }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("extract-unstructured error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
