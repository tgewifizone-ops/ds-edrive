const L = window.L; // Leaflet chargé depuis cdnjs (voir index.html)
import * as B from './backend.js';
import { DEFAULT_PLACES, DIEGO_CENTER } from './places.js';

// =========================================================
// Utilitaires
// =========================================================
const $ = id => document.getElementById(id);
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ESC[c]);
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const digits = s => String(s || '').replace(/[^0-9]/g, '');
const slug = s => norm(s).replace(/ /g, '-').slice(0, 60) || ('lieu-' + Date.now());
function showMsg(el, text, kind = 'ok') {
  el.className = 'admin-msg show ' + kind;
  el.textContent = text;
}
function hideMsg(el) { el.className = 'admin-msg'; el.textContent = ''; }

// Confirmation sans boîte de dialogue (certains navigateurs intégrés bloquent confirm/alert) :
// 1er clic = « Confirmer ? », 2e clic dans les 5 s = action.
function confirmClick(btn) {
  if (btn.dataset.armed === '1') { btn.dataset.armed = ''; return true; }
  const old = btn.textContent;
  btn.dataset.armed = '1'; btn.textContent = 'Confirmer ?';
  setTimeout(() => { if (btn.dataset.armed === '1') { btn.dataset.armed = ''; btn.textContent = old; } }, 5000);
  return false;
}
function notify(msg, kind = 'ok') {
  let box = document.getElementById('dsToast');
  if (!box) {
    box = document.createElement('div'); box.id = 'dsToast';
    box.setAttribute('role', 'status');
    box.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100000;max-width:90vw;padding:12px 18px;border-radius:10px;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.25);display:none';
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.style.background = kind === 'err' ? '#FDECEC' : '#ECFDF5';
  box.style.color = kind === 'err' ? '#8A1F14' : '#065F46';
  box.style.display = 'block';
  clearTimeout(box._t); box._t = setTimeout(() => { box.style.display = 'none'; }, 5000);
}
function haversineKm(a, b) {
  const R = 6371, toR = x => x * Math.PI / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtKm = km => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`;
function fmtMin(min) {
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return `${h} h ${String(m).padStart(2, '0')}`;
}
function fmtDate(ts) {
  try {
    const d = ts && ts.toDate ? ts.toDate() : new Date();
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}
const vehicleIcon = v => { v = (v || '').toLowerCase(); return v.includes('moto') ? '🏍️' : (v.includes('tri') || v.includes('bajaj')) ? '🛺' : '🚗'; };
const vehicleKey = v => { v = (v || '').toLowerCase(); return v.includes('moto') ? 'moto' : (v.includes('tri') || v.includes('bajaj')) ? 'tricycle' : 'voiture'; };

// =========================================================
// État
// =========================================================
const DEMO_DRIVERS = [
  { nom: 'Rado Andriamampianina', vehicule: 'moto', quartier: 'Grand Pavois', zone: 'Diego Suarez (urbain)', telephone: '+261320000001', whatsapp: '261320000001', tarif: '~ 3 000 Ar · à négocier', rating: 4.8, disponible: true },
  { nom: 'Tovoson Rakotondrazaka', vehicule: 'tricycle', quartier: 'Tanambao Tsena (Marché)', zone: 'Diego Suarez (urbain)', telephone: '+261320000002', whatsapp: '261320000002', tarif: '~ 4 000 Ar · à négocier', rating: 4.6, disponible: true },
  { nom: 'Njaka Ravelojaona', vehicule: 'voiture', quartier: 'SCAMA', zone: 'Diego Suarez + Hors Diego', telephone: '+261320000003', whatsapp: '261320000003', tarif: '~ 8 000 Ar · à négocier', rating: 4.9, disponible: true },
  { nom: 'Fenosoa Rasoamampionona', vehicule: 'moto', quartier: 'Morafeno', zone: 'Diego Suarez (urbain)', telephone: '+261320000004', whatsapp: '261320000004', tarif: '~ 3 500 Ar · à négocier', rating: 4.7, disponible: true },
  { nom: 'Dieudonné Randrianja', vehicule: 'tricycle', quartier: 'Lazaret Nord', zone: 'Diego Suarez (urbain)', telephone: '+261320000005', whatsapp: '261320000005', tarif: '~ 4 500 Ar · à négocier', rating: 4.5, disponible: true },
  { nom: 'Hery Ratsimbazafy', vehicule: 'voiture', quartier: 'Place Kabary (Centre-ville)', zone: 'Diego Suarez + Hors Diego', telephone: '+261320000006', whatsapp: '261320000006', tarif: '~ 9 000 Ar · à négocier', rating: 4.8, disponible: true }
].map((d, i) => ({ id: 'demo-' + (i + 1), ...d }));

const state = {
  drivers: B.configured ? [] : DEMO_DRIVERS,
  driversLoaded: !B.configured,
  places: DEFAULT_PLACES.slice(),
  placesFromDb: false,
  settings: { whatsapp: '261320000000', banner: '', mode: 'normal' },
  apps: [],
  user: null,
  isAdmin: false,
  adminEmails: [],
  filter: 'tous',
  start: null,   // {nom, lat, lng, type}
  end: null,
  route: null    // {km, min, approx}
};

// =========================================================
// Lieux
// =========================================================
function sortedPlaces() {
  return state.places.slice().sort((a, b) =>
    (a.type === b.type ? 0 : a.type === 'urbain' ? -1 : 1) || a.nom.localeCompare(b.nom, 'fr'));
}
function findPlace(text) {
  const q = norm(text);
  if (!q) return null;
  if (q === 'ma position' && state.myPos) return state.myPos;
  const list = state.places;
  return list.find(p => norm(p.nom) === q)
    || list.find(p => norm(p.nom).startsWith(q))
    || list.find(p => norm(p.nom).includes(q))
    || list.find(p => q.includes(norm(p.nom).split(' ')[0]) && norm(p.nom).split(' ')[0].length > 3)
    || null;
}
function renderPlaces() {
  const list = sortedPlaces();
  $('placesList').innerHTML = list.map(p => `<option value="${esc(p.nom)}">${p.type === 'hors' ? 'Hors Diego' : 'Diego Suarez'}</option>`).join('');
  $('zoneChips').innerHTML = list.map(p =>
    `<button type="button" class="zone-chip${p.type === 'hors' ? ' inter' : ''}" data-place="${esc(p.id)}">${esc(p.nom)}</button>`).join('');
  const urb = list.filter(p => p.type === 'urbain').length;
  $('statPlacesCount').textContent = list.length;
  if ($('dashPlacesCount')) $('dashPlacesCount').textContent = list.length;
  drawPlaceMarkers();
  renderQuickRoutes();
  if (state.isAdmin) renderAdminPlaces();
  return urb;
}
$('zoneChips').addEventListener('click', e => {
  const b = e.target.closest('[data-place]');
  if (!b) return;
  const p = state.places.find(x => x.id === b.dataset.place);
  if (!p) return;
  $('destination').value = p.nom;
  if (!$('depart').value) { $('depart').focus(); document.getElementById('recherche').scrollIntoView({ behavior: 'smooth' }); }
  else runSearch();
});

// =========================================================
// Carte publique
// =========================================================
let map, placesLayer, routeLayer, startMarker, endMarker;
const pinIcon = cls => L.divIcon({ className: '', html: `<div class="map-pin ${cls}"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] });

