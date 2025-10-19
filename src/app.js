import { COMPONENT_DEFS, PALETTE_ORDER, createPaletteItem } from './components.js';

const svg = document.getElementById('canvas');
const svgContainer = document.getElementById('svg-container');
const elementsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
const wiresGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
const viewport = document.createElementNS('http://www.w3.org/2000/svg', 'g');
viewport.setAttribute('id', 'viewport');
viewport.appendChild(wiresGroup);
viewport.appendChild(elementsGroup);
svg.appendChild(viewport);

const paletteEl = document.getElementById('palette-items');
const inspectorEl = document.getElementById('inspector-content');

const TOOL_SELECT = 'select';
const TOOL_WIRE = 'wire';

const state = {
  tool: TOOL_SELECT,
  elements: [], // { id, type, x, y, rot, label }
  wires: [], // { id, from: {el, port}, to: {el, port} }
  selected: null, // { kind: 'element'|'wire', id }
  drag: null, // { id, startX, startY, origX, origY }
  panning: null, // { x, y }
  wiring: null, // { el, port }
  zoom: 1,
  panX: 0,
  panY: 0,
  nextId: 1,
  history: [],
  future: [],
};

const GRID = 10;

// Initialize palette
for (const type of PALETTE_ORDER) {
  const item = createPaletteItem(type);
  item.addEventListener('mousedown', onPaletteMouseDown(type));
  paletteEl.appendChild(item);
}

