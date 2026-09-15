import React from "react";
import styles from "./FormattedDescription.module.scss";

const decodeHtmlEntities = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
};

export function parseFormattedText(text) {
  if (!text || typeof text !== "string") return [];

  // Normalize curly quotes and protocol in href attributes
  let cleaned = text
    .replace(
      /href=["“\u201c'‘]([^\s"“”\u201c\u201d'’>]+)(?:["“”\u201c\u201d'’]|(?=>))/gi,
      (match, url) => {
        let u = url.trim();
        if (u.startsWith("www.")) {
          u = `https://${u}`;
        } else if (u.startsWith("vodafone.pt") || u.startsWith("cycloid.pt")) {
          u = `https://${u}`;
        }
        return `href="${u}"`;
      }
    )
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, " ");

  const tokenRegex =
    /(<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>)|(\[([^\]]+)\]\(([^)]+)\))|(<(?:b|strong)>([\s\S]*?)<\/(?:b|strong)>)|(\*\*([^*]+)\*\*|__([^_]+)__)|(<(?:i|em)>([\s\S]*?)<\/(?:i|em)>)|(\*([^*]+)\*|_([^_]+)_)|(<code>([\s\S]*?)<\/code>)|(`([^`]+)`)|(<br\s*\/?>)/gi;

  const result = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      result.push({
        type: "text",
        content: cleaned.slice(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // HTML <a> tag
      result.push({ type: "link", url: match[2], content: match[3] });
    } else if (match[4]) {
      // Markdown [text](url)
      result.push({ type: "link", url: match[6], content: match[5] });
    } else if (match[7]) {
      // HTML <b> or <strong>
      result.push({ type: "bold", content: match[8] });
    } else if (match[9]) {
      // Markdown **bold** or __bold__
      result.push({ type: "bold", content: match[10] || match[11] });
    } else if (match[12]) {
      // HTML <i> or <em>
      result.push({ type: "italic", content: match[13] });
    } else if (match[14]) {
      // Markdown *italic* or _italic_
      result.push({ type: "italic", content: match[15] || match[16] });
    } else if (match[17]) {
      // HTML <code>
      result.push({ type: "code", content: match[18] });
    } else if (match[19]) {
      // Markdown `code`
      result.push({ type: "code", content: match[20] });
    } else if (match[21]) {
      // Line break
      result.push({ type: "br" });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    result.push({ type: "text", content: cleaned.slice(lastIndex) });
  }

  return result;
}

const FormattedDescription = ({ text, className, linkClassName }) => {
  if (!text) return null;
  const tokens = parseFormattedText(text);

  return (
    <span className={className}>
      {tokens.map((token, index) => {
        switch (token.type) {
          case "bold":
            return (
              <strong key={index}>
                {decodeHtmlEntities(token.content)}
              </strong>
            );
          case "italic":
            return (
              <em key={index}>
                {decodeHtmlEntities(token.content)}
              </em>
            );
          case "code":
            return (
              <code key={index} className={styles.code}>
                {decodeHtmlEntities(token.content)}
              </code>
            );
          case "br":
            return <br key={index} />;
          case "link":
            return (
              <span
                key={index}
                role="link"
                tabIndex={0}
                className={linkClassName || styles.inlineLink}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof window !== "undefined" && token.url) {
                    window.open(token.url, "_blank", "noopener,noreferrer");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof window !== "undefined" && token.url) {
                      window.open(token.url, "_blank", "noopener,noreferrer");
                    }
                  }
                }}
              >
                {decodeHtmlEntities(token.content)}
              </span>
            );
          case "text":
          default:
            return decodeHtmlEntities(token.content);
        }
      })}
    </span>
  );
};

export default FormattedDescription;
