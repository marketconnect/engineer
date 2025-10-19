// Component definitions for QET Web (Analogue)
// Each component definition describes: display name, default size, ports, and a drawing function

// Unit helpers
const PX_PER_MM = 96 / 25.4;
function mm(v) { return v * PX_PER_MM; }

export const COMPONENT_DEFS = {
  resistor: {
    name: "Resistor",
    w: 80,
    h: 40,
    ports: [
      { id: "A", x: 0, y: 20, side: "W" },
      { id: "B", x: 80, y: 20, side: "E" },
    ],
    drawBody(g, w, h) {
      const midY = h / 2;
      const left = 10, right = w - 10;
      // leads
      g.appendChild(line(0, midY, left, midY));
      g.appendChild(line(right, midY, w, midY));
      // zigzag
      const points = [];
      const segment = (right - left) / 6;
      let x = left;
      points.push(`${x},${midY}`);
      let up = -12;
      for (let i = 0; i < 6; i++) {
        x += segment;
        points.push(`${x},${midY + up}`);
        up *= -1;
      }
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      poly.setAttribute("points", points.join(" "));
      poly.setAttribute("class", "body");
      poly.setAttribute("fill", "none");
      g.appendChild(poly);
    },
  },
  capacitor: {
    name: "Capacitor",
    w: 80,
    h: 40,
    ports: [
      { id: "A", x: 0, y: 20, side: "W" },
      { id: "B", x: 80, y: 20, side: "E" },
    ],
    drawBody(g, w, h) {
      const midY = h / 2;
      const leftPlate = w / 2 - 6;
      const rightPlate = w / 2 + 6;
      g.appendChild(line(0, midY, leftPlate - 6, midY));
      g.appendChild(line(leftPlate, 8, leftPlate, h - 8));
      g.appendChild(line(rightPlate, 8, rightPlate, h - 8));
      g.appendChild(line(rightPlate + 6, midY, w, midY));
    },
  },
  inductor: {
    name: "Inductor",
    w: 80,
    h: 40,
    ports: [
      { id: "A", x: 0, y: 20, side: "W" },
      { id: "B", x: 80, y: 20, side: "E" },
    ],
    drawBody(g, w, h) {
      const midY = h / 2;
      const left = 10, right = w - 10;
      g.appendChild(line(0, midY, left, midY));
      g.appendChild(line(right, midY, w, midY));
      const radius = (right - left) / 8;
      let x = left;
      for (let i = 0; i < 4; i++) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const cx = x + radius * 1.5;
        const d = `M ${x} ${midY} q ${radius} -${radius} ${radius * 1.5} 0 q ${radius} ${radius} ${radius * 1.5} 0`;
        path.setAttribute("d", d);
        path.setAttribute("class", "body");
        path.setAttribute("fill", "none");
        g.appendChild(path);
        x += radius * 3;
      }
    },
  },
  lamp: {
    name: "Lamp",
    w: 80,
    h: 40,
    ports: [
      { id: "A", x: 0, y: 20, side: "W" },
      { id: "B", x: 80, y: 20, side: "E" },
    ],
    drawBody(g, w, h) {
      const midY = h / 2;
      const cx = w / 2, cy = midY, r = 12;
      g.appendChild(line(0, midY, cx - r - 8, midY));
      g.appendChild(line(cx + r + 8, midY, w, midY));
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", r);
      circle.setAttribute("class", "body");
      g.appendChild(circle);
      g.appendChild(line(cx - r / 1.5, cy - r / 1.5, cx + r / 1.5, cy + r / 1.5));
      g.appendChild(line(cx - r / 1.5, cy + r / 1.5, cx + r / 1.5, cy - r / 1.5));
    },
  },
  switch: {
    name: "Switch",
    w: 90,
    h: 40,
    ports: [
      { id: "A", x: 0, y: 20, side: "W" },
      { id: "B", x: 90, y: 20, side: "E" },
    ],
    drawBody(g, w, h) {
      const midY = h / 2;
      g.appendChild(line(0, midY, 20, midY));
      g.appendChild(circle(28, midY, 3));
      g.appendChild(circle(w - 28, midY, 3));
      const lever = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lever.setAttribute("x1", 30);
      lever.setAttribute("y1", midY - 2);
      lever.setAttribute("x2", w - 30);
      lever.setAttribute("y2", midY - 12);
      lever.setAttribute("class", "body");
      g.appendChild(lever);
      g.appendChild(line(w - 20, midY, w, midY));
    },
  },
  ground: {
    name: "Ground",
    w: 50,
    h: 50,
    ports: [ { id: "G", x: 25, y: 0, side: "N" } ],
    drawBody(g, w, h) {
      const cx = w / 2, top = 12;
      g.appendChild(line(cx, 0, cx, top));
      g.appendChild(line(cx - 12, top + 6, cx + 12, top + 6));
      g.appendChild(line(cx - 8, top + 12, cx + 8, top + 12));
      g.appendChild(line(cx - 4, top + 18, cx + 4, top + 18));
    },
  },
  vcc: {
    name: "VCC",
    w: 50,
    h: 50,
    ports: [ { id: "V", x: 25, y: 50, side: "S" } ],
    drawBody(g, w, h) {
      const cx = w / 2, base = h - 12;
      g.appendChild(line(cx, base, cx, h));
      const tri = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const d = `M ${cx} ${base - 26} L ${cx - 12} ${base - 6} L ${cx + 12} ${base - 6} Z`;
      tri.setAttribute("d", d);
      tri.setAttribute("class", "body");
      tri.setAttribute("fill", "#0b1225");
      g.appendChild(tri);
      const plus = document.createElementNS("http://www.w3.org/2000/svg", "path");
      plus.setAttribute("d", `M ${cx} ${base - 20} v 8 M ${cx - 4} ${base - 16} h 8`);
      plus.setAttribute("class", "body");
      g.appendChild(plus);
    },
  },
  terminal: {
    name: "Terminal",
    w: 30,
    h: 30,
    ports: [ { id: "T", x: 15, y: 15, side: "C" } ],
    drawBody(g, w, h) {
      g.appendChild(circle(w / 2, h / 2, 4));
    },
  },
  text: {
    name: "Text",
    w: 80,
    h: 20,
    ports: [],
    drawBody(g, w, h) {
      // no graphic body; label is rendered separately
    },
  },
  // Standard frames according to ISO 5457/7200
  frame_iso_a4_landscape: {
    name: "ISO A4 Frame",
    defaultLabel: "",
    w: mm(297),
    h: mm(210),
    ports: [],
    drawBody(g, w, h) {
      const margins = { left: mm(10), right: mm(10), top: mm(10), bottom: mm(10) };
      drawStandardFrame(g, w, h, margins, mm(180), mm(55));
    },
  },
  frame_iso_a3_landscape: {
    name: "ISO A3 Frame",
    defaultLabel: "",
    w: mm(420),
    h: mm(297),
    ports: [],
    drawBody(g, w, h) {
      const margins = { left: mm(20), right: mm(10), top: mm(10), bottom: mm(10) };
      drawStandardFrame(g, w, h, margins, mm(180), mm(55));
    },
  },
  // Standard frames according to GOST (ESKD)
  frame_gost_a4_landscape: {
    name: "GOST A4 Frame",
    defaultLabel: "",
    w: mm(297),
    h: mm(210),
    ports: [],
    drawBody(g, w, h) {
      const margins = { left: mm(20), right: mm(5), top: mm(5), bottom: mm(5) };
      drawStandardFrame(g, w, h, margins, mm(180), mm(55));
    },
  },
  frame_gost_a3_landscape: {
    name: "GOST A3 Frame",
    defaultLabel: "",
    w: mm(420),
    h: mm(297),
    ports: [],
    drawBody(g, w, h) {
      const margins = { left: mm(20), right: mm(5), top: mm(5), bottom: mm(5) };
      drawStandardFrame(g, w, h, margins, mm(180), mm(55));
    },
  },
};