function onPaletteMouseDown(type) {
  return (e) => {
    e.preventDefault();
    // custom drag preview
    const def = COMPONENT_DEFS[type];
    const preview = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    preview.setAttribute('viewBox', `0 0 ${def.w} ${def.h}`);
    preview.setAttribute('width', def.w);
    preview.setAttribute('height', def.h);
    preview.classList.add('drag-preview');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    def.drawBody(g, def.w, def.h);
    preview.appendChild(g);
    document.body.appendChild(preview);
    const move = (ev) => {
      preview.style.left = `${ev.clientX}px`;
      preview.style.top = `${ev.clientY}px`;
    };
    move(e);
    const up = (ev) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      preview.remove();
      // drop if over svg container
      const rect = svgContainer.getBoundingClientRect();
      if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
        const pt = clientToViewport(ev.clientX, ev.clientY);
        const x = snap(pt.x - def.w / 2, GRID);
        const y = snap(pt.y - def.h / 2, GRID);
        addElement({ type, x, y, rot: 0, label: def.name });
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
}

function clientToViewport(clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const m = viewport.getScreenCTM();
  if (!m) return { x: clientX, y: clientY };
  const p = pt.matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

function snap(v, s) { return Math.round(v / s) * s; }

function uid(prefix) { return `${prefix}-${Date.now().toString(36)}-${state.nextId++}`; }

function snapshot() {
  return {
    elements: state.elements.map(e => ({ ...e })),
    wires: state.wires.map(w => ({ id: w.id, from: { ...w.from }, to: { ...w.to } })),
  };
}

function restore(data) {
  state.elements = data.elements.map(e => ({ ...e }));
  state.wires = data.wires.map(w => ({ id: w.id, from: { ...w.from }, to: { ...w.to } }));
  state.selected = null;
  render();
  updateInspector();
}

function pushHistory() {
  state.history.push(snapshot());
  if (state.history.length > 200) state.history.shift();
  state.future = [];
}

function undo() {
  if (state.history.length === 0) return;
  const curr = snapshot();
  const prev = state.history.pop();
  state.future.push(curr);
  restore(prev);
}

function redo() {
  if (state.future.length === 0) return;
  const curr = snapshot();
  const next = state.future.pop();
  state.history.push(curr);
  restore(next);
}

function addElement({ type, x, y, rot = 0, label = '' }) {
  pushHistory();
  const id = uid('el');
  state.elements.push({ id, type, x, y, rot, label });
  render();
  select({ kind: 'element', id });
}

function removeElement(id) {
  pushHistory();
  const idx = state.elements.findIndex(e => e.id === id);
  if (idx >= 0) {
    // remove wires connected to this element
    state.wires = state.wires.filter(w => w.from.el !== id && w.to.el !== id);
    state.elements.splice(idx, 1);
    if (state.selected && state.selected.id === id) state.selected = null;
  }
}

function addWire(from, to) {
  pushHistory();
  const id = uid('w');
  state.wires.push({ id, from, to });
}

function removeWire(id) {
  pushHistory();
  const idx = state.wires.findIndex(w => w.id === id);
  if (idx >= 0) {
    state.wires.splice(idx, 1);
    if (state.selected && state.selected.id === id) state.selected = null;
  }
}

function select(sel) {
  state.selected = sel;
  render();
  updateInspector();
}

function updateInspector() {
  inspectorEl.innerHTML = '';
  if (!state.selected) { inspectorEl.innerHTML = '<p>No selection</p>'; return; }
  if (state.selected.kind === 'element') {
    const el = state.elements.find(e => e.id === state.selected.id);
    if (!el) { inspectorEl.innerHTML = '<p>No selection</p>'; return; }
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="row"><label>ID</label><div>${el.id}</div></div>
      <div class="row"><label>Type</label><div>${el.type}</div></div>
      <div class="row"><label>X</label><input id="ins-x" type="number" value="${el.x}" /></div>
      <div class="row"><label>Y</label><input id="ins-y" type="number" value="${el.y}" /></div>
      <div class="row"><label>Rot</label><input id="ins-rot" type="number" value="${el.rot}" /></div>
      <div class="row"><label>Label</label><input id="ins-label" type="text" value="${el.label ?? ''}" /></div>
    `;
    inspectorEl.appendChild(wrap);
    const xIn = wrap.querySelector('#ins-x');
    const yIn = wrap.querySelector('#ins-y');
    const rIn = wrap.querySelector('#ins-rot');
    const lIn = wrap.querySelector('#ins-label');
    const apply = () => {
      pushHistory();
      el.x = parseFloat(xIn.value) || 0;
      el.y = parseFloat(yIn.value) || 0;
      el.x = snap(el.x, GRID); el.y = snap(el.y, GRID);
      el.rot = (parseFloat(rIn.value) || 0) % 360;
      el.label = lIn.value;
      render();
    };
    xIn.addEventListener('change', apply);
    yIn.addEventListener('change', apply);
    rIn.addEventListener('change', apply);
    lIn.addEventListener('change', apply);
  } else if (state.selected.kind === 'wire') {
    const w = state.wires.find(x => x.id === state.selected.id);
    inspectorEl.innerHTML = w ? `<div>Wire: ${w.id}</div>` : '<p>No selection</p>';
  }
}

function render() {
  // clear groups
  elementsGroup.innerHTML = '';
  wiresGroup.innerHTML = '';

  // draw wires first for z-order under elements
  for (const w of state.wires) {
    const p1 = getPortGlobalPosition(w.from.el, w.from.port);
    const p2 = getPortGlobalPosition(w.to.el, w.to.port);
    if (!p1 || !p2) continue;
    const path = orthPath(p1, p2);
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', path);
    el.setAttribute('class', 'wire' + ((state.selected && state.selected.kind === 'wire' && state.selected.id === w.id) ? ' active' : ''));
    el.dataset.id = w.id;
    el.addEventListener('mousedown', (e) => { e.stopPropagation(); select({ kind: 'wire', id: w.id }); });
    wiresGroup.appendChild(el);
  }

  for (const el of state.elements) {
    const def = COMPONENT_DEFS[el.type];
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'element' + ((state.selected && state.selected.kind === 'element' && state.selected.id === el.id) ? ' selected' : ''));
    group.dataset.id = el.id;

    // body
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    def.drawBody(body, def.w, def.h);
    group.appendChild(body);

    // label
    if (el.label) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.textContent = el.label;
      label.setAttribute('x', def.w / 2);
      label.setAttribute('y', def.h + 12);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'label');
      group.appendChild(label);
    }

    // connectors
    for (const p of def.ports) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', 4);
      c.setAttribute('class', 'connector');
      c.dataset.port = p.id;
      // position before transform for hit testing visual
      c.setAttribute('cx', p.x);
      c.setAttribute('cy', p.y);
      c.addEventListener('mousedown', onConnectorMouseDown(el.id, p.id));
      c.addEventListener('mouseenter', () => c.classList.add('active'));
      c.addEventListener('mouseleave', () => c.classList.remove('active'));
      group.appendChild(c);
    }

    // drag for move
    group.addEventListener('mousedown', (e) => {
      if ((e.target).classList.contains('connector')) return; // handled by connector
      if (state.tool !== TOOL_SELECT) return;
      e.stopPropagation();
      const pt = clientToViewport(e.clientX, e.clientY);
      // push state before starting drag to allow undo of the move
      pushHistory();
      state.drag = { id: el.id, startX: pt.x, startY: pt.y, origX: el.x, origY: el.y };
      select({ kind: 'element', id: el.id });
    });

    // transform
    group.setAttribute('transform', `translate(${el.x} ${el.y}) rotate(${el.rot} ${def.w / 2} ${def.h / 2})`);

    // click to select
    group.addEventListener('click', (e) => { e.stopPropagation(); select({ kind: 'element', id: el.id }); });

    elementsGroup.appendChild(group);
  }
}

function orthPath(p1, p2) {
  // simple orthogonal path: horizontal then vertical or vice versa based on distance
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const viaH = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
  const viaV = `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
  const useH = Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y);
  return useH ? viaH : viaV;
}

function getPortGlobalPosition(elId, portId) {
  const el = state.elements.find(e => e.id === elId);
  if (!el) return null;
  const def = COMPONENT_DEFS[el.type];
  const p = def.ports.find(q => q.id === portId);
  if (!p) return null;
  return localToGlobal(el, def, p.x, p.y);
}

function localToGlobal(el, def, px, py) {
  const cx = def.w / 2, cy = def.h / 2;
  const rad = (el.rot || 0) * Math.PI / 180;
  const dx = px - cx; const dy = py - cy;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad) + cx;
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad) + cy;
  return { x: el.x + rx, y: el.y + ry };
}