function initMap() {
  map = L.map('routeMap', { scrollWheelZoom: false }).setView(DIEGO_CENTER, 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(map);
  placesLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);
  map.on('click', e => {
    const pt = { nom: `Point ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`, lat: e.latlng.lat, lng: e.latlng.lng, type: 'point' };
    openPointPopup(pt, e.latlng);
  });
  map.on('focus', () => map.scrollWheelZoom.enable());
  map.on('blur', () => map.scrollWheelZoom.disable());
}
function openPointPopup(pt, latlng) {
  const box = document.createElement('div');
  box.innerHTML = `<b>${esc(pt.nom)}</b><br><button type="button" data-set="start">🟢 Départ</button><button type="button" data-set="end">🔴 Destination</button>`;
  L.DomEvent.disableClickPropagation(box);
  box.addEventListener('click', ev => {
    const b = ev.target.closest('[data-set]');
    if (!b) return;
    if (b.dataset.set === 'start') { state.start = pt; $('depart').value = pt.nom; }
    else { state.end = pt; $('destination').value = pt.nom; }
    map.closePopup();
    if (state.start && state.end) computeRoute(); else updateEndpoints();
  });
  L.popup().setLatLng(latlng).setContent(box).openOn(map);
}
function drawPlaceMarkers() {
  if (!placesLayer) return;
  placesLayer.clearLayers();
  state.places.forEach(p => {
    const m = L.marker([p.lat, p.lng], { icon: pinIcon(p.type === 'hors' ? 'hors' : 'urbain'), title: p.nom, keyboard: false });
    m.on('click', () => openPointPopup(p, m.getLatLng()));
    m.bindTooltip(esc(p.nom), { direction: 'top', offset: [0, -8] });
    placesLayer.addLayer(m);
  });
}
function updateEndpoints() {
  if (startMarker) { map.removeLayer(startMarker); startMarker = null; }
  if (endMarker) { map.removeLayer(endMarker); endMarker = null; }
  if (state.start) startMarker = L.marker([state.start.lat, state.start.lng], { icon: pinIcon(state.start.type === 'me' ? 'me' : 'start'), zIndexOffset: 1000 }).addTo(map).bindTooltip('Départ : ' + esc(state.start.nom));
  if (state.end) endMarker = L.marker([state.end.lat, state.end.lng], { icon: pinIcon('end'), zIndexOffset: 1000 }).addTo(map).bindTooltip('Destination : ' + esc(state.end.nom));
  const pts = [state.start, state.end].filter(Boolean);
  if (pts.length === 1) map.setView([pts[0].lat, pts[0].lng], 14);
}

