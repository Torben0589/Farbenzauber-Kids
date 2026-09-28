import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useApp } from '../store';
import { floodFill, hexToRgba } from '../utils/floodFill';
import { loadProject, saveProject } from '../services/storage';

const VIEW = 900;
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 4;

function getSvgInner(markup) {
  if (!markup) return '';
  if (!markup.includes('<svg')) return markup;
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  return doc.documentElement.innerHTML;
}

function getSvgViewBox(markup) {
  if (!markup || !markup.includes('<svg')) return '0 0 800 800';
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  return doc.documentElement.getAttribute('viewBox') || '0 0 800 800';
}

// Erzeugt eine reine Konturen-Ebene: entfernt alle Regions-Klassen/IDs,
// setzt fill="none" und pointer-events="none", damit hier NIE geklickt
// werden kann und keine doppelten .coloring-region Elemente entstehen.
function createLineArtMarkup(markup) {
  const inner = getSvgInner(markup);
  if (!inner) return '';

  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${inner}</svg>`,
    'image/svg+xml'
  );

  doc.querySelectorAll('.coloring-region').forEach((el) => {
    el.classList.remove('coloring-region');
    el.removeAttribute('data-region-id');
    el.removeAttribute('id');
    el.setAttribute('fill', 'none');
  });

  doc.querySelectorAll('*').forEach((el) => el.setAttribute('pointer-events', 'none'));

  return doc.documentElement.innerHTML;
}

export default function ColoringStage({ onNeedGallery }) {
  const s = useApp();
  const canvasRef = useRef(null);
  const gesture = useRef({ pointers: new Map(), drawLast: null });
  const drawing = useRef(false);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });

  const markup = s.template?.type === 'svg' ? s.template.markup || '' : '';
  const svgInner = useMemo(() => getSvgInner(markup), [markup]);
  const lineArtInner = useMemo(() => createLineArtMarkup(markup), [markup]);
  const viewBox = useMemo(() => getSvgViewBox(markup), [markup]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = VIEW;
    canvas.height = VIEW;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, VIEW, VIEW);

    const saved = s.template ? loadProject(s.template.id) : null;
    if (saved?.fills) {
      useApp.setState({ fills: saved.fills, paintSnapshot: saved.paint || null });
    }
    if (saved?.paint) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, VIEW, VIEW);
      img.src = saved.paint;
    }
  }, [s.template?.id]);

  useEffect(() => {
    const root = document.querySelector('.regions');
    if (!root) return;
    Object.entries(s.fills).forEach(([id, color]) => {
      const el = root.querySelector(`[data-region-id="${CSS.escape(id)}"]`);
      if (el) el.setAttribute('fill', color);
    });
  }, [s.fills, s.template?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, VIEW, VIEW);
    if (s.paintSnapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, VIEW, VIEW);
      img.src = s.paintSnapshot;
    }
  }, [s.paintSnapshot]);

  useEffect(() => {
    if (!s.template) return undefined;
    const t = setTimeout(() => {
      saveProject(s.template.id, {
        fills: s.fills,
        paint: canvasRef.current?.toDataURL() || null,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [s.fills, s.paintSnapshot, s.template]);

  function pos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * VIEW) / r.width,
      y: ((e.clientY - r.top) * VIEW) / r.height,
    };
  }

  function down(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    gesture.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (s.tool === 'pan') {
      gesture.current.last = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!s.template) return;

    if (s.tool === 'fill' && s.template.type === 'svg') {
      const region = e.target.closest?.('.coloring-region');
      if (!region || !e.currentTarget.contains(region)) return;
      const id = region.getAttribute('data-region-id') || region.id;
      if (!id) return;
      s.commit({ ...s.fills, [id]: s.color });
      s.setStatus('Plopp! Fläche gefärbt ✨');
      return;
    }

    if (s.tool === 'picker') {
      const p = pos(e);
      const d = canvasRef.current
        .getContext('2d', { willReadFrequently: true })
        .getImageData(p.x, p.y, 1, 1).data;
      s.setColor('#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join(''));
      return;
    }

    drawing.current = true;
    gesture.current.drawLast = null;
    stroke(e, true);
  }

  function move(e) {
    const pointers = gesture.current.pointers;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

      if (gesture.current.dist) {
        const ratio = dist / gesture.current.dist;
        setView((v) => ({
          z: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.z * ratio)),
          x: v.x + (mid.x - (gesture.current.mid?.x ?? mid.x)),
          y: v.y + (mid.y - (gesture.current.mid?.y ?? mid.y)),
        }));
      }
      gesture.current.dist = dist;
      gesture.current.mid = mid;
      return;
    }

    if (s.tool === 'pan' && gesture.current.last) {
      const dx = e.clientX - gesture.current.last.x;
      const dy = e.clientY - gesture.current.last.y;
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      gesture.current.last = { x: e.clientX, y: e.clientY };
      return;
    }

    if (drawing.current) stroke(e, false);
  }

  function up(e) {
    gesture.current.pointers.delete(e.pointerId);
    gesture.current.dist = null;
    gesture.current.mid = null;
    gesture.current.last = null;
    gesture.current.drawLast = null;

    if (drawing.current) {
      drawing.current = false;
      s.commit(s.fills, canvasRef.current.toDataURL());
    }
  }

  function stroke(e, start) {
    const c = canvasRef.current;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const p = pos(e);

    if (s.tool === 'fill' && s.template.type === 'raster') {
      const data = ctx.getImageData(0, 0, VIEW, VIEW);
      floodFill(data, p.x, p.y, hexToRgba(s.color), 30);
      ctx.putImageData(data, 0, 0);
      s.commit(s.fills, c.toDataURL());
      drawing.current = false;
      return;
    }

    if (!['brush', 'eraser'].includes(s.tool)) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = s.brushSize;
    ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.color;
    ctx.beginPath();

    const last = gesture.current.drawLast || p;
    ctx.moveTo(start ? p.x : last.x, start ? p.y : last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    gesture.current.drawLast = p;
  }

  function wheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setView((v) => ({ ...v, z: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.z * factor)) }));
  }

  if (!s.template) {
    return (
      <main className="workspace">
        <div className="empty">
          <div>
            <h1>Bereit für Farbe? 🌈</h1>
            <p>Wähle zuerst ein Ausmalbild aus.</p>
            <button className="primary" onClick={onNeedGallery}>
              Galerie öffnen
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="workspace"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onWheel={wheel}
    >
      <div className="stage" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
        <div className="paper">
          {s.template.type === 'svg' && (
            <svg className="regions" viewBox={viewBox} dangerouslySetInnerHTML={{ __html: svgInner }} />
          )}

          <canvas ref={canvasRef} className="paint-canvas" />

          {s.template.type === 'svg' && (
            <svg
              className="lineart"
              viewBox={viewBox}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: lineArtInner }}
            />
          )}

          {s.template.type === 'raster' && (
            <img
              className="raster-line"
              src={s.template.src || `${import.meta.env.BASE_URL}${s.template.file}`}
              alt="Ausmalbild"
              draggable="false"
            />
          )}
        </div>
      </div>

      <div className="status">{s.status}</div>

      <div className="zoom-controls">
        <button
          className="icon-btn"
          aria-label="Verkleinern"
          onClick={() => setView((v) => ({ ...v, z: Math.max(MIN_ZOOM, v.z - 0.2) }))}
        >
          <Minus />
        </button>
        <button className="icon-btn" aria-label="Ansicht zurücksetzen" onClick={() => setView({ x: 0, y: 0, z: 1 })}>
          <RotateCcw />
        </button>
        <button
          className="icon-btn"
          aria-label="Vergrößern"
          onClick={() => setView((v) => ({ ...v, z: Math.min(MAX_ZOOM, v.z + 0.2) }))}
        >
          <Plus />
        </button>
      </div>
    </main>
  );
}
