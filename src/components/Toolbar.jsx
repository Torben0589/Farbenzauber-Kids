import { PaintBucket, Paintbrush, Eraser, Eye, Hand, Undo2, Redo2 } from 'lucide-react';
import { useApp } from '../store';

const tools = [
  ['fill', 'Füllen', PaintBucket],
  ['brush', 'Pinsel', Paintbrush],
  ['eraser', 'Radierer', Eraser],
  ['picker', 'Pipette', Eye],
  ['pan', 'Bewegen', Hand],
];

export default function Toolbar() {
  const s = useApp();

  return (
    <aside className="toolbar" aria-label="Werkzeuge">
      {tools.map(([id, label, Icon]) => (
        <button
          key={id}
          className={`tool-btn ${s.tool === id ? 'active' : ''}`}
          onClick={() => s.setTool(id)}
          aria-pressed={s.tool === id}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}

      <button className="tool-btn" onClick={s.undo} disabled={!s.history.length}>
        <Undo2 />
        <span>Zurück</span>
      </button>

      <button className="tool-btn" onClick={s.redo} disabled={!s.future.length}>
        <Redo2 />
        <span>Vor</span>
      </button>
    </aside>
  );
}
