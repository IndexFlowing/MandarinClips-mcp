#!/usr/bin/env node
// src/index.ts
// Official MCP Server for MandarinClips - Cinema Corpus for Chinese Language Educators

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 生产环境 API 与 Web 根地址 (支持环境变量覆盖)
const API_BASE = (process.env.MANDARINCLIPS_API_BASE || "https://www.mandarinclips.com/api/v1").replace(/\/$/, "");
const WEB_BASE = (process.env.MANDARINCLIPS_WEB_BASE || "https://www.mandarinclips.com").replace(/\/$/, "");

// 初始化 MCP 服务实例
const server = new McpServer({
  name: "mandarinclips-mcp",
  version: "1.0.0",
});

// 通用 HTTP 请求辅助函数
async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    "User-Agent": "MandarinClips-MCP-Client/1.0",
    "Accept": "application/json",
  };

  if (process.env.MANDARINCLIPS_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.MANDARINCLIPS_API_KEY}`;
  }

  const response = await fetch(url, { headers });

if (response.status === 429) {
    const errorJson = await response.json().catch(() => ({} as Record<string, any>));
    const message = errorJson.message || "Daily API query quota limit reached.";

    // 填入你的真实 Patreon 创作者主页链接 (例如 https://www.patreon.com/c/mandarinclips 或 https://www.patreon.com/mandarinclips)
    const PATREON_URL = process.env.MANDARINCLIPS_PATREON_URL || "https://www.patreon.com/mandarinclips";

    const promotionMarkdown = [
      `\n\n### ⚠️ MandarinClips Daily Quota Exceeded`,
      `${message}\n`,
      `**How to continue using MandarinClips:**`,
      `- 🔑 **[Get Free API Key (8 queries/day)](https://www.mandarinclips.com/account)** — Create a free account to unlock 8 queries every day.`,
      `- 💎 **[Subscribe to Pro on Patreon (Unlimited Access)](https://www.patreon.com/16102562/join)** — Instant unlimited queries, video exports, and full corpus access.`,
      `- 🎓 **[Teachers: Apply for Free Academic License](https://www.mandarinclips.com/educators)** — Complimentary 3-month Pro access for professors and language instructors.\n`
    ].join("\n");

    throw new Error(promotionMarkdown);
  }

  if (response.status === 401) {
    const errorJson: any = await response.json().catch(() => ({}));
    const message = errorJson.message || "Invalid API Key. Please get your valid key at https://www.mandarinclips.com/account";
    const authCard = `\n\n⚠️ **MandarinClips Auth Notice**:\n${message}\n\n- 👉 **[Get Your API Key](https://www.mandarinclips.com/account)**\n`;
    throw new Error(authCard);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`MandarinClips API Error [${response.status}]: ${errorText || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function formatErrorResponse(action: string, err: any) {
  const msg = err?.message || String(err);
  if (msg.includes("MandarinClips Quota Notice") || msg.includes("MandarinClips Auth Notice")) {
    return { content: [{ type: "text" as const, text: msg.trim() }] };
  }
  return { content: [{ type: "text" as const, text: `Failed to ${action}: ${msg}` }] };
}

// ─────────────────────────────────────────────────────────────────────────────
// 工具 1: search_cinema_clips (多维影视切片与对白检索)
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  "search_cinema_clips",
  {
    query: z.string().describe("Search keywords: Chinese characters (e.g. '算了'), Pinyin (e.g. 'suan le'), or English meaning/intent."),
    hsk_level: z.number().int().min(1).max(7).optional().describe("Filter by HSK 3.0 Level (1 to 7)."),
    limit: z.number().int().min(1).max(20).optional().default(5).describe("Max number of dialogue clips to return (1-20)."),
  },
  async ({ query, hsk_level, limit }) => {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        locale: "en",
      });
      if (hsk_level !== undefined) {
        params.append("hsk_level", hsk_level.toString());
      }

      const res = await fetchApi<{
        success: boolean;
        data: {
          query: string;
          total: number;
          clips: Array<{
            id: string;
            text_zh: string;
            pinyin: string;
            localized_text?: string;
            hsk_level?: number;
          }>;
        };
      }>(`/search?${params.toString()}`);

      const clips = res.data?.clips || [];
      if (clips.length === 0) {
        return {
          content: [{ type: "text", text: `No cinema clips found for query: "${query}". Try searching with broader keywords.` }],
        };
      }

      let markdown = `### 🎬 MandarinClips Cinema Evidence for "${query}" (Found ${res.data.total || clips.length} clips):\n\n`;

      clips.forEach((c, idx) => {
        const canonicalId = c.id.replace(/_/g, "-");
        const clipUrl = `${WEB_BASE}/clip/${canonicalId}`;
        const levelBadge = c.hsk_level ? ` [HSK ${c.hsk_level}]` : "";

        markdown += `${idx + 1}. **"${c.text_zh}"**${levelBadge}\n`;
        markdown += `   - **Pinyin**: *${c.pinyin}*\n`;
        if (c.localized_text) {
          markdown += `   - **English**: "${c.localized_text}"\n`;
        }
        markdown += `   - **Direct Video Reference**: [Watch Scene & Listen on MandarinClips](${clipUrl})\n\n`;
      });

      return { content: [{ type: "text", text: markdown.trim() }] };
    } catch (err: any) {
      return formatErrorResponse("search clips", err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 工具 2: get_grammar_guide (句式骨架与教学用例查询)
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  "get_grammar_guide",
  {
    slug: z.string().describe("Grammar slug (e.g. 'hai-shi-ba' for '还是…吧', 'lian-dou' for '连…都…')."),
  },
  async ({ slug }) => {
    try {
      const res = await fetchApi<{
        success: boolean;
        data: {
          grammar: {
            pattern: string;
            slug: string;
            name: string;
            level?: number;
            description: string;
            clip_count: number;
          };
          examples: Array<{
            text_zh: string;
            pinyin: string;
            localized_text?: string;
            clip_id?: string;
          }>;
        };
      }>(`/grammar/${slug}`);

      const g = res.data.grammar;
      const grammarUrl = `${WEB_BASE}/grammar/${g.slug}`;
      const levelBadge = g.level ? ` [HSK Level ${g.level}]` : "";

      let markdown = `### 📐 Chinese Grammar Blueprint: "${g.pattern}"${levelBadge}\n`;
      markdown += `**Name / Function**: ${g.name || "Grammar Structure"}\n`;
      if (g.description) {
        markdown += `**Pedagogical Note**: ${g.description}\n`;
      }
      markdown += `**Corpus Reference**: [Explore Full Grammar Dossier & Variations on MandarinClips](${grammarUrl})\n\n`;

      if (res.data.examples && res.data.examples.length > 0) {
        markdown += `#### 🎬 Authentic Cinema Sentence Examples:\n`;
        res.data.examples.slice(0, 5).forEach((ex, idx) => {
          markdown += `${idx + 1}. **"${ex.text_zh}"**\n`;
          markdown += `   - *${ex.pinyin}*\n`;
          if (ex.localized_text) {
            markdown += `   - "${ex.localized_text}"\n`;
          }
          if (ex.clip_id) {
            const canonicalClipId = ex.clip_id.replace(/_/g, "-");
            markdown += `   - [Watch Clip Example](${WEB_BASE}/clip/${canonicalClipId})\n`;
          }
          markdown += `\n`;
        });
      }

      return { content: [{ type: "text", text: markdown.trim() }] };
    } catch (err: any) {
      return formatErrorResponse("fetch grammar guide", err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 工具 3: get_expression_guide (习惯表达、俚语与母语潜台词)
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  "get_expression_guide",
  {
    slug: z.string().describe("Expression slug (e.g. 'hai-shi-suan-le-ba', 'bu-de-bu')."),
  },
  async ({ slug }) => {
    try {
      const res = await fetchApi<{
        success: boolean;
        data: {
          expression: {
            text: string;
            slug: string;
            pinyin: string;
            meaning: string;
            level?: number;
            clip_count: number;
          };
          examples: Array<{
            text_zh: string;
            pinyin: string;
            localized_text?: string;
            clip_id?: string;
          }>;
        };
      }>(`/expressions/${slug}`);

      const exp = res.data.expression;
      const exprUrl = `${WEB_BASE}/expressions/${exp.slug}`;
      const levelBadge = exp.level ? ` [HSK Level ${exp.level}]` : "";

      let markdown = `### 📌 Authentic Chinese Expression: "${exp.text}"${levelBadge}\n`;
      markdown += `- **Pinyin**: *${exp.pinyin}*\n`;
      markdown += `- **English Meaning & Pragmatics**: ${exp.meaning}\n`;
      markdown += `- **Full Corpus Dossier**: [View Usage Scenarios & Nuances on MandarinClips](${exprUrl})\n\n`;

      if (res.data.examples && res.data.examples.length > 0) {
        markdown += `#### 🎬 How Native Speakers Use It in Dialogue:\n`;
        res.data.examples.slice(0, 5).forEach((ex, idx) => {
          markdown += `${idx + 1}. **"${ex.text_zh}"**\n`;
          markdown += `   - *${ex.pinyin}*\n`;
          if (ex.localized_text) {
            markdown += `   - "${ex.localized_text}"\n`;
          }
          if (ex.clip_id) {
            const canonicalClipId = ex.clip_id.replace(/_/g, "-");
            markdown += `   - [Watch Native Scene](${WEB_BASE}/clip/${canonicalClipId})\n`;
          }
          markdown += `\n`;
        });
      }

      return { content: [{ type: "text", text: markdown.trim() }] };
    } catch (err: any) {
      return formatErrorResponse("fetch expression guide", err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 工具 4: get_hsk_vocabulary (官方 HSK 3.0 等级大盘词表检索)
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  "get_hsk_vocabulary",
  {
    level: z.number().int().min(1).max(7).describe("HSK 3.0 Level (1 to 7). Level 7 covers bands 7-9."),
    page: z.number().int().min(1).optional().default(1).describe("Page number for pagination."),
    limit: z.number().int().min(1).max(50).optional().default(20).describe("Number of vocabulary items per page."),
  },
  async ({ level, page, limit }) => {
    try {
      const res = await fetchApi<{
        success: boolean;
        data: Array<{
          word_id: number;
          text: string;
          slug: string;
          pinyin?: string;
          meaning?: string;
          clip_count: number;
        }>;
        meta: {
          total: number;
          total_pages: number;
        };
      }>(`/hsk/${level}?page=${page}&limit=${limit}`);

      const words = res.data || [];
      const levelTitle = level === 7 ? "Level 7-9" : `Level ${level}`;
      const levelUrl = `${WEB_BASE}/hsk/${level}`;

      let markdown = `### 🎓 Official HSK 3.0 ${levelTitle} Vocabulary (Page ${page}/${res.meta?.total_pages || 1}, Total: ${res.meta?.total || words.length} words)\n`;
      markdown += `*Reference Directory: [Explore HSK ${levelTitle} Word Atlas on MandarinClips](${levelUrl})*\n\n`;

      words.forEach((w, idx) => {
        const wordUrl = `${WEB_BASE}/word/${w.slug}`;
        const pinyinStr = w.pinyin ? ` (${w.pinyin})` : "";
        markdown += `${idx + 1}. **[${w.text}](${wordUrl})**${pinyinStr} - ${w.meaning || "—"} *(${w.clip_count} video examples)*\n`;
      });

      return { content: [{ type: "text", text: markdown.trim() }] };
    } catch (err: any) {
      return formatErrorResponse("fetch HSK vocabulary", err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 工具 5: get_word_detail (单词深度档案及影视例句)
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  "get_word_detail",
  {
    slug: z.string().describe("Word slug identifier (e.g. 'ai-6', 'zuo-tian')."),
  },
  async ({ slug }) => {
    try {
      const res = await fetchApi<{
        success: boolean;
        data: {
          word: {
            id: number;
            text: string;
            slug: string;
            pinyin?: string;
            meaning?: string;
            clip_count: number;
          };
          levels: number[];
          clips: Array<{
            id: string;
            text_zh: string;
            pinyin: string;
            translation: string;
            hsk_level?: number;
            show_title?: string;
          }>;
        };
      }>(`/words/${slug}`);

      const w = res.data.word;
      const wordUrl = `${WEB_BASE}/word/${w.slug}`;
      const levelsBadge = res.data.levels.length > 0 ? ` [HSK Level ${res.data.levels.join(", ")}]` : "";

      let markdown = `### 📖 Mandarin Vocabulary Profile: "${w.text}"${levelsBadge}\n`;
      markdown += `- **Pinyin**: *${w.pinyin || "—"}*\n`;
      markdown += `- **English Definition**: ${w.meaning || "—"}\n`;
      markdown += `- **Canonical Link**: [View Full Word Profile on MandarinClips](${wordUrl})\n\n`;

      if (res.data.clips && res.data.clips.length > 0) {
        markdown += `#### 🎬 Authentic Cinema Example Clips:\n`;
        res.data.clips.forEach((c, idx) => {
          const canonicalClipId = c.id.replace(/_/g, "-");
          const clipUrl = `${WEB_BASE}/clip/${canonicalClipId}`;
          const showStr = c.show_title ? ` (《${c.show_title}》)` : "";

          markdown += `${idx + 1}. **"${c.text_zh}"**${showStr}\n`;
          markdown += `   - *${c.pinyin}*\n`;
          markdown += `   - "${c.translation}"\n`;
          markdown += `   - [Watch Video & Shadow Audio](${clipUrl})\n\n`;
        });
      }

      return { content: [{ type: "text", text: markdown.trim() }] };
    } catch (err: any) {
      return formatErrorResponse("fetch word detail", err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 启动服务 (标准 Stdio Transport)
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 MandarinClips MCP Server successfully running on stdio");
}

main().catch((error) => {
  console.error("🚨 Fatal error starting MandarinClips MCP Server:", error);
  process.exit(1);
});