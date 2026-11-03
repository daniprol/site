/**
 * "Arousa" syntax themes for Expressive Code, in VS Code theme format.
 * Expressive Code needs concrete colours (it checks contrast), so these hex values
 * mirror the tokens in tokens.css. Change both together.
 */
interface Palette {
  bg: string;
  fg: string;
  comment: string;
  teal: string;
  ochre: string;
  coral: string;
  blue: string;
  selection: string;
}

const day: Palette = {
  bg: "#eef1f1",
  fg: "#1c2a30",
  comment: "#62737a",
  teal: "#0b6b6e",
  ochre: "#855f00",
  coral: "#b03f2a",
  blue: "#3a5c96",
  selection: "#d8e4e4",
};

const night: Palette = {
  bg: "#182226",
  fg: "#d6dedf",
  comment: "#7f9097",
  teal: "#62c3bd",
  ochre: "#dcb65e",
  coral: "#ee8b70",
  blue: "#90afe4",
  selection: "#25363b",
};

function theme(name: string, type: "light" | "dark", p: Palette) {
  return {
    name,
    type,
    colors: {
      "editor.background": p.bg,
      "editor.foreground": p.fg,
      "editor.selectionBackground": p.selection,
      "editorLineNumber.foreground": p.comment,
      "terminal.background": p.bg,
    },
    tokenColors: [
      {
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: p.comment, fontStyle: "italic" },
      },
      { scope: ["keyword", "storage", "storage.type", "keyword.operator.new"], settings: { foreground: p.coral } },
      { scope: ["string", "string.quoted", "markup.inline.raw"], settings: { foreground: p.ochre } },
      {
        scope: ["entity.name.function", "support.function", "meta.function-call", "entity.name.tag"],
        settings: { foreground: p.teal },
      },
      {
        scope: [
          "entity.name.type",
          "entity.name.class",
          "support.class",
          "support.type",
          "constant",
          "constant.numeric",
        ],
        settings: { foreground: p.blue },
      },
      {
        scope: ["variable.parameter", "entity.other.attribute-name"],
        settings: { foreground: p.ochre, fontStyle: "italic" },
      },
      { scope: ["keyword.operator", "punctuation"], settings: { foreground: p.comment } },
      { scope: ["markup.heading"], settings: { foreground: p.teal, fontStyle: "bold" } },
      { scope: ["markup.inserted"], settings: { foreground: p.teal } },
      { scope: ["markup.deleted"], settings: { foreground: p.coral } },
    ],
  };
}

export const arousaLight = theme("arousa-day", "light", day);
export const arousaDark = theme("arousa-night", "dark", night);
