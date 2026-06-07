export function markdownToPlainText(markdown: string): string {
  if (!markdown) return "";

  return markdown
    // fenced code blocks: keep inner text
    .replace(/```[\s\S]*?```/g, (match) =>
      match
        .replace(/^```[a-zA-Z0-9_-]*\s*/, "")
        .replace(/```$/, "")
        .trim()
    )

    // headings
    .replace(/^#{1,6}\s+/gm, "")

    // horizontal rules
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")

    // blockquotes
    .replace(/^\s*>\s?/gm, "")

    // bold / italic
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/___(.*?)___/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")

    // inline code
    .replace(/`([^`]+)`/g, "$1")

    // links: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")

    // images: ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")

    // unordered bullets
    .replace(/^\s*[-*+]\s+/gm, "• ")

    // ordered lists
    .replace(/^\s*\d+\.\s+/gm, "")

    // table separator rows
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, "")

    // table pipes
    .replace(/\s*\|\s*/g, "  ")

    // extra blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