// =========================================================
// Itinéraire (OSRM gratuit + repli à vol d'oiseau)
// =========================================================
let routeSeq = 0;
async function computeRoute() {
  const a = state.start, b = state.end;
  if (!a || !b) return;
  const seq = ++routeSeq;
  routeLayer.clearLayers();
  updateEndpoints();
  renderRoutePanel('loading');
  let coords = null, km, min, approx = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const j = await r.json();
    if (j.code !== 'Ok' || !j.routes || !j.routes.length) throw new Error('no route');
    const rt = j.routes[0];
    coords = rt.geometry.coordinates.map(c => [c[1], c[0]]);
    km = rt.distance / 1000; min = rt.duration / 60;
  } catch {
    approx = true;
    km = haversineKm(a, b) * 1.35;
    min = km / 30 * 60;
    coords = [[a.lat, a.lng], [b.lat, b.lng]];
  }
  if (seq !== routeSeq) return;
  state.route = { km, min, approx };
  const line = L.polyline(coords, { color: '#1B4C78', weight: 5, opacity: .85, dashArray: approx ? '8 8' : null });
  routeLayer.addLayer(line);
  map.fitBounds(line.getBounds(), { padding: [30, 30] });
  const hors = a.type === 'hors' || b.type === 'hors';
  $('typeTrajet').value = hors || km > 12 ? 'inter' : 'urbain';
  renderRoutePanel();
  renderDrivers();
}
function gmapsUrl(a, b) {
  return `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=driving`;
}
function routeText() {
  const { start: a, end: b, route: r } = state;
  if (!a || !b) return '';
  return `Trajet : ${a.nom} → ${b.nom}` + (r ? ` (≈ ${fmtKm(r.km)}, ${fmtMin(r.min)})` : '') + `\nItinéraire : ${gmapsUrl(a, b)}`;
}
function renderRoutePanel(mode) {
  const p = $('routePanel');
  const { start: a, end: b, route: r } = state;
  if (mode === 'loading') {
    p.innerHTML = `<h3>Calcul de l'itinéraire…</h3><p class="route-legs">${esc(a.nom)} → ${esc(b.nom)}</p>`;
    return;
  }
  if (!a || !b || !r) {
    p.innerHTML = `<h3>Aucun itinéraire pour l'instant</h3><p class="route-empty">Sélectionnez un départ et une destination dans la recherche ci-dessus, ou cliquez sur un point de la carte.</p><div class="quick-routes" id="quickRoutes"></div>`;
    renderQuickRoutes();
    return;
  }
  const waMsg = encodeURIComponent('DS_e-Drive — ' + routeText());
  p.innerHTML = `
    <h3>Votre itinéraire</h3>
    <p class="route-legs"><b>${esc(a.nom)}</b> → <b>${esc(b.nom)}</b></p>
    <div class="route-kpis">
      <div class="route-kpi"><b>${fmtKm(r.km)}</b><span>Distance ${r.approx ? '(estimée)' : 'par la route'}</span></div>
      <div class="route-kpi"><b>${fmtMin(r.min)}</b><span>Durée ${r.approx ? 'estimée' : 'en voiture'}</span></div>
    </div>
    <div class="route-actions">
      <a class="ra-google" href="${esc(gmapsUrl(a, b))}" target="_blank" rel="noopener">🧭 Ouvrir dans Google Maps</a>
      <a class="ra-waze" href="https://waze.com/ul?ll=${b.lat},${b.lng}&navigate=yes" target="_blank" rel="noopener">🚙 Naviguer avec Waze</a>
      <a class="ra-wa" href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener">📤 Partager le trajet (WhatsApp)</a>
      <button type="button" class="admin-secondary" id="btnSeeDrivers">👇 Voir les chauffeurs proches du départ</button>
    </div>
    <p class="route-hint">${r.approx ? 'Service de calcul indisponible : tracé à vol d’oiseau, distance majorée de 35 %. ' : ''}Durée indicative hors embouteillages et état des routes. Le tarif reste à négocier avec le chauffeur.</p>`;
  $('btnSeeDrivers').addEventListener('click', () => $('chauffeurs').scrollIntoView({ behavior: 'smooth' }));
}
const QUICK = [['place-kabary', 'ramena'], ['grand-pavois', 'aeroport'], ['scama', 'joffreville'], ['tanambao-tsena', 'ambilobe']];
function renderQuickRoutes() {
  const box = $('quickRoutes');
  if (!box) return;
  box.innerHTML = QUICK.map(([s, e]) => {
    const a = state.places.find(p => p.id === s), b = state.places.find(p => p.id === e);
    return a && b ? `<button type="button" data-q="${esc(s)}|${esc(e)}">${esc(a.nom.split(' (')[0])} → ${esc(b.nom.split(' (')[0])}</button>` : '';
  }).join('');
}
document.addEventListener('click', e => {
  const q = e.target.closest('[data-q]');
  if (!q) return;
  const [s, t] = q.dataset.q.split('|');
  state.start = state.places.find(p => p.id === s); state.end = state.places.find(p => p.id === t);
  $('depart').value = state.start.nom; $('destination').value = state.end.nom;
  computeRoute();
});

