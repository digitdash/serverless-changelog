import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({
  gfm: true,
  breaks: false
});

function normalizeMarkdown(markdown) {
  return String(markdown || "")
    .replace(/\r\n/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

export function renderMarkdown(markdown) {
  const raw = marked.parse(normalizeMarkdown(markdown));

  return sanitizeHtml(raw, {
    allowedTags: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "pre",
      "code",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "hr",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td"
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title"],
      code: ["class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"]
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer"
      })
    }
  });
}
