// Edge function to extract structured rows from unstructured content using Lovable AI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExtractionField {
  name: string;
  description: string;
  type?: 'string' | 'number' | 'boolean' | 'date';
}

interface ExtractRequest {
  text?: string;
  imageDataUrl?: string;
  fileName?: string;
  templateName?: string;
  schema?: ExtractionField[];
}

const TYPE_TO_JSON: Record<string, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  date: 'string',
};

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
    const { text, imageDataUrl, fileName, templateName, schema } = body;

    if (!text && !imageDataUrl) {
      return new Response(
        JSON.stringify({ error: "Provide either text or imageDataUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const hasSchema = Array.isArray(schema) && schema.length > 0;

    // Build dynamic JSON schema for the tool when fixed columns are provided
    const rowProperties: Record<string, unknown> = {};
    const requiredFields: string[] = [];
    if (hasSchema) {
      for (const f of schema!) {
        rowProperties[f.name] = {
          type: [TYPE_TO_JSON[f.type || 'string'] || 'string', 'null'],
          description: f.description,
        };
        requiredFields.push(f.name);
      }
    }

    const systemPrompt = hasSchema
      ? `You are a precise data extraction assistant for "${templateName}" documents.

You will be given a document (text or image). Extract the following fields EXACTLY as defined.

Fields to extract:
${schema!.map((f) => `- ${f.name} (${f.type || 'string'}): ${f.description}`).join('\n')}

Rules:
- Return ONE row per distinct record/entity in the document. For most documents (a single invoice, lease, resume, medical visit) this means exactly ONE row.
- Use the EXACT field names listed above. Do NOT add or rename fields.
- Use null when a value is not present in the document. Do NOT guess or invent.
- For date fields, use ISO format YYYY-MM-DD.
- For number fields, return raw numbers without currency symbols or commas.`
      : `You are a data extraction assistant. Extract a structured tabular dataset from the input.`;

    const userParts: Array<Record<string, unknown>> = [];
    userParts.push({
      type: "text",
      text: `Extract the predefined fields from this ${fileName ? `file "${fileName}"` : "document"}.`,
    });

    if (imageDataUrl) {
      userParts.push({ type: "image_url", image_url: { url: imageDataUrl } });
    } else if (text) {
      const trimmed = text.length > 60000 ? text.slice(0, 60000) + "\n...[truncated]" : text;
      userParts.push({ type: "text", text: `\n\nDocument content:\n${trimmed}` });
    }

    const toolParameters = hasSchema
      ? {
          type: "object",
          properties: {
            rows: {
              type: "array",
              description: "One object per record. Most single-document extractions will have exactly one row.",
              items: {
                type: "object",
                properties: rowProperties,
                required: requiredFields,
                additionalProperties: false,
              },
            },
          },
          required: ["rows"],
          additionalProperties: false,
        }
      : {
          type: "object",
          properties: {
            columns: { type: "array", items: { type: "string" } },
            rows: { type: "array", items: { type: "object", additionalProperties: true } },
          },
          required: ["columns", "rows"],
          additionalProperties: false,
        };

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
                description: "Return the extracted dataset.",
                parameters: toolParameters,
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

    let parsed: { columns?: string[]; rows: Record<string, unknown>[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cols = hasSchema ? schema!.map((f) => f.name) : (parsed.columns || []);
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