// Recherche
function runSearch() {
  const dep = $('depart').value, dst = $('destination').value;
  const a = findPlace(dep), b = findPlace(dst);
  state.start = a; state.end = b;
  if (a) $('depart').value = a.nom;
  if (b) $('destination').value = b.nom;
  const active = document.querySelector('.vtab.active');
  state.filter = active ? active.dataset.vehicle : 'tous';
  document.querySelectorAll('#filterTabs button').forEach(x => x.classList.toggle('active', x.dataset.filter === state.filter));
  if (a && b) {
    computeRoute();
    $('itineraire').scrollIntoView({ behavior: 'smooth' });
  } else {
    routeLayer && routeLayer.clearLayers();
    state.route = null;
    updateEndpoints();
    renderRoutePanel();
    if ((dep && !a) || (dst && !b)) {
      $('routePanel').insertAdjacentHTML('afterbegin', `<p class="admin-msg show warn">Lieu non reconnu : ${esc(!a && dep ? dep : dst)}. Choisissez un nom dans la liste proposée ou cliquez sur la carte.</p>`);
    }
    renderDrivers();
    $(a || dep ? 'itineraire' : 'chauffeurs').scrollIntoView({ behavior: 'smooth' });
  }
}
$('searchBtn').addEventListener('click', runSearch);
['depart', 'destination'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } }));
$('btnSwap').addEventListener('click', () => {
  const d = $('depart').value; $('depart').value = $('destination').value; $('destination').value = d;
  [state.start, state.end] = [state.end, state.start];
  if (state.start && state.end) computeRoute();
});
document.querySelectorAll('.vtab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.vtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}));
$('btnGeo').addEventListener('click', () => {
  if (!navigator.geolocation) { notify('La géolocalisation n’est pas disponible sur cet appareil.', 'err'); return; }
  $('btnGeo').textContent = '⏳';
  navigator.geolocation.getCurrentPosition(pos => {
    $('btnGeo').textContent = '📍';
    state.myPos = { nom: 'Ma position', lat: pos.coords.latitude, lng: pos.coords.longitude, type: 'me' };
    state.start = state.myPos;
    $('depart').value = 'Ma position';
    const dest = findPlace($('destination').value);
    if (dest) state.end = dest;
    if (state.end) computeRoute();
    else { updateEndpoints(); renderDrivers(); }
  }, () => {
    $('btnGeo').textContent = '📍';
    notify('Position introuvable. Autorisez la localisation dans votre navigateur ou choisissez un quartier.', 'err');
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
});

// =========================================================
// Chauffeurs (public)
// =========================================================
function driverPlace(d) { return findPlace(d.quartier); }
function renderDrivers() {
  const grid = $('driverGrid');
  if (!state.driversLoaded) { $('resultCount').textContent = 'Chargement…'; return; }
  const origin = state.start;
  let list = state.drivers.filter(d => state.filter === 'tous' || vehicleKey(d.vehicule) === state.filter);
  const withDist = list.map(d => {
    const p = origin && driverPlace(d);
    return { d, km: p ? haversineKm(origin, p) : null };
  });
  if (origin) withDist.sort((x, y) => (y.d.disponible !== false) - (x.d.disponible !== false) || (x.km ?? 999) - (y.km ?? 999));
  else withDist.sort((x, y) => (y.d.disponible !== false) - (x.d.disponible !== false));

  if (!withDist.length) {
    grid.innerHTML = `<div class="empty-state"><p style="font-size:24px;margin-bottom:8px;">🔍</p><h3 style="margin-bottom:6px;">Aucun chauffeur trouvé</h3><p style="color:var(--gray-600);font-size:14px;">Essayez un autre type de véhicule.</p></div>`;
  } else {
    const trip = routeText();
    grid.innerHTML = withDist.map(({ d, km }) => {
      const wa = digits(d.whatsapp || d.telephone);
      const txt = encodeURIComponent(`Bonjour ${d.nom}, je vous contacte via DS_e-Drive pour une course à Diego Suarez.` + (trip ? '\n' + trip : ''));
      const dispo = d.disponible !== false;
      const vk = vehicleKey(d.vehicule);
      return `<div class="driver-card" data-vehicle="${vk}">
        <div class="driver-top">
          <div class="driver-avatar">${vehicleIcon(d.vehicule)}</div>
          <div>
            <div class="driver-name">${esc(d.nom)}</div>
            <div class="driver-zone">Quartier : <b>${esc(d.quartier || 'Diego Suarez')}</b></div>
            ${km != null ? `<div class="driver-distance">📍 ${km < 0.3 ? 'dans votre quartier' : 'à ≈ ' + fmtKm(km) + ' de votre départ'}</div>` : ''}
          </div>
        </div>
        <div class="driver-meta">
          <span class="badge vehicle">${esc(vk.charAt(0).toUpperCase() + vk.slice(1))}</span>
          <span class="badge rating">★ ${esc(d.rating ?? '—')}</span>
          <span class="badge ${dispo ? 'online' : 'offline'}">${dispo ? '● Disponible' : '○ Indisponible'}</span>
        </div>
        <div class="price-tag"><span>Tarif indicatif</span><b>${esc(d.tarif || '~ à négocier')}</b></div>
        <div class="driver-actions">
          <a href="tel:${esc(String(d.telephone || '').replace(/[^0-9+]/g, ''))}" class="btn-call">📞 Appeler</a>
          <a href="https://wa.me/${wa}?text=${txt}" class="btn-wa" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>`;
    }).join('');
  }
  $('resultCount').textContent = `${withDist.length} chauffeur${withDist.length > 1 ? 's' : ''}` + (origin ? ` · triés par distance depuis ${origin.nom}` : '');
  $('statDriversCount').textContent = state.drivers.length;
}
document.querySelectorAll('#filterTabs button').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('#filterTabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.filter = btn.dataset.filter;
  renderDrivers();
}));

// =========================================================
// Paramètres publics
// =========================================================
function applySettings() {
  const s = state.settings;
  const wa = digits(s.whatsapp) || '261320000000';
  const link = $('adminWaLink');
  link.href = `https://wa.me/${wa}`;
  link.textContent = '+' + wa.replace(/^(\d{3})(\d{2})(\d{2})(\d{3})(\d{2})$/, '$1 $2 $3 $4 $5');
  const ban = $('siteBanner');
  const txt = s.mode === 'maintenance' ? (s.banner || 'Maintenance en cours : les inscriptions chauffeurs sont temporairement fermées.') : s.banner;
  ban.textContent = txt || '';
  ban.classList.toggle('show', !!txt);
  const btn = $('btnSubmitForm');
  btn.disabled = s.mode === 'maintenance';
  btn.innerHTML = s.mode === 'maintenance' ? '<span>Inscriptions temporairement fermées</span>' : '<span>Envoyer ma candidature à l’administration</span>';
}

// =========================================================
// Formulaire « Devenir chauffeur »
// =========================================================
const ADMIN_EMAIL = 'Tgewifizone@gmail.com';
$('signupForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target, fd = new FormData(form);
  $('formConfirm').classList.remove('show'); $('formError').classList.remove('show');
  if (fd.get('_gotcha')) { $('formConfirm').classList.add('show'); form.reset(); return; } // robot
  if (state.settings.mode === 'maintenance') return;
  const g = k => String(fd.get(k) || '').trim();
  const a = {
    nom: g('nom').slice(0, 80), tel: g('telephone').slice(0, 30), email: g('email').slice(0, 120),
    vehicule: g('vehicule').slice(0, 20), modele: g('modele').slice(0, 60), immat: g('immatriculation').slice(0, 30),
    quartier: g('quartier').slice(0, 80), zone: g('zone').slice(0, 60),
    creneaux: fd.getAll('creneaux').join(', ').slice(0, 200), prestations: fd.getAll('prestations').join(', ').slice(0, 200)
  };
  if (a.nom.length < 2 || digits(a.tel).length < 7 || !a.quartier) {
    notify('Merci d\u2019indiquer votre nom, un numéro de téléphone valide et votre quartier.', 'err');
    return;
  }
  const btn = $('btnSubmitForm');
  btn.disabled = true; btn.innerHTML = '<span>⏳ Envoi en cours…</span>';
  const waMsg = encodeURIComponent(`*Nouvelle candidature Chauffeur DS_e-Drive*\nNom : ${a.nom}\nTéléphone : ${a.tel}\nVéhicule : ${a.vehicule} ${a.modele}\nQuartier : ${a.quartier}\nCréneaux : ${a.creneaux}\nPrestations : ${a.prestations}`);
  $('scWaFallback').href = `https://wa.me/${digits(state.settings.whatsapp) || '261320000000'}?text=${waMsg}`;
  let saved = false;
  try { if (B.configured) { await B.submitApplication(a); saved = true; } } catch (err) { console.warn('Firestore', err); }
  let mailed = false;
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `Nouvelle candidature chauffeur : ${a.nom} (${a.vehicule})`, _template: 'table', _captcha: 'false',
        Nom_Chauffeur: a.nom, Telephone_WhatsApp: a.tel, Email_Contact: a.email, Type_Vehicule: a.vehicule,
        Marque_Modele: a.modele, Immatriculation: a.immat, Quartier_Base: a.quartier, Zones_Desservies: a.zone,
        Creneaux_Disponibles: a.creneaux, Prestations: a.prestations, Plateforme: 'DS_e-Drive Diego Suarez'
      })
    });
    mailed = r.ok;
  } catch { /* hors ligne */ }
  if (saved || mailed) { $('formConfirm').classList.add('show'); form.reset(); }
  if (!saved || !mailed) $('formError').classList.add('show');
  applySettings();
});

