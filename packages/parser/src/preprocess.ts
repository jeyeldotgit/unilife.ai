import nlp from "compromise";

const FILIPINO_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bngayon\b/gi, "today"],
  [/\bbukas\b/gi, "tomorrow"],
  [/\bsusunod na linggo\b/gi, "next week"],
  [/\bngayong linggo\b/gi, "this week"],
  [/\blunes\b/gi, "monday"],
  [/\bmartes\b/gi, "tuesday"],
  [/\bmiyerkules\b/gi, "wednesday"],
  [/\bhuwebes\b/gi, "thursday"],
  [/\bbiyernes\b/gi, "friday"],
  [/\bsabado\b/gi, "saturday"],
  [/\blinggo\b/gi, "sunday"],
  [/\bklase\b/gi, "class"],
  [/\bmay pasok\b/gi, "class"],
  [/\bpagsusulit\b/gi, "exam"],
  [/\bgastos\b/gi, "expense"],
  [/\bnagastos(?: ako)?(?: ng)?\b/gi, "spent"],
  [/\bipasa\b/gi, "submit"],
  [/\bdeadline ko\b/gi, "my deadline"],
  [/\bsa umaga\b/gi, "am"],
  [/\bsa hapon\b/gi, "pm"],
  [/\bsa gabi\b/gi, "pm"],
];

export type NormalizedInput = {
  original: string;
  normalized: string;
  document: ReturnType<typeof nlp>;
};

export function normalizeInput(input: string): NormalizedInput {
  const original = input.trim().replace(/\s+/g, " ");
  const normalized = FILIPINO_REPLACEMENTS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    original,
  )
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  return {
    original,
    normalized,
    document: nlp(normalized),
  };
}
