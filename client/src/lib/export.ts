import type { BlockInfo } from "@syncweave/crdt"

function blockToMarkdown(block: BlockInfo): string {
  const text = block.text.toString()
  switch (block.type) {
    case "heading1":
      return `# ${text}`
    case "heading2":
      return `## ${text}`
    case "heading3":
      return `### ${text}`
    case "bullet-list":
      return `- ${text}`
    case "numbered-list":
      return `1. ${text}`
    case "todo": {
      const checked = text.startsWith("[x] ")
      const content = checked ? text.slice(4) : text.startsWith("[ ] ") ? text.slice(4) : text
      return `- [${checked ? "x" : " "}] ${content}`
    }
    case "code-block":
      return "```\n" + text + "\n```"
    case "quote":
      return text
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n")
    case "divider":
      return "---"
    default:
      return text
  }
}

export function toMarkdown(blocks: BlockInfo[]): string {
  return blocks.map(blockToMarkdown).filter(Boolean).join("\n\n")
}

function blockToHtml(block: BlockInfo): string {
  const text = escapeHtml(block.text.toString())
  switch (block.type) {
    case "heading1":
      return `<h1>${text}</h1>`
    case "heading2":
      return `<h2>${text}</h2>`
    case "heading3":
      return `<h3>${text}</h3>`
    case "bullet-list":
      return `<li>${text}</li>`
    case "numbered-list":
      return `<li>${text}</li>`
    case "todo":
      return `<li><input type="checkbox"${text.startsWith("[x]") ? " checked" : ""} disabled /> ${text.replace(/^\[.\]\s*/, "")}</li>`
    case "code-block":
      return `<pre><code>${text}</code></pre>`
    case "quote":
      return `<blockquote>${text}</blockquote>`
    case "divider":
      return `<hr />`
    default:
      return `<p>${text}</p>`
  }
}

export function toHtml(blocks: BlockInfo[]): string {
  const body = blocks.map(blockToHtml).join("\n")
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SyncWeave Document</title></head><body>${body}</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