// =========================================================
// ESPACE ADMINISTRATION
// =========================================================
const views = ['adminNotConfigured', 'adminAuthView', 'adminPendingView', 'adminDashboardView'];
function showView(id) { views.forEach(v => { $(v).style.display = v === id ? 'block' : 'none'; }); }
function refreshAdminView() {
  if (!B.configured) return showView('adminNotConfigured');
  if (!state.user) { $('adminUserLabel').textContent = 'Accès réservé'; return showView('adminAuthView'); }
  $('adminUserLabel').textContent = 'Connecté : ' + state.user.email;
  if (state.isAdmin) return showView('adminDashboardView');
  showView('adminPendingView');
}
function openAdmin() { $('adminModalBackdrop').classList.add('open'); document.body.style.overflow = 'hidden'; refreshAdminView(); }
function closeAdmin() { $('adminModalBackdrop').classList.remove('open'); document.body.style.overflow = ''; }
$('openAdminBtn').addEventListener('click', openAdmin);
$('footOpenAdmin').addEventListener('click', e => { e.preventDefault(); openAdmin(); });
$('closeAdminBtn').addEventListener('click', closeAdmin);
$('adminModalBackdrop').addEventListener('click', e => { if (e.target === e.currentTarget) closeAdmin(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('adminModalBackdrop').classList.contains('open')) closeAdmin(); });
if (new URLSearchParams(location.search).get('admin') === '1') openAdmin();

const AUTH_ERR = {
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
  'auth/user-not-found': 'E-mail ou mot de passe incorrect.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/too-many-requests': 'Trop de tentatives : compte temporairement bloqué. Réessayez plus tard ou réinitialisez le mot de passe.',
  'auth/network-request-failed': 'Connexion Internet indisponible.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/weak-password': 'Mot de passe trop faible.',
  'auth/requires-recent-login': 'Veuillez vous reconnecter puis réessayer.'
};
const authErr = e => AUTH_ERR[e && e.code] || ('Erreur : ' + ((e && e.code) || (e && e.message) || 'inconnue'));

$('adminLoginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('adminAuthMsg'); hideMsg(msg);
  const btn = $('btnAdminLogin'); btn.disabled = true; btn.textContent = 'Connexion…';
  try { await B.login($('adminEmail').value, $('adminPassword').value); $('adminPassword').value = ''; }
  catch (err) { showMsg(msg, authErr(err), 'err'); }
  finally { btn.disabled = false; btn.textContent = 'Se connecter'; }
});
$('btnForgot').addEventListener('click', async () => {
  const msg = $('adminAuthMsg');
  const email = $('adminEmail').value.trim();
  if (!email) return showMsg(msg, 'Saisissez d’abord votre e-mail ci-dessus.', 'warn');
  try { await B.resetPassword(email); } catch { /* ne pas révéler si le compte existe */ }
  showMsg(msg, 'Si ce compte existe, un e-mail de réinitialisation vient d’être envoyé (pensez aux spams).', 'ok');
});
document.addEventListener('click', e => { if (e.target.closest('[data-action="logout"]')) B.logout(); });
$('btnSendVerify').addEventListener('click', async () => {
  try { await B.verifyEmail(); showMsg($('adminPendingMsg'), 'E-mail envoyé. Cliquez sur le lien reçu puis sur « J’ai vérifié ».', 'ok'); }
  catch (err) { showMsg($('adminPendingMsg'), authErr(err), 'err'); }
});
$('btnRecheck').addEventListener('click', async () => {
  try { await B.reloadUser(); await evaluateUser(B.currentUser()); } catch (err) { showMsg($('adminPendingMsg'), authErr(err), 'err'); }
});

