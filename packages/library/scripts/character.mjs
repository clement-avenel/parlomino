// The Parlomino character: a small articulated figure drawn from pose data.
// Arms and legs are placed by inverse kinematics from hand and foot positions, so a pose is
// described as "the right hand is at the mouth" rather than as angles.
// Used by draw-characters.mjs; the output is plain SVG in the 100×100 canvas.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const C = {
  ink: "#1F2937",
  paper: "#FFFFFF",
  skin: "#F5C9A0",
  hair: "#6B4F3A",
  blue: "#4F86C6",
  green: "#6BAF5B",
  red: "#E46B4A",
  yellow: "#F2C14E",
  water: "#7EC8E3",
  orange: "#F4AA41",
  purple: "#9F86C0",
  brown: "#A57939",
  darkGray: "#3F3F3F",
  gray: "#9B9B9A",
};
// Style aligned on the OpenMoji guidelines (see docs/design-guidelines.md):
// a 2-unit black outline on a 72-unit grid, thickened ×1.35 like imported drawings → 3.75 on our 100 canvas,
// round caps and joins, flat palette colors, and artwork kept inside the template frame (4 to 68 of 72).
const LINE = 3.75;
/** The OpenMoji template frame, on the 100×100 canvas. */
export const FRAME = { min: (4 / 72) * 100, max: (68 / 72) * 100 };
// Current outline width and detail scale, set by character(): a close-up enlarges the drawing,
// so it draws thinner lines that end up at the same width as everywhere else.
let line = LINE;
let detail = 1;

const r = (n) => Math.round(n * 10) / 10;

/** Body proportions. A child has a bigger head and shorter limbs than an adult. */
const BODIES = {
  child: { head: { cy: 22, r: 13 }, shoulderY: 41, shoulderX: 9.5, hipY: 63, hipX: 5, upper: 12, fore: 11.5, thigh: 13, shin: 12.5 },
  adult: { head: { cy: 15, r: 11 }, shoulderY: 32, shoulderX: 11, hipY: 59, hipX: 5.5, upper: 14, fore: 13, thigh: 16, shin: 15.5 },
};

/** Two-bone inverse kinematics: the joint between `from` and `to`, bending to `side` (+1 or -1). */
function joint(from, to, a, b, side) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const d = Math.min(Math.hypot(dx, dy), a + b - 0.01);
  const angle = Math.atan2(dy, dx);
  const cos = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
  const t = angle + side * Math.acos(cos);
  const j = [from[0] + a * Math.cos(t), from[1] + a * Math.sin(t)];
  // Clamp the end to what the limb can reach.
  const reach = [j[0] + b * Math.cos(Math.atan2(to[1] - j[1], to[0] - j[0])), j[1] + b * Math.sin(Math.atan2(to[1] - j[1], to[0] - j[0]))];
  return [j, reach];
}

