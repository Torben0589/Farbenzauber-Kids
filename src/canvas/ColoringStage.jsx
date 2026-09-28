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

  const document = new DOMParser().parseFromString(markup, 'image/svg+xml');
  return document.documentElement.innerHTML;
}

function getSvgViewBox(markup) {
  if (!markup || !markup.includes('<svg')) return '0 0 800 800';

  const document = new DOMParser().parseFromString(markup, 'image/svg+xml');
  return document.documentElement.getAttribute('viewBox') || '0 0 800 800';
}

function createLineArtMarkup(markup) {
  const inner = getSvgInner(markup);
  if (!inner) return '';

  const document = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${inner}</svg>`,
    'image/svg+xml'
  );

  document.querySelectorAll('.coloring-region').forEach((element) => {
    element.classList.remove('coloring-region');
    element.removeAttribute('data-region-id');
    element.removeAttribute('id');
    element.setAttribute('fill', 'none');
    element.setAttribute('pointer-events', 'none');
  });

  document.querySelectorAll('*').forEach((element) => {
    element.setAttribute('pointer-events', 'none');
  });

  return document.documentElement.innerHTML;
}

export default function ColoringStage({ onNeedGallery }) {
  const state = useApp();
  const canvasRef = useRef(null);
  const gesture = useRef({ pointers: new Map(), drawLast: null });
  const drawing = useRef(false);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });

  const markup = state.template?.type === 'svg' ? state.template.markup || '' : '';
  const svgInner = useMemo(() => getSvgInner(markup), [markup]);
  const lineArtInner = useMemo(() => createLineArtMarkup(markup), [markup]);
  const viewBox = useMemo(() => getSvgViewBox(markup), [markup]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = VIEW;
    canvas.height = VIEW;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.clearRect(0, 0, VIEW, VIEW);

    const saved = state.template ? loadProject(state.template.id) : null;
    if (saved?.fills) {
      useApp.setState({ fills: saved.fills, paintSnapshot: saved.paint || null });
    }

    if (saved?.paint) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, VIEW, VIEW);
      image.src = saved.paint;
    }
  }, [state.template?.id]);

  useEffect(() => {
    const regionLayer = document.querySelector('.regions');
    if (!regionLayer) return;

    Object.entries(state.fills).forEach(([id, color]) => {
      const selector = `[data-region-id="${CSS.escape(id)}"]`;
      const element = regionLayer.querySelector(selector);
      if (element) element.setAttribute('fill', color);
    });
  }, [state.fills, state.template?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.clearRect(0, 0, VIEW, VIEW);

    if (state.paintSnapshot) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, VIEW, VIEW);
      image.src = state.paintSnapshot;
    }
  }, [state.paintSnapshot]);

  useEffect(() => {
    if (!state.template) return undefined;

    const timer = window.setTimeout(() => {
      saveProject(state.template.id, {
        fills: state.fills,
        paint: canvasRef.current?.toDataURL() || null,
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [state.fills, state.paintSnapshot, state.template]);

  function canvasPosition(event) {
    const canvas = canvasRef.current;
    const rectangle = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rectangle.left) * VIEW) / rectangle.width,
      y: ((event.clientY - rectangle.top) * VIEW) / rectangle.height,
    };
  }

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gesture.current.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (state.tool === 'pan') {
      gesture.current.last = { x: event.clientX, y: event.clientY };
      return;
    }

    if (!state.template) return;

    if (state.tool === 'fill' && state.template.type === 'svg') {
      const region = event.target.closest?.('.coloring-region');
      if (!region || !event.currentTarget.contains(region)) return;

      const regionId = region.getAttribute('data-region-id') || region.id;
      if (!regionId) return;

      state.commit({ ...state.fills, [regionId]: state.color });
      state.setStatus('Plopp! Fläche gefärbt ✨');
      return;
    }

    if (state.tool === 'picker') {
      const point = canvasPosition(event);
      const pixel = canvasRef.current
        .getContext('2d', { willReadFrequently: true })
        .getImageData(point.x, point.y, 1, 1).data;

      const color = `#${[pixel[0], pixel[1], pixel[2]]
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('')}`;
      state.setColor(color);
      return;
    }

    drawing.current = true;
    gesture.current.drawLast = null;
    drawStroke(event, true);
  }

  function handlePointerMove(event) {
    if (gesture.current.pointers.has(event.pointerId)) {
      gesture.current.pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (gesture.current.pointers.size === 2) {
      const [first, second] = [...gesture.current.pointers.values()];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      const midpoint = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      };

      if (gesture.current.distance) {
        const ratio = distance / gesture.current.distance;
        setView((current) => ({
          z: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.z * ratio)),
          x: current.x + midpoint.x - (gesture.current.midpoint?.x || midpoint.x),
          y: current.y + midpoint.y - (gesture.current.midpoint?.y || midpoint.y),
        }));
      }

      gesture.current.distance = distance;
      gesture.current.midpoint = midpoint;
      return;
    }

    if (state.tool === 'pan' && gesture.current.last) {
      const deltaX = event.clientX - gesture.current.last.x;
      const deltaY = event.clientY - gesture.current.last.y;
      setView((current) => ({
        ...current,
        x: current.x + deltaX,
        y: current.y + deltaY,
      }));
      gesture.current.last = { x: event.clientX, y: event.clientY };
      return;
    }

    if (drawing.current) drawStroke(event, false);
  }

  function handlePointerUp(event) {
    gesture.current.pointers.delete(event.pointerId);
    gesture.current.distance = null;
    gesture.current.midpoint = null;
    gesture.current.last = null;
    gesture.current.drawLast = null;

    if (drawing.current) {
      drawing.current = false;
      state.commit(state.fills, canvasRef.current.toDataURL());
    }
  }

  function drawStroke(event, start) {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const point = canvasPosition(event);

    if (state.tool === 'fill' && state.template.type === 'raster') {
      const imageData = context.getImageData(0, 0, VIEW, VIEW);
      floodFill(imageData, point.x, point.y, hexToRgba(state.color), 30);
      context.putImageData(imageData, 0, 0);
      state.commit(state.fills, canvas.toDataURL());
      drawing.current = false;
      return;
    }

    if (!['brush', 'eraser'].includes(state.tool)) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = state.brushSize;
    context.globalCompositeOperation =
      state.tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = state.color;
    context.beginPath();

    const previous = gesture.current.drawLast || point;
    context.moveTo(start ? point.x : previous.x, start ? point.y : previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    gesture.current.drawLast = point;
  }

  function handleWheel(event) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    setView((current) => ({
      ...current,
      z: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.z * factor)),
    }));
  }

  if (!state.template) {
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <div
        className="stage"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}
      >
        <div className="paper">
          {state.template.type === 'svg' && (
            <svg
              className="regions"
              viewBox={viewBox}
              dangerouslySetInnerHTML={{ __html: svgInner }}
            />
          )}

          <canvas ref={canvasRef} className="paint-canvas" />

          {state.template.type === 'svg' && (
            <svg
              className="lineart"
              viewBox={viewBox}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: lineArtInner }}
            />
          )}

          {state.template.type === 'raster' && (
            <img
              className="raster-line"
              src={state.template.src || `${import.meta.env.BASE_URL}${state.template.file}`}
              alt="Ausmalbild"
              draggable="false"
            />
          )}
        </div>
      </div>

      <div className="status">{state.status}</div>

      <div className="zoom-controls">
        <button
          className="icon-btn"
          aria-label="Verkleinern"
          onClick={() =>
            setView((current) => ({ ...current, z: Math.max(MIN_ZOOM, current.z - 0.2) }))
          }
        >
          <Minus />
        </button>
        <button
          className="icon-btn"
          aria-label="Ansicht zurücksetzen"
          onClick={() => setView({ x: 0, y: 0, z: 1 })}
        >
          <RotateCcw />
        </button>
        <button
          className="icon-btn"
          aria-label="Vergrößern"
          onClick={() =>
            setView((current) => ({ ...current, z: Math.min(MAX_ZOOM, current.z + 0.2) }))
          }
        >
          <Plus />
        </button>
      </div>
    </main>
  );
}