let unsubApps = null, idleTimer = null;
function resetIdle() {
  clearTimeout(idleTimer);
  if (state.user) idleTimer = setTimeout(() => { B.logout(); notify('Session administrateur fermée après 30 minutes d’inactivité.', 'err'); }, 30 * 60 * 1000);
}
['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev => document.addEventListener(ev, () => state.user && resetIdle(), { passive: true }));

async function evaluateUser(user) {
  state.user = user; state.isAdmin = false;
  if (unsubApps) { unsubApps(); unsubApps = null; }
  if (user) {
    const res = await B.checkAdmin();
    if (res.ok) {
      state.isAdmin = true; state.adminEmails = res.emails;
      $('adminsList').value = res.emails.join('\n');
      unsubApps = B.watchApplications(list => { state.apps = list; renderAdminApps(); },
        err => console.warn('applications', err));
    } else if (!user.emailVerified) {
      $('adminPendingTitle').textContent = 'Vérifiez votre adresse e-mail';
      $('adminPendingText').textContent = `Les administrateurs ajoutés doivent avoir un e-mail vérifié. Envoyez le lien de vérification à ${user.email} (pensez au dossier Spam), cliquez dessus, puis réessayez.`;
      $('btnSendVerify').style.display = '';
    } else {
      $('adminPendingTitle').textContent = 'Accès refusé';
      $('adminPendingText').textContent = `Le compte ${user.email} n'est pas autorisé comme administrateur.`;
      $('btnSendVerify').style.display = 'none';
    }
    resetIdle();
  } else clearTimeout(idleTimer);
  renderAdminAll();
  refreshAdminView();
}
B.onAuth(u => { evaluateUser(u); });

document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  $(btn.dataset.tab).classList.add('active');
  if (btn.dataset.tab === 'tab-lieux') initPlacesMap();
}));
const gotoTab = id => document.querySelector(`.admin-tab-btn[data-tab="${id}"]`).click();

function renderAdminAll() {
  if (!state.isAdmin) return;
  renderAdminDrivers(); renderAdminApps(); renderAdminPlaces();
  $('setWa').value = state.settings.whatsapp || '';
  $('setBanner').value = state.settings.banner || '';
  $('setMode').value = state.settings.mode || 'normal';
}
function renderAdminDrivers() {
  if (!state.isAdmin) return;
  $('dashActiveCount').textContent = state.drivers.length;
  $('adminDriversTableBody').innerHTML = state.drivers.length ? state.drivers.map(d => `<tr>
      <td><b>${vehicleIcon(d.vehicule)} ${esc(vehicleKey(d.vehicule))}</b></td>
      <td><b>${esc(d.nom)}</b></td><td>${esc(d.quartier)}</td><td>${esc(d.telephone)}</td><td>${esc(d.tarif)}</td>
      <td>${d.disponible !== false ? '🟢 Disponible' : '⚪ Indisponible'}</td>
      <td><div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="admin-btn-action btn-edit" data-drv-edit="${esc(d.id)}">Modifier</button>
        <button class="admin-btn-action btn-toggle" data-drv-toggle="${esc(d.id)}">${d.disponible !== false ? 'Mettre indispo.' : 'Rendre dispo.'}</button>
        <button class="admin-btn-action btn-delete" data-drv-del="${esc(d.id)}">Supprimer</button>
      </div></td></tr>`).join('')
    : '<tr><td colspan="7" style="text-align:center;color:var(--gray-400);padding:24px;">Aucun chauffeur publié. Ajoutez-en un ou approuvez une candidature.</td></tr>';
}
$('adminDriversTableBody').addEventListener('click', async e => {
  const t = e.target;
  try {
    if (t.dataset.drvDel) {
      if (confirmClick(t)) { await B.removeDriver(t.dataset.drvDel); notify('Chauffeur retiré du site.'); }
    } else if (t.dataset.drvToggle) {
      const d = state.drivers.find(x => x.id === t.dataset.drvToggle);
      await B.saveDriver(d.id, { disponible: d.disponible === false });
    } else if (t.dataset.drvEdit) {
      fillDriverForm(state.drivers.find(x => x.id === t.dataset.drvEdit));
      gotoTab('tab-ajouter');
    }
  } catch (err) { notify('Action refusée : ' + (err.code || err.message), 'err'); }
});
function fillDriverForm(d) {
  $('drvId').value = d ? d.id : '';
  $('drvNom').value = d ? d.nom || '' : '';
  $('drvTel').value = d ? d.telephone || '' : '';
  $('drvWa').value = d && d.whatsapp && digits(d.whatsapp) !== digits(d.telephone) ? d.whatsapp : '';
  $('drvVehicule').value = d ? vehicleKey(d.vehicule) : 'moto';
  $('drvQuartier').value = d ? d.quartier || '' : '';
  $('drvZone').value = d && /hors|inter/i.test(d.zone || '') ? 'Diego Suarez + Hors Diego' : 'Diego Suarez (urbain)';
  $('drvTarif').value = d ? d.tarif || '' : '';
  $('drvNote').value = d ? (d.rating ?? 4.8) : 4.8;
  $('drvDispo').checked = d ? d.disponible !== false : true;
  $('driverFormTitle').textContent = d ? 'Modifier le chauffeur' : 'Ajouter un chauffeur';
  $('drvSubmit').textContent = d ? 'Enregistrer les modifications' : 'Publier ce chauffeur';
  hideMsg($('drvMsg'));
}
$('tabBtnDriverForm').addEventListener('click', () => { if (!$('drvId').value) fillDriverForm(null); });
$('drvCancel').addEventListener('click', () => { fillDriverForm(null); gotoTab('tab-chauffeurs'); });
$('adminDriverForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('drvId').value;
  const tel = $('drvTel').value.trim();
  const rating = Math.min(5, Math.max(0, parseFloat($('drvNote').value) || 0));
  const data = {
    nom: $('drvNom').value.trim(), telephone: tel, whatsapp: digits($('drvWa').value || tel),
    vehicule: $('drvVehicule').value, quartier: $('drvQuartier').value.trim(), zone: $('drvZone').value,
    tarif: $('drvTarif').value.trim() || '~ à négocier', rating: Math.round(rating * 10) / 10, disponible: $('drvDispo').checked
  };
  try {
    await B.saveDriver(id || null, data);
    fillDriverForm(null);
    gotoTab('tab-chauffeurs');
  } catch (err) { showMsg($('drvMsg'), 'Enregistrement refusé : ' + (err.code || err.message), 'err'); }
});

