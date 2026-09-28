import { useApp } from '../store';

const colors = [
  '#ff5d8f',
  '#ff3b30',
  '#ff9500',
  '#ffd60a',
  '#34c759',
  '#00c7be',
  '#0a84ff',
  '#5e5ce6',
  '#af52de',
  '#8e5a3c',
  '#ffffff',
  '#111827',
];

export default function Palette() {
  const s = useApp();

  return (
    <aside className="sidepanel">
      <div className="panel-title">Meine Farben</div>

      <div className="palette">
        {colors.map((c) => (
          <button
            key={c}
            className={`swatch ${s.color === c ? 'selected' : ''}`}
            style={{ background: c }}
            onClick={() => s.setColor(c)}
            aria-label={`Farbe ${c}`}
          />
        ))}
      </div>

      <input
        aria-label="Eigene Farbe"
        className="color-input"
        type="color"
        value={s.color}
        onChange={(e) => s.setColor(e.target.value)}
      />

      <div className="panel-title">Pinselgröße: {s.brushSize}</div>
      <input
        className="range"
        type="range"
        min="4"
        max="80"
        value={s.brushSize}
        onChange={(e) => s.setBrushSize(+e.target.value)}
      />

      <p style={{ fontSize: 12, lineHeight: 1.4 }}>
        Tipp: Mit zwei Fingern zoomen. Im Werkzeug „Bewegen“ kannst du das Blatt verschieben.
      </p>
    </aside>
  );
}
