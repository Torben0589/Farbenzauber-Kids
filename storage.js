const KEY='farbenzauber-v1';
export const saveProject=(id,payload)=>{try{const all=JSON.parse(localStorage.getItem(KEY)||'{}');all[id]={...payload,savedAt:Date.now()};localStorage.setItem(KEY,JSON.stringify(all));}catch(e){console.warn('Autosave fehlgeschlagen',e)}};
export const loadProject=id=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')[id]||null}catch{return null}};
export const favorites=()=>JSON.parse(localStorage.getItem('farbenzauber-favs')||'[]');
export const toggleFavorite=id=>{const f=new Set(favorites());f.has(id)?f.delete(id):f.add(id);localStorage.setItem('farbenzauber-favs',JSON.stringify([...f]));return [...f]};