function renderAdminApps() {
  if (!state.isAdmin) return;
  const n = state.apps.length;
  $('dashPendingCount').textContent = n; $('tabPendingBadge').textContent = n;
  const hb = $('headerPendingBadge'); hb.textContent = n; hb.style.display = n ? 'inline-block' : 'none';
  $('adminPendingTableBody').innerHTML = n ? state.apps.map(a => `<tr>
      <td><small>${esc(fmtDate(a.createdAt))}</small></td>
      <td><b>${esc(a.nom)}</b><br><small>${esc(a.modele)} ${esc(a.immat)}</small>${a.email ? `<br><small>${esc(a.email)}</small>` : ''}</td>
      <td>${vehicleIcon(a.vehicule)} ${esc(a.vehicule)}</td>
      <td>${esc(a.quartier)}<br><small>${esc(a.zone)}</small><br><small>${esc(a.creneaux)}</small></td>
      <td><a href="tel:${esc(String(a.tel).replace(/[^0-9+]/g, ''))}">${esc(a.tel)}</a></td>
      <td><div style="display:flex;gap:6px;">
        <button class="admin-btn-action btn-approve" data-app-ok="${esc(a.id)}">✓ Approuver</button>
        <button class="admin-btn-action btn-delete" data-app-no="${esc(a.id)}">✕ Refuser</button>
      </div></td></tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:24px;">Aucune candidature en attente.</td></tr>';
}
$('adminPendingTableBody').addEventListener('click', async e => {
  const t = e.target;
  try {
    if (t.dataset.appOk) {
      const a = state.apps.find(x => x.id === t.dataset.appOk);
      const vk = vehicleKey(a.vehicule);
      await B.approveApplication(a, {
        nom: a.nom, telephone: a.tel, whatsapp: digits(a.tel), vehicule: vk, quartier: a.quartier,
        zone: /inter|hors/i.test(a.zone || '') ? 'Diego Suarez + Hors Diego' : 'Diego Suarez (urbain)',
        tarif: (vk === 'moto' ? '~ 3 500 Ar' : vk === 'tricycle' ? '~ 4 000 Ar' : '~ 8 000 Ar') + ' · à négocier',
        rating: 5, disponible: true
      });
    } else if (t.dataset.appNo) {
      if (confirmClick(t)) { await B.removeApplication(t.dataset.appNo); notify('Candidature refusée et supprimée.'); }
    }
  } catch (err) { notify('Action refusée : ' + (err.code || err.message), 'err'); }
});

// CSV (protégé contre l'injection de formules Excel)
$('btnExportCsv').addEventListener('click', () => {
  const cell = v => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const rows = [['Nom', 'Vehicule', 'Quartier', 'Zone', 'Telephone', 'WhatsApp', 'Tarif', 'Note', 'Disponible']]
    .concat(state.drivers.map(d => [d.nom, d.vehicule, d.quartier, d.zone, d.telephone, d.whatsapp, d.tarif, d.rating, d.disponible !== false ? 'oui' : 'non']));
  const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `chauffeurs_ds_edrive_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
});