// Connector events
function onConnectorMouseDown(elId, portId) {
  return (e) => {
    e.stopPropagation();
    if (state.tool !== TOOL_WIRE) { // select element
      select({ kind: 'element', id: elId });
      return;
    }
    const from = state.wiring;
    if (!from) {
      state.wiring = { el: elId, port: portId };
      renderTempWire(e);
    } else {
      // complete wire if different endpoint
      if (from.el !== elId || from.port !== portId) {
        addWire(from, { el: elId, port: portId });
        state.wiring = null;
        removeTempWire();
        render();
      }
    }
  };
}

let tempWireEl = null;
function renderTempWire(e) {
  if (!tempWireEl) {
    tempWireEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempWireEl.setAttribute('class', 'wire active');
    wiresGroup.appendChild(tempWireEl);
  }
  const move = (ev) => {
    const start = getPortGlobalPosition(state.wiring.el, state.wiring.port);
    const pt = clientToViewport(ev.clientX, ev.clientY);
    tempWireEl.setAttribute('d', orthPath(start, pt));
  };
  const up = (ev) => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
    // if mouse up on empty area, cancel wiring
    // we'll keep it incomplete until the user clicks another connector
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
}
function removeTempWire() { if (tempWireEl) { tempWireEl.remove(); tempWireEl = null; } }

// Pan & zoom
function applyViewportTransform() {
  viewport.setAttribute('transform', `translate(${state.panX} ${state.panY}) scale(${state.zoom})`);
}
applyViewportTransform();

svg.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.1;
    zoomAt(e.clientX, e.clientY, delta);
  }
}, { passive: false });

