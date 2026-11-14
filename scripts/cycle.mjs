// Adds a looping typewriter subtitle to the hero cards made by expressive-profile.
// The generator only types its subtitle once, so profile.json keeps the subtitle
// empty and this script draws the cycling lines from cycle.json instead.
// Safe to run repeatedly: a hero that already has the loop is left alone.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const { lines, type = 0.09, erase = 0.045, hold = 1.8, gap = 0.4 } = JSON.parse(readFileSync("cycle.json", "utf8"));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Every frame of the loop: [text on screen, seconds it stays].
const frames = [];
for (const line of lines) {
  const chars = [...line];
  for (let k = 1; k <= chars.length; k++) frames.push([chars.slice(0, k).join(""), k === chars.length ? hold : type]);
  for (let k = chars.length - 1; k >= 0; k--) frames.push([chars.slice(0, k).join(""), k === 0 ? gap : erase]);
}
const total = frames.reduce((a, [, d]) => a + d, 0);
const starts = [];
let t = 0;
for (const [, d] of frames) {
  starts.push(t / total);
  t += d;
}
const keyTimes = starts.map((x) => x.toFixed(5)).join(";");

function loop(textFill, cursorFill) {
  const shown = [...new Set(frames.map(([s]) => s))];
  const out = [`<g id="cyc" style="font-size:19px;font-weight:400">`];
  for (const s of shown) {
    const values = frames.map(([f]) => (f === s ? 1 : 0)).join(";");
    out.push(
      `<text x="294" y="194" fill="${textFill}" opacity="0">${esc(s)}<tspan fill="${cursorFill}" font-weight="500">|</tspan>` +
        `<animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" calcMode="discrete" dur="${total.toFixed(2)}s" repeatCount="indefinite"/></text>`,
    );
  }
  out.push(`</g>`);
  return out.join("");
}

for (const mode of ["dark", "light"]) {
  const file = `assets/hero-${mode}.svg`;
  if (!existsSync(file)) continue;
  let svg = readFileSync(file, "utf8");
  if (svg.includes('id="cyc"')) continue;
  const textFill = svg.match(/<text x="294\.0" y="92\.0" fill="(#[0-9a-fA-F]{3,8})"/)?.[1] ?? "#888888";
  const cursorFill = svg.match(/class="spin" d="[^"]*" fill="(#[0-9a-fA-F]{3,8})" opacity="\.9"/)?.[1] ?? textFill;
  svg = svg.replace(/<\/svg>\s*$/, loop(textFill, cursorFill) + "</svg>");
  writeFileSync(file, svg);
  console.log("cycle added to", file);
}
