# MandarinClips MCP Server 🎬

[![npm version](https://img.shields.io/npm/v/mandarinclips-mcp.svg?style=flat-square&color=E53E3E)](https://www.npmjs.com/package/mandarinclips-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/Protocol-Model%20Context%20Protocol-purple.svg?style=flat-square)](https://modelcontextprotocol.io)

Official [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for **[MandarinClips](https://www.mandarinclips.com)** — the linguistic cinema corpus designed for Chinese language educators (TCSL) and advanced learners.

Seamlessly connect **Claude Desktop**, **Cursor**, and AI agents directly to a database of **180,000+ authentic Chinese movie and television dialogue snippets**, complete with native audio citations, HSK 3.0 grammar formulas, and real-world pragmatic subtexts.

---

## 🌟 Why MandarinClips MCP?

Traditional textbooks teach sterile Chinese dialogues. Real native speech is packed with subtle cultural subtext, conversational hedging, and colloquial idioms. 

This MCP server empowers LLMs to design authentic, cinema-backed Chinese lesson plans, exercises, and vocabulary guides:
- **Authentic Cinema Context**: Real video turn sequences (previous, target, and succeeding lines) instead of robotic machine-generated sentences.
- **Pedagogical Indexing**: Search by HSK 3.0 level (1 to 7-9), syntactic grammar patterns, or pragmatic social scenarios (e.g., *polite refusals*, *workplace disputes*).
- **Direct Markdown Citations**: Every retrieved example automatically embeds an authentic scene link pointing directly to [MandarinClips](https://www.mandarinclips.com).

---

## 🌐 Quick Connection (Two Ways)

### Option A: Cloud Remote MCP (Zero Install - Recommended for Educators)
No Node.js or installation required! In any MCP-compatible client or web agent (Claude Web, Smithery, Cursor Remote):
- **Server URL**: `https://www.mandarinclips.com/mcp`
- **API Key Header**: `Authorization: Bearer <your_api_key>` (or URL query: `?api_key=...`)

---

### Option B: Local Stdio via NPX (For Desktop Power Users)
Add this configuration to your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mandarinclips": {
      "command": "npx",
      "args": ["-y", "mandarinclips-mcp@1.1.0"],
      "env": {
        "MANDARINCLIPS_API_KEY": "mc_live_your_api_key_here"
      }
    }
  }
}
```

## 🚀 Quickstart: Setup with Claude Desktop

Add this configuration to your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 1. Anonymous / Free Tier (Default)
Run directly via `npx` with zero installation:

```json
{
  "mcpServers": {
    "mandarinclips": {
      "command": "npx",
      "args": ["-y", "mandarinclips-mcp"]
    }
  }
}
```

### 2. With API Key (Elevated Quota)

To get 8 free queries per day or unlimited Pro access, obtain your API key from your [MandarinClips Account Dashboard](https://www.mandarinclips.com/account):

```json
{
  "mcpServers": {
    "mandarinclips": {
      "command": "npx",
      "args": ["-y", "mandarinclips-mcp"],
      "env": {
        "MANDARINCLIPS_API_KEY": "mc_live_your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop, and you will see the **MandarinClips** tools ready in the toolbar!

---

## 🧰 Available Tools

| Tool Name              | Description                                                  | Parameters                                                   |
| :--------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| `search_cinema_clips`  | Search 180,000+ real movie dialogues by Chinese characters, Pinyin, or English topics. | `query` (str), `hsk_level` (opt int 1-7), `limit` (opt int 1-20) |
| `get_grammar_guide`    | Retrieve structural sentence formulas and real dialogue examples for a grammar pattern. | `slug` (e.g., `'hai-shi-ba'`, `'lian-dou'`)                  |
| `get_expression_guide` | Look up colloquial idioms, slang, and cultural nuances in cinematic contexts. | `slug` (e.g., `'hai-shi-suan-le-ba'`, `'bu-de-bu'`)          |
| `get_hsk_vocabulary`   | Retrieve official HSK 3.0 vocabulary lists with definitions and linked video counts. | `level` (int 1-7), `page` (opt int), `limit` (opt int)       |
| `get_word_detail`      | Detailed dictionary profile of a Chinese character/word, showing linked cinema clips. | `slug` (e.g., `'ai-6'`, `'zuo-tian'`)                        |

---

## 🎯 Example Prompts to Try in Claude

- *"Design a 45-minute lesson plan for HSK 3 students on the '还是…吧' structure. Use MandarinClips to find 3 real movie dialogue examples."*
- *"Give me 5 authentic video examples showing how native Chinese speakers politely refuse an invitation in daily life."*
- *"Extract Level 2 HSK words related to food, provide pinyin, definitions, and link their video citations."*

---

## 🔑 Tiered Daily Quotas

MandarinClips enforces fair-use daily quotas:
- **Anonymous (No API Key)**: 3 queries / day (per IP address).
- **Free Account**: 8 queries / day. [Get your free API key](https://www.mandarinclips.com/account).
- **Pro Subscribers**: Unlimited queries & high-speed exports via [Patreon](https://www.patreon.com/mandarinclips).
- **Educators & Professors**: Apply for a complimentary 3-month Pro license via the [Academic Access Program](https://www.mandarinclips.com/educators).

---

## 🏛️ Ecosystem & Links

- 🌐 **Web Platform**: [https://www.mandarinclips.com](https://www.mandarinclips.com)
- 🎓 **HSK 3.0 Curriculum**: [Explore HSK Word Atlas](https://www.mandarinclips.com/hsk)
- 📐 **Grammar Library**: [Browse Sentence Patterns](https://www.mandarinclips.com/grammar)
- 📌 **Expressions & Idioms**: [Colloquial Phrase Directory](https://www.mandarinclips.com/expressions)
- 🎭 **Pragmatic Scenes**: [Real-world Social Scenarios](https://www.mandarinclips.com/scenes)
- 📰 **Official Blog**: [Insights on Chinese Pedagogy](https://www.mandarinclips.com/blog/)

---

## 📄 License

MIT License &copy; 2026 MandarinClips Team.