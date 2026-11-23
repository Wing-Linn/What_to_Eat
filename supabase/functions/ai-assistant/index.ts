const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function degrade(reason: string): Response {
  return json(
    {
      success: false,
      degraded: true,
      error: reason,
    },
    200
  );
}

interface ParseRequestBody {
  action?: string;
  text?: string;
  currentMealTime?: string;
  food?: {
    name?: string;
    priceMin?: number | null;
    priceMax?: number | null;
    flavors?: string[];
    cuisines?: string[];
    tags?: string[];
  };
  preferenceSummary?: string;
}

const PARSE_SYSTEM_PROMPT = `你是一个中餐/夜宵偏好解析助手。用户会用自然语言描述今天想吃什么。
你的任务是把文本转成 JSON,不要做任何其他事情。

只允许输出以下字段,多余字段会被丢弃:
- mealTime: "breakfast" | "lunch" | "dinner" | "late_night" | "any" (缺省 any)
- budgetMax: number | null (用户提到的预算上限,如 "30元以内" -> 30)
- cuisines: string[] (如 "川湘","日料","粤菜","中式","西餐","轻食","面食","韩餐","火锅","甜点饮品","小吃","汤粉","烧烤","简餐")
- flavors: string[] (如 "清淡","微辣","重辣","酸甜","咸香")
- foodTypes: string[] (如 "主食","面食","米饭","汤粉","火锅","小食")
- mealMethods: string[] ("dine_in" | "takeout" | "cook")
- includeTags: string[] (如 "热乎","清爽","扛饿")
- excludeIngredients: string[] (如 不要香菜/葱/蒜/肥肉/动物内脏)
- excludeAllergens: string[] (如 不能吃辣 -> 不算,不能吃海鲜/花生/坚果 -> 算)
- mood: string[] (心情描述,如 "想吃热乎的","想吃点暖胃的")
- hardConstraints: string[] (用户明确说的"不要/不能/不要超过X元")
- softPreferences: string[] (用户提到的"想吃/最好/倾向")
- clarificationNeeded: string[] (有歧义的地方)

规则:
- "不要X" 写进 excludeIngredients 或 excludeAllergens。
- "不太想吃辣" 是软偏好(写 softPreferences + flavors 微辣); "不能吃辣" 是硬性限制(写 hardConstraints + excludeIngredients["辣"])。
- 不推断用户没有说的过敏、疾病、宗教信息。
- 只输出 JSON,不要任何解释、代码块标记或前后缀文字。`;

const REASON_SYSTEM_PROMPT = `你是一个饮食推荐理由生成器。给你一个食物的真实数据和用户当前偏好摘要,写一句 20-50 个汉字的中文推荐理由。

规则:
- 只能引用输入里确实存在的字段(名称、价格区间、口味、菜系、标签)。
- 不要声称食物"健康"、"低卡"、"营养均衡"或适合任何疾病。
- 不要编造价格、食材。
- 价格未知(priceMin/priceMax 为 null)时不要提价格。
- 只输出这一句话本身,不要任何前后缀或标点以外的解释。`;

async function callLLM(systemPrompt: string, userContent: string): Promise<string> {
  const apiKey = Deno.env.get("LLM_API_KEY");
  const baseUrl = Deno.env.get("LLM_BASE_URL");
  const model = Deno.env.get("LLM_MODEL");

  if (!apiKey || !baseUrl || !model) {
    throw new Error("LLM not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.4,
        max_tokens: 400,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`LLM responded ${res.status}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new Error("LLM returned empty content");
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function extractJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in LLM output");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
  return out.length > 0 ? out : undefined;
}

function parseParsedPreference(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null) throw new Error("Parsed preference is not an object");
  const obj = raw as Record<string, unknown>;
  const validMealTimes = ["breakfast", "lunch", "dinner", "late_night", "any"];
  const result: Record<string, unknown> = { hardConstraints: [], softPreferences: [] };

  if (typeof obj.mealTime === "string" && validMealTimes.includes(obj.mealTime)) {
    result.mealTime = obj.mealTime;
  }
  if (typeof obj.budgetMax === "number" && Number.isFinite(obj.budgetMax) && obj.budgetMax > 0 && obj.budgetMax <= 1000) {
    result.budgetMax = Math.round(obj.budgetMax);
  }
  const listFields = [
    "cuisines", "flavors", "foodTypes", "mealMethods", "includeTags",
    "excludeIngredients", "excludeAllergens", "mood", "hardConstraints", "softPreferences",
  ] as const;
  for (const field of listFields) {
    const arr = asStringArray(obj[field]);
    if (arr) result[field] = arr;
  }
  const clar = asStringArray(obj.clarificationNeeded);
  if (clar) result.clarificationNeeded = clar;

  return result;
}

function buildReason(raw: string): string {
  const cleaned = raw.trim().replace(/^["'""]|["'""]$/g, "");
  if (cleaned.length === 0) throw new Error("Empty reason");
  // Limit to 120 chars — reason should be 20-50 Chinese chars, this is a hard safety cap
  return cleaned.slice(0, 120);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  let body: ParseRequestBody;
  try {
    body = (await req.json()) as ParseRequestBody;
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  try {
    if (body.action === "parse-preferences") {
      const text = typeof body.text === "string" ? body.text.trim().slice(0, 300) : "";
      if (text.length === 0) {
        return json({ success: false, error: "text is required" }, 400);
      }
      const mealTime = typeof body.currentMealTime === "string" ? body.currentMealTime : "any";
      const raw = await callLLM(
        PARSE_SYSTEM_PROMPT,
        `当前选择的时段: ${mealTime}\n用户输入: ${text}`
      );
      const parsed = parseParsedPreference(extractJson(raw));
      return json({ success: true, data: parsed });
    }

    if (body.action === "recommendation-reason") {
      const food = body.food;
      if (!food || typeof food.name !== "string" || food.name.length === 0) {
        return json({ success: false, error: "food.name is required" }, 400);
      }
      const summary = typeof body.preferenceSummary === "string" ? body.preferenceSummary.slice(0, 300) : "";
      const priceText =
        typeof food.priceMin === "number" && typeof food.priceMax === "number"
          ? `价格区间${food.priceMin}-${food.priceMax}元`
          : "价格未知";
      const userContent = `偏好摘要: ${summary || "无"}\n食物: ${food.name}, ${priceText}, 口味: ${(food.flavors ?? []).join("、")}, 菜系: ${(food.cuisines ?? []).join("、")}, 标签: ${(food.tags ?? []).join("、")}`;
      const raw = await callLLM(REASON_SYSTEM_PROMPT, userContent);
      return json({ success: true, data: { reason: buildReason(raw) } });
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "LLM not configured") {
      return degrade("AI 服务未配置");
    }
    if (message.includes("abort") || message.includes("timeout")) {
      return degrade("AI 响应超时");
    }
    return degrade(`AI 暂时不可用: ${message}`);
  }
});
