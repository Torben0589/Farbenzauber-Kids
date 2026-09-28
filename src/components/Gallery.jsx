import { useEffect, useState } from 'react';
import { Heart, Upload, X } from 'lucide-react';
import { favorites, toggleFavorite } from '../services/storage';
import { validateFile } from '../services/fileValidation';
import { parseSvgText } from '../utils/svg';

export default function Gallery({ open, onClose, onPick }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Alle');
  const [favs, setFavs] = useState(favorites());

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/image_list.json`)
      .then((r) => r.json())
      .then(setItems);
  }, []);

  if (!open) return null;

  const visible = items.filter(
    (x) =>
      (cat === 'Alle' || x.category === cat) &&
      `${x.title} ${x.category}`.toLowerCase().includes(q.toLowerCase())
  );

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateFile(file);

      if (file.type === 'image/svg+xml') {
        const markup = parseSvgText(await file.text());
        onPick({ id: `upload-${Date.now()}`, title: file.name, type: 'svg', markup });
      } else {
        onPick({
          id: `upload-${Date.now()}`,
          title: file.name,
          type: 'raster',
          src: URL.createObjectURL(file),
        });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <section className="modal">
        <div className="modal-head">
          <div>
            <h2>Such dir ein Bild aus! 🎨</h2>
            <p>Tippe auf dein Lieblingsmotiv oder lade ein eigenes hoch.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Schließen">
            <X />
          </button>
        </div>

        <div className="search-row">
          <input
            placeholder="Suchen …"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            {['Alle', 'Tiere', 'Fahrzeuge', 'Natur', 'Fantasie'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>

        <div className="gallery">
          {visible.map((item) => (
            <div className="card" key={item.id}>
              <button
                style={{ border: 0, background: 'none', width: '100%', padding: 0 }}
                onClick={() => onPick(item)}
              >
                <img src={`${import.meta.env.BASE_URL}${item.thumbnail}`} alt="" />
                <div>{item.title}</div>
                <small>{item.category}</small>
              </button>

              <button
                className="icon-btn"
                aria-label="Favorit"
                onClick={() => setFavs(toggleFavorite(item.id))}
              >
                <Heart fill={favs.includes(item.id) ? '#ec4899' : 'none'} />
              </button>
            </div>
          ))}
        </div>

        {/*
          Wichtig: Dieser Block liegt bewusst AUSSERHALB von .gallery,
          damit CSS-Grid ihn niemals als weitere Kachel behandelt.
          .modal ist ein Flex-Container (flex-direction: column),
          daher nimmt dieser Wrapper automatisch die volle Breite ein
          und wird sauber UNTER der Galerie angezeigt.
        */}
        <div className="upload-wrapper">
          <label className="upload">
            <Upload />
            <b>Eigenes Bild hochladen</b>
            <small>SVG, PNG, JPG oder WebP, maximal 10 MB</small>
            <input
              hidden
              type="file"
              accept=".svg,.png,.jpg,.jpeg,.webp"
              onChange={upload}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