// ---------- Lieux (admin) ----------
let placesMap, placesMapLayer, draftMarker;
function initPlacesMap() {
  if (!placesMap) {
    placesMap = L.map('placesMap').setView(DIEGO_CENTER, 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(placesMap);
    placesMapLayer = L.layerGroup().addTo(placesMap);
    placesMap.on('click', e => setDraft(e.latlng.lat, e.latlng.lng));
    drawAdminPlaceMarkers();
  }
  setTimeout(() => placesMap.invalidateSize(), 60);
}
function setDraft(lat, lng) {
  $('plLat').value = lat.toFixed(5); $('plLng').value = lng.toFixed(5);
  if (draftMarker) draftMarker.setLatLng([lat, lng]);
  else draftMarker = L.marker([lat, lng], { icon: pinIcon('end'), draggable: true }).addTo(placesMap)
    .on('dragend', ev => { const p = ev.target.getLatLng(); $('plLat').value = p.lat.toFixed(5); $('plLng').value = p.lng.toFixed(5); });
}
function drawAdminPlaceMarkers() {
  if (!placesMapLayer) return;
  placesMapLayer.clearLayers();
  state.places.forEach(p => L.marker([p.lat, p.lng], { icon: pinIcon(p.type === 'hors' ? 'hors' : 'urbain') })
    .bindTooltip(esc(p.nom)).on('click', () => editPlace(p.id)).addTo(placesMapLayer));
}
function renderAdminPlaces() {
  if (!state.isAdmin) return;
  $('dashPlacesCount').textContent = state.places.length;
  $('btnImportPlaces').style.display = state.placesFromDb ? 'none' : '';
  const note = state.placesFromDb ? '' : '<tr><td colspan="4" style="background:var(--yellow-100);color:#6B4E00;font-size:13px;">Liste par défaut (non enregistrée en base). Cliquez sur « Importer la liste par défaut » pour pouvoir la modifier.</td></tr>';
  $('adminPlacesTableBody').innerHTML = note + sortedPlaces().map(p => `<tr>
    <td><b>${esc(p.nom)}</b></td><td>${p.type === 'hors' ? 'Hors Diego' : 'Diego (urbain)'}</td>
    <td><small>${Number(p.lat).toFixed(5)}, ${Number(p.lng).toFixed(5)}</small></td>
    <td><div style="display:flex;gap:6px;">${state.placesFromDb ? `<button class="admin-btn-action btn-edit" data-pl-edit="${esc(p.id)}">Modifier</button><button class="admin-btn-action btn-delete" data-pl-del="${esc(p.id)}">Supprimer</button>` : ''}</div></td></tr>`).join('');
  drawAdminPlaceMarkers();
}
function editPlace(id) {
  const p = state.places.find(x => x.id === id);
  if (!p) return;
  $('plId').value = p.id; $('plNom').value = p.nom; $('plType').value = p.type === 'hors' ? 'hors' : 'urbain';
  if (placesMap) { setDraft(p.lat, p.lng); placesMap.setView([p.lat, p.lng], 15); } else { $('plLat').value = p.lat; $('plLng').value = p.lng; }
  $('plSubmit').textContent = 'Enregistrer les modifications';
}
$('adminPlacesTableBody').addEventListener('click', async e => {
  const t = e.target;
  if (t.dataset.plEdit) { editPlace(t.dataset.plEdit); $('placesMap').scrollIntoView({ behavior: 'smooth' }); }
  if (t.dataset.plDel && confirmClick(t)) {
    try { await B.removePlace(t.dataset.plDel); } catch (err) { notify('Refusé : ' + (err.code || err.message), 'err'); }
  }
});
$('plCancel').addEventListener('click', () => {
  $('placeForm').reset(); $('plId').value = ''; $('plSubmit').textContent = 'Enregistrer le lieu';
  if (draftMarker) { placesMap.removeLayer(draftMarker); draftMarker = null; }
});
$('placeForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('plMsg');
  const lat = parseFloat($('plLat').value), lng = parseFloat($('plLng').value);
  if (!(lat > -16 && lat < -11 && lng > 47 && lng < 51)) return showMsg(msg, 'Coordonnées hors de la région DIANA : cliquez sur la carte pour placer le point.', 'err');
  const nom = $('plNom').value.trim();
  try {
    if (!state.placesFromDb) await B.importPlaces(DEFAULT_PLACES);
    await B.savePlace($('plId').value || slug(nom), { nom, type: $('plType').value, lat: +lat.toFixed(5), lng: +lng.toFixed(5) });
    showMsg(msg, `« ${nom} » enregistré et visible sur le site.`, 'ok');
    $('plCancel').click();
  } catch (err) { showMsg(msg, 'Refusé : ' + (err.code || err.message), 'err'); }
});
$('btnImportPlaces').addEventListener('click', async () => {
  try { await B.importPlaces(DEFAULT_PLACES); showMsg($('plMsg'), 'Liste importée : vous pouvez maintenant la modifier.', 'ok'); }
  catch (err) { showMsg($('plMsg'), 'Refusé : ' + (err.code || err.message), 'err'); }
});

// ---------- Paramètres ----------
$('settingsForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await B.saveSettings({ whatsapp: digits($('setWa').value).slice(0, 15), banner: $('setBanner').value.trim().slice(0, 200), mode: $('setMode').value });
    showMsg($('setMsg'), 'Paramètres enregistrés.', 'ok');
  } catch (err) { showMsg($('setMsg'), 'Refusé : ' + (err.code || err.message), 'err'); }
});
$('btnSeedDrivers').addEventListener('click', async () => {
  if (!confirmClick($('btnSeedDrivers'))) return;
  try { await B.importDrivers(DEMO_DRIVERS); gotoTab('tab-chauffeurs'); } catch (err) { notify('Refusé : ' + (err.code || err.message), 'err'); }
});

// ---------- Sécurité ----------
$('pwdForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('pwdMsg');
  const cur = $('pwdCurrent').value, n1 = $('pwdNew').value, n2 = $('pwdConfirm').value;
  if (n1 !== n2) return showMsg(msg, 'Les deux nouveaux mots de passe ne correspondent pas.', 'err');
  if (n1.length < 10 || !/[A-Za-z]/.test(n1) || !/[0-9]/.test(n1)) return showMsg(msg, 'Au moins 10 caractères, avec des lettres et des chiffres.', 'err');
  if (n1 === cur) return showMsg(msg, 'Le nouveau mot de passe doit être différent de l’actuel.', 'err');
  try { await B.changePassword(cur, n1); e.target.reset(); showMsg(msg, 'Mot de passe mis à jour. Utilisez-le dès la prochaine connexion.', 'ok'); }
  catch (err) { showMsg(msg, authErr(err), 'err'); }
});
$('btnSaveAdmins').addEventListener('click', async () => {
  const emails = [...new Set($('adminsList').value.split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(x => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)))].slice(0, 10);
  try { await B.saveAdmins(emails); $('adminsList').value = emails.join('\n'); showMsg($('adminsMsg'), 'Liste enregistrée.', 'ok'); }
  catch (err) { showMsg($('adminsMsg'), 'Refusé : ' + (err.code || err.message), 'err'); }
});

// =========================================================
// Démarrage
// =========================================================
initMap();
renderPlaces();
renderDrivers();
applySettings();
renderRoutePanel();

if (B.configured) {
  B.watchDrivers(list => {
    state.drivers = list; state.driversLoaded = true;
    renderDrivers(); renderAdminDrivers();
  }, err => {
    console.warn('drivers', err);
    state.driversLoaded = true; renderDrivers();
  });
  B.watchPlaces(list => {
    state.placesFromDb = list.length > 0;
    state.places = list.length ? list.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number') : DEFAULT_PLACES.slice();
    renderPlaces();
  }, err => console.warn('places', err));
  B.watchSettings(s => {
    state.settings = { ...state.settings, ...s };
    applySettings();
    if (state.isAdmin) { $('setWa').value = state.settings.whatsapp || ''; $('setBanner').value = state.settings.banner || ''; $('setMode').value = state.settings.mode || 'normal'; }
  }, err => console.warn('settings', err));
} else {
  console.info('DS_e-Drive : firebase-config.js non rempli — mode démonstration (lecture seule).');
}
