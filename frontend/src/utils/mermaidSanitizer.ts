/**
 * Mermaid Diagram Sanitizer & Auto-Repair Utility
 * Fixes common syntax issues produced by LLMs (such as Google Gemini):
 * 1. Unquoted parentheses `()` or colons `:` inside node shapes (which crash the Mermaid lexer).
 * 2. Unquoted stadium nodes `Start([Text])` -> `Start(["Text"])`.
 * 3. Unquoted decision diamonds `B{Choice?}` -> `B{"Choice?"}`.
 * 4. Unquoted subgraph titles `subgraph ID [Title]` -> `subgraph ID ["Title"]`.
 * 5. Missing diagram type declarations (defaults to `flowchart TD`).
 * 6. Strips markdown code fences.
 */

export function sanitizeMermaid(rawChart: string): string {
  if (!rawChart || !rawChart.trim()) return '';

  // 1. Strip markdown code fences (```mermaid ... ``` or ``` ...)
  let clean = rawChart
    .replace(/^```(?:mermaid)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 2. If no valid diagram header is present, default to flowchart TD
  const supportedHeaders = [
    'graph',
    'flowchart',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'stateDiagram-v2',
    'erDiagram',
    'gantt',
    'pie',
    'gitGraph',
    'quadrantChart',
    'requirementDiagram',
    'c4Context',
    'mindmap',
    'timeline',
    'zenuml',
    'sankey-beta',
    'xychart-beta',
    'block-beta',
  ];

  const hasHeader = supportedHeaders.some((header) => {
    const regex = new RegExp(`^\\s*${header}\\b`, 'm');
    return regex.test(clean);
  });

  if (!hasHeader) {
    clean = `flowchart TD\n${clean}`;
  }

  // 3. Process line-by-line to safely wrap unquoted text in quotes
  const lines = clean.split('\n');
  const sanitizedLines = lines.map((line) => {
    const trimmed = line.trim();

    // Preserve comments, style definitions, class definitions, and link styles
    if (
      trimmed.startsWith('%%') ||
      trimmed.startsWith('style ') ||
      trimmed.startsWith('classDef ') ||
      trimmed.startsWith('class ') ||
      trimmed.startsWith('linkStyle ')
    ) {
      return line;
    }

    let processed = line;

    // A. Subgraph titles: subgraph ID [Title with - or :] -> subgraph ID ["Title with - or :"]
    processed = processed.replace(
      /(\bsubgraph\s+[A-Za-z0-9_-]+\s*)\[\s*(?!")([^\]]+?)\s*\]/g,
      (_match, prefix, title) => `${prefix}["${title.replace(/"/g, "'")}"]`
    );

    // B. Stadium nodes: ID([label]) -> ID(["label"])
    processed = processed.replace(
      /([A-Za-z0-9_-]+)\(\[\s*(?!")([^\n\]]+?)\s*\]\)/g,
      (_match, id, text) => `${id}(["${text.replace(/"/g, "'")}"])`
    );

    // C. Subroutine nodes: ID[[label]] -> ID[["label"]]
    processed = processed.replace(
      /([A-Za-z0-9_-]+)\[\[\s*(?!")([^\n\]]+?)\s*\]\]/g,
      (_match, id, text) => `${id}[["${text.replace(/"/g, "'")}"]]`
    );

    // D. Cylinder nodes: ID[(label)] -> ID[("label")]
    processed = processed.replace(
      /([A-Za-z0-9_-]+)\[\(\s*(?!")([^\n\)]+?)\s*\)\]/g,
      (_match, id, text) => `${id}[("${text.replace(/"/g, "'")}")]`
    );

    // E. Decision diamonds: ID{label} -> ID{"label"}
    processed = processed.replace(
      /([A-Za-z0-9_-]+)\{\s*(?!")([^\n\}]+?)\s*\}/g,
      (_match, id, text) => `${id}{"${text.replace(/"/g, "'")}"}`
    );

    // F. Rectangular nodes: ID[label] -> ID["label"]
    // Avoid re-quoting already quoted nodes ["..."]
    processed = processed.replace(
      /([A-Za-z0-9_-]+)\[\s*(?!")([^\n\]]+?)\s*\]/g,
      (_match, id, text) => `${id}["${text.replace(/"/g, "'")}"]`
    );

    return processed;
  });

  return sanitizedLines.join('\n');
}

/**
 * Secondary aggressive recovery sanitizer if initial render throws
 * E.g., removes problematic style definitions or direct subgraph arrows
 */
export function aggressiveRepairMermaid(chart: string): string {
  let repaired = sanitizeMermaid(chart);

  // Remove direct style rules on subgraphs if any (e.g., `style Phase1 ...`) which crash older engines
  const subgraphNames: string[] = [];
  const subgraphRegex = /\bsubgraph\s+([A-Za-z0-9_-]+)/g;
  let match;
  while ((match = subgraphRegex.exec(repaired)) !== null) {
    subgraphNames.push(match[1]);
  }

  if (subgraphNames.length > 0) {
    const lines = repaired.split('\n');
    const filteredLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('style ')) {
        const parts = trimmed.split(/\s+/);
        const targetId = parts[1];
        if (subgraphNames.includes(targetId)) {
          return false;
        }
      }
      return true;
    });
    repaired = filteredLines.join('\n');
  }

  return repaired;
}