export const PALETTE_ORDER = [
  "resistor",
  "capacitor",
  "inductor",
  "lamp",
  "switch",
  "ground",
  "vcc",
  "terminal",
  "text",
  "frame_iso_a4_landscape",
  "frame_iso_a3_landscape",
  "frame_gost_a4_landscape",
  "frame_gost_a3_landscape",
];

export function createPaletteItem(type) {
  const def = COMPONENT_DEFS[type];
  const wrapper = document.createElement("div");
  wrapper.className = "palette-item";
  wrapper.draggable = false; // we'll implement custom drag
  const label = document.createElement("span");
  label.textContent = def.name;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${def.w} ${def.h}`);
  svg.setAttribute("width", "64");
  svg.setAttribute("height", "64");
  svg.style.overflow = "visible";
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  def.drawBody(g, def.w, def.h);
  styleAsBody(g);
  svg.appendChild(g);
  wrapper.appendChild(svg);
  wrapper.appendChild(label);
  wrapper.dataset.type = type;
  return wrapper;
}

function styleAsBody(g) {
  const kids = Array.from(g.children);
  for (const el of kids) {
    if (!el.getAttribute("class")) el.setAttribute("class", "body");
  }
}

function line(x1, y1, x2, y2) {
  const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
  l.setAttribute("x1", x1);
  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);
  l.setAttribute("y2", y2);
  l.setAttribute("class", "body");
  return l;
}

function circle(cx, cy, r) {
  const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("cx", cx);
  c.setAttribute("cy", cy);
  c.setAttribute("r", r);
  c.setAttribute("class", "body");
  return c;
}

function rect(x, y, w, h) {
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", w);
  r.setAttribute("height", h);
  r.setAttribute("class", "body");
  r.setAttribute("fill", "none");
  return r;
}

function drawStandardFrame(g, w, h, margins, titleW, titleH) {
  // Outer page border
  const outer = rect(0, 0, w, h);
  g.appendChild(outer);

  // Inner frame border inside margins
  const innerX = margins.left;
  const innerY = margins.top;
  const innerW = Math.max(0, w - margins.left - margins.right);
  const innerH = Math.max(0, h - margins.top - margins.bottom);
  const inner = rect(innerX, innerY, innerW, innerH);
  g.appendChild(inner);

  // Title block placed at bottom-right inside inner frame
  const tw = Math.min(titleW, innerW);
  const th = Math.min(titleH, innerH);
  const tx = innerX + innerW - tw;
  const ty = innerY + innerH - th;
  const title = rect(tx, ty, tw, th);
  g.appendChild(title);

  // Simple subdivision lines inside title block for structure (not strictly standardised here)
  // Vertical subdivision ~20mm from left
  const v1 = tx + Math.min(mm(20), tw * 0.25);
  g.appendChild(line(v1, ty, v1, ty + th));
  // Vertical subdivision ~100mm from left
  const v2 = tx + Math.min(mm(100), tw * 0.75);
  g.appendChild(line(v2, ty, v2, ty + th));
  // Horizontal subdivision ~15mm from bottom
  const h1 = ty + Math.min(th - mm(15), th * 0.7);
  g.appendChild(line(tx, h1, tx + tw, h1));
}