/** A limb with an outline: ink underneath, color on top. */
function limb(points, color, width) {
  const d = `M${points.map((p) => `${r(p[0])} ${r(p[1])}`).join(" L")}`;
  return (
    `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${r(width + 2 * line)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}

const HAIR = {
  short: ({ cx, cy, r: hr }) =>
    `<path d="M${r(cx - hr)} ${r(cy - 1)} Q${r(cx - hr)} ${r(cy - hr - 3)} ${cx} ${r(cy - hr - 2)} Q${r(cx + hr)} ${r(cy - hr - 3)} ${r(cx + hr)} ${r(cy - 1)} Q${r(cx + hr * 0.5)} ${r(cy - hr * 0.55)} ${cx} ${r(cy - hr * 0.6)} Q${r(cx - hr * 0.5)} ${r(cy - hr * 0.55)} ${r(cx - hr)} ${r(cy - 1)} Z" fill="${C.hair}" stroke="${C.ink}" stroke-width="${r(line)}" stroke-linejoin="round"/>`,
  long: ({ cx, cy, r: hr }) =>
    `<path d="M${r(cx - hr - 3)} ${r(cy + hr + 7)} Q${r(cx - hr - 4)} ${r(cy - hr - 4)} ${cx} ${r(cy - hr - 3)} Q${r(cx + hr + 4)} ${r(cy - hr - 4)} ${r(cx + hr + 3)} ${r(cy + hr + 7)} Z" fill="${C.hair}" stroke="${C.ink}" stroke-width="${r(line)}" stroke-linejoin="round"/>`,
  none: () => "",
};
// Long hair is drawn behind the head; the fringe in front.
const FRINGE = {
  long: ({ cx, cy, r: hr }) =>
    `<path d="M${r(cx - hr + 1)} ${r(cy - 2)} Q${r(cx - hr + 1)} ${r(cy - hr - 1)} ${cx} ${r(cy - hr - 1)} Q${r(cx + hr - 1)} ${r(cy - hr - 1)} ${r(cx + hr - 1)} ${r(cy - 2)} Q${cx} ${r(cy - hr * 0.6)} ${r(cx - hr + 1)} ${r(cy - 2)} Z" fill="${C.hair}" stroke="${C.ink}" stroke-width="${r(line)}" stroke-linejoin="round"/>`,
};

function face({ cx, cy, r: hr }, { eyes = "open", mouth = "smile", look = [0, 0] }) {
  const ex = hr * 0.36;
  const ey = cy + 0.5 + look[1];
  const out = [];
  if (eyes === "open") {
    for (const s of [-1, 1]) out.push(`<circle cx="${r(cx + s * ex + look[0])}" cy="${r(ey)}" r="1.7" fill="${C.ink}" stroke="${C.ink}" stroke-width="1"/>`);
  } else if (eyes === "happy") {
    out.push(`<path d="M${r(cx - ex - 2.2)} ${r(ey + 1)} Q${r(cx - ex)} ${r(ey - 2)} ${r(cx - ex + 2.2)} ${r(ey + 1)} M${r(cx + ex - 2.2)} ${r(ey + 1)} Q${r(cx + ex)} ${r(ey - 2)} ${r(cx + ex + 2.2)} ${r(ey + 1)}" fill="none" stroke="${C.ink}" stroke-width="${r(1.8 * detail)}" stroke-linecap="round"/>`);
  } else if (eyes === "closed") {
    out.push(`<path d="M${r(cx - ex - 2.2)} ${r(ey)} Q${r(cx - ex)} ${r(ey + 2)} ${r(cx - ex + 2.2)} ${r(ey)} M${r(cx + ex - 2.2)} ${r(ey)} Q${r(cx + ex)} ${r(ey + 2)} ${r(cx + ex + 2.2)} ${r(ey)}" fill="none" stroke="${C.ink}" stroke-width="${r(1.8 * detail)}" stroke-linecap="round"/>`);
  }
  const my = cy + hr * 0.45;
  if (mouth === "smile") out.push(`<path d="M${r(cx - 3.5)} ${r(my)} Q${cx} ${r(my + 3.5)} ${r(cx + 3.5)} ${r(my)}" fill="none" stroke="${C.ink}" stroke-width="${r(1.8 * detail)}" stroke-linecap="round"/>`);
  if (mouth === "open") out.push(`<ellipse cx="${cx}" cy="${r(my + 1)}" rx="2.8" ry="2.4" fill="${C.ink}" stroke="${C.ink}" stroke-width="1"/>`);
  if (mouth === "sad") out.push(`<path d="M${r(cx - 3.5)} ${r(my + 2.5)} Q${cx} ${r(my - 1)} ${r(cx + 3.5)} ${r(my + 2.5)}" fill="none" stroke="${C.ink}" stroke-width="${r(1.8 * detail)}" stroke-linecap="round"/>`);
  if (mouth === "laugh") out.push(`<path d="M${r(cx - 4.5)} ${r(my - 0.5)} H${r(cx + 4.5)} Q${r(cx + 4.5)} ${r(my + 5.5)} ${cx} ${r(my + 5.5)} Q${r(cx - 4.5)} ${r(my + 5.5)} ${r(cx - 4.5)} ${r(my - 0.5)} Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="1" stroke-linejoin="round"/>`);
  if (mouth === "neutral") out.push(`<path d="M${r(cx - 2.5)} ${r(my + 1)} H${r(cx + 2.5)}" fill="none" stroke="${C.ink}" stroke-width="${r(1.8 * detail)}" stroke-linecap="round"/>`);
  return out.join("");
}

/**
 * Draws a character.
 * pose: { l, r } hand targets, { lf, rf } foot targets (absolute, in the character's own 100×100 frame),
 *       bend: { la, ra, ll, rl } = +1/-1 to choose the elbow/knee side.
 * look: { eyes, mouth, look: [dx, dy] }, outfit: { shirt, pants, hair: "short"|"long"|"none", beard }.
 * back: drawn behind the body (a chair, a bed). held: in front of the body but behind the hands (a book held
 * with both hands). front: in front of everything (a cup at the mouth, a table).
 */
export function character({ body = "child", pose = {}, look = {}, outfit = {}, front = "", held = "", back = "", armsBehind = false, bust = false }) {
  const B = BODIES[body];
  detail = bust ? 1 / closeUpScale(B) : 1;
  line = LINE * detail;
  const cx = 50;
  const head = { cx, cy: B.head.cy, r: B.head.r };
  const sl = [cx - B.shoulderX, B.shoulderY];
  const sr = [cx + B.shoulderX, B.shoulderY];
  const hl = [cx - B.hipX, B.hipY];
  const hr = [cx + B.hipX, B.hipY];
  const floor = B.hipY + B.thigh + B.shin - 1;
  const p = {
    l: pose.l ?? [sl[0] - 2, B.shoulderY + B.upper + B.fore - 1],
    r: pose.r ?? [sr[0] + 2, B.shoulderY + B.upper + B.fore - 1],
    lf: pose.lf ?? [hl[0] - 1, floor],
    rf: pose.rf ?? [hr[0] + 1, floor],
  };
  const bend = { la: 1, ra: -1, ll: -1, rl: 1, ...pose.bend };
  const [el, hlEnd] = joint(sl, p.l, B.upper, B.fore, bend.la);
  const [er, hrEnd] = joint(sr, p.r, B.upper, B.fore, bend.ra);
  const [kl, flEnd] = joint(hl, p.lf, B.thigh, B.shin, bend.ll);
  const [kr, frEnd] = joint(hr, p.rf, B.thigh, B.shin, bend.rl);
  const shirt = outfit.shirt ?? C.blue;
  const pants = outfit.pants ?? C.darkGray;
  const hair = outfit.hair ?? "short";

  const torso = `<path d="M${r(sl[0] - 1.5)} ${r(B.shoulderY + 3)} Q${r(sl[0] - 1.5)} ${r(B.shoulderY - 3)} ${r(sl[0] + 4)} ${r(B.shoulderY - 3)} H${r(sr[0] - 4)} Q${r(sr[0] + 1.5)} ${r(B.shoulderY - 3)} ${r(sr[0] + 1.5)} ${r(B.shoulderY + 3)} L${r(hr[0] + 4)} ${r(B.hipY + 2)} H${r(hl[0] - 4)} Z" fill="${shirt}" stroke="${C.ink}" stroke-width="${r(line)}" stroke-linejoin="round"/>`;
  const legs = limb([hl, kl, flEnd], pants, 6.5) + limb([hr, kr, frEnd], pants, 6.5);
  const shoes = [flEnd, frEnd]
    .map((f, i) => `<ellipse cx="${r(f[0] + (i ? 1.5 : -1.5))}" cy="${r(f[1] + 1)}" rx="5" ry="3" fill="${C.ink}" stroke="${C.ink}" stroke-width="1"/>`)
    .join("");
  const hands = [hlEnd, hrEnd].map((h) => `<circle cx="${r(h[0])}" cy="${r(h[1])}" r="3.6" fill="${C.skin}" stroke="${C.ink}" stroke-width="${r(2.4 * detail)}"/>`).join("");
  const arms = limb([sl, el, hlEnd], shirt, 5) + limb([sr, er, hrEnd], shirt, 5);
  const jaw = head.cy + head.r * 0.45 + 3.5;
  const beard = outfit.beard
    ? `<path d="M${r(cx - head.r + 0.5)} ${r(head.cy + 1)} Q${r(cx - head.r + 1)} ${r(head.cy + head.r + 3)} ${cx} ${r(head.cy + head.r + 3)} Q${r(cx + head.r - 1)} ${r(head.cy + head.r + 3)} ${r(cx + head.r - 0.5)} ${r(head.cy + 1)} Q${r(cx + 5)} ${r(jaw)} ${cx} ${r(jaw)} Q${r(cx - 5)} ${r(jaw)} ${r(cx - head.r + 0.5)} ${r(head.cy + 1)} Z" fill="${C.hair}" stroke="${C.ink}" stroke-width="${r(line)}" stroke-linejoin="round"/>`
    : "";
  const headSvg =
    (hair === "long" ? HAIR.long(head) : "") +
    `<circle cx="${cx}" cy="${head.cy}" r="${head.r}" fill="${C.skin}" stroke="${C.ink}" stroke-width="${r(line)}"/>` +
    beard +
    (hair === "long" ? FRINGE.long(head) : HAIR[hair](head)) +
    face(head, look);

  const lower = bust ? "" : legs + shoes;
  const drawing = armsBehind
    ? back + arms + hands + lower + torso + headSvg + held + front
    : back + lower + torso + headSvg + arms + held + hands + front;
  return bust ? closeUp(drawing, B) : drawing;
}

/**
 * Close-up framing, like AAC symbols do for actions of the face and hands: the upper body only,
 * enlarged so that the hands, the mouth and the props are easy to see.
 */
const closeUpTop = (B) => B.head.cy - B.head.r - 3;
// Leave room under the hips for the hands, so that nothing touches the frame.
const closeUpScale = (B) => (FRAME.max - 2 - (FRAME.min + 2)) / (B.hipY + 6 - closeUpTop(B));

function closeUp(drawing, B) {
  const top = closeUpTop(B);
  const k = closeUpScale(B);
  return `<g transform="translate(${r(50 - 50 * k)} ${r(FRAME.min + 2 - top * k)}) scale(${r(k * 100) / 100})">${drawing}</g>`;
}

/** Joints of a body, so that props can be placed relative to them. */
export function anchors(body = "child") {
  const B = BODIES[body];
  const h = { cx: 50, cy: B.head.cy, r: B.head.r };
  return {
    mouth: [50, r(h.cy + h.r * 0.45 + 1)],
    eyes: [50, h.cy],
    leftEar: [50 - h.r, h.cy],
    rightEar: [50 + h.r, h.cy],
    forehead: [50, h.cy - h.r * 0.5],
    chest: [50, B.shoulderY + 7],
    belly: [50, B.hipY - 6],
    head: h,
    floor: B.hipY + B.thigh + B.shin,
    shoulderY: B.shoulderY,
  };
}

/** Places a drawing (inner SVG in a 100×100 box) at a center point, with a size and a rotation. */
export function place(svg, [x, y], size, rotate = 0) {
  const s = size / 100;
  return `<g transform="translate(${r(x)} ${r(y)}) rotate(${rotate}) scale(${r(s * 1000) / 1000}) translate(-50 -50)">${svg}</g>`;
}

/** Scales and moves a whole drawing, e.g. to put two characters side by side. */
export function group(svg, [x, y], scale = 1) {
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${scale})">${svg}</g>`;
}

/** Inner SVG of a library element, to reuse it as a prop (a cup, a spoon, a book…). */
export function element(root, id) {
  const [prefix, name] = id.split(".");
  const svg = readFileSync(join(root, "elements", prefix, `${name}.svg`), "utf8");
  return svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)[1].replace(/<!--[\s\S]*?-->/g, "").replace(/\s*\n\s*/g, "").trim();
}

/** A stroked mark (motion lines, sound waves, arrows) that stays visible in every theme. */
export function stroke(d, width = 3.4) {
  return `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