function zoomAt(clientX, clientY, delta) {
  const prev = state.zoom;
  const next = clamp(prev * (1 + delta), 0.2, 5);
  // zoom to point
  const before = clientToViewport(clientX, clientY);
  state.zoom = next;
  applyViewportTransform();
  const after = clientToViewport(clientX, clientY);
  state.panX += (after.x - before.x) * state.zoom;
  state.panY += (after.y - before.y) * state.zoom;
  applyViewportTransform();
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Panning with Space+drag or middle mouse
let isSpaceDown = false;
window.addEventListener('keydown', (e) => { if (e.code === 'Space') isSpaceDown = true; });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') isSpaceDown = false; });

svg.addEventListener('mousedown', (e) => {
  if (isSpaceDown || e.button === 1) {
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY, panX: state.panX, panY: state.panY };
    const move = (ev) => {
      state.panX = start.panX + (ev.clientX - start.x);
      state.panY = start.panY + (ev.clientY - start.y);
      applyViewportTransform();
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return;
  }
  // clear selection and wiring if clicked empty
  select(null);
  if (state.wiring) { state.wiring = null; removeTempWire(); }
});

window.addEventListener('mousemove', (e) => {
  if (state.drag) {
    const pt = clientToViewport(e.clientX, e.clientY);
    const dx = pt.x - state.drag.startX;
    const dy = pt.y - state.drag.startY;
    const el = state.elements.find(x => x.id === state.drag.id);
    if (el) {
      el.x = snap(state.drag.origX + dx, GRID);
      el.y = snap(state.drag.origY + dy, GRID);
      render();
    }
  }
});
window.addEventListener('mouseup', () => { state.drag = null; });

// Toolbar
function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[data-tool="${tool}"]`);
  if (btn) btn.classList.add('active');
}

document.getElementById('tool-select').addEventListener('click', () => setTool(TOOL_SELECT));

document.getElementById('tool-wire').addEventListener('click', () => setTool(TOOL_WIRE));

// undo/redo
const undoBtn = document.getElementById('btn-undo');
const redoBtn = document.getElementById('btn-redo');
if (undoBtn) undoBtn.addEventListener('click', () => undo());
if (redoBtn) redoBtn.addEventListener('click', () => redo());

// rotate and delete
function rotateSelected(delta) {
  if (!state.selected || state.selected.kind !== 'element') return;
  const el = state.elements.find(e => e.id === state.selected.id);
  if (el) { pushHistory(); el.rot = ((el.rot || 0) + delta + 360) % 360; render(); }
}

document.getElementById('btn-rotate-left').addEventListener('click', () => rotateSelected(-90));

document.getElementById('btn-rotate-right').addEventListener('click', () => rotateSelected(90));

document.getElementById('btn-delete').addEventListener('click', () => {
  if (!state.selected) return;
  if (state.selected.kind === 'element') removeElement(state.selected.id);
  if (state.selected.kind === 'wire') removeWire(state.selected.id);
  render(); updateInspector();
});

// zoom controls

document.getElementById('btn-zoom-in').addEventListener('click', () => zoomAt(window.innerWidth/2, window.innerHeight/2, 0.1));

document.getElementById('btn-zoom-out').addEventListener('click', () => zoomAt(window.innerWidth/2, window.innerHeight/2, -0.1));

document.getElementById('btn-zoom-reset').addEventListener('click', () => { state.zoom = 1; state.panX = 0; state.panY = 0; applyViewportTransform(); });

// Export/Import/Save/Load

function serializeDiagram() {
  return JSON.stringify({ elements: state.elements, wires: state.wires }, null, 2);
}

function deserializeDiagram(json) {
  try {
    pushHistory();
    const data = JSON.parse(json);
    state.elements = Array.isArray(data.elements) ? data.elements : [];
    state.wires = Array.isArray(data.wires) ? data.wires : [];
    state.selected = null;
    render(); updateInspector();
  } catch (e) {
    alert('Failed to load JSON');
  }
}

document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([serializeDiagram()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'diagram.json'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('file-import').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => deserializeDiagram(reader.result);
  reader.readAsText(file);
});

const STORAGE_KEY = 'qet-web-analog';

document.getElementById('btn-save').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEY, serializeDiagram());
});

document.getElementById('btn-load').addEventListener('click', () => {
  const json = localStorage.getItem(STORAGE_KEY);
  if (json) deserializeDiagram(json);
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'v' || e.key === 'V') setTool(TOOL_SELECT);
  if (e.key === 'w' || e.key === 'W') setTool(TOOL_WIRE);
  if (e.key === 'Delete') {
    const b = document.getElementById('btn-delete');
    b.click();
  }
  if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); }
  if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && (e.key === 'Z' || e.key === 'z')))) { e.preventDefault(); redo(); }
  if (e.key === 'r') rotateSelected(-90);
  if (e.key === 'R' && e.shiftKey) rotateSelected(90);
  if (e.ctrlKey && (e.key === '+' || e.key === '=')) document.getElementById('btn-zoom-in').click();
  if (e.ctrlKey && e.key === '-') document.getElementById('btn-zoom-out').click();
  if (e.ctrlKey && e.key === '0') document.getElementById('btn-zoom-reset').click();
});

// Initial render
pushHistory();
render();
updateInspector();
