'use strict';
let role = 'survivor',
  catalog = dataByRole.survivor.catalog,
  generalNames = dataByRole.survivor.generalNames;
const allFor = (mode) =>
  [...dataByRole[mode].catalog, ['Generales', dataByRole[mode].generalNames]].flatMap(
    ([owner, names]) => names.map((name) => ({ owner, name, id: owner + '|' + name })),
  );
let all = allFor(role),
  knownOwners = new Set(catalog.map(([o]) => o)),
  knownIds = new Set(all.map((p) => p.id));
const key = 'jean-dbd-pool-v4';
let owned = new Set(),
  enabled = new Set(),
  build = [null, null, null, null],
  locks = [false, false, false, false],
  history = [],
  busy = false,
  angle = 0;
const $ = (id) => document.getElementById(id),
  esc = (s) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    ),
  display = (p) => spanish[p.name];
const available = (p) => p.owner === 'Generales' || owned.has(p.owner);
const legacyText = (p) =>
  ['Down to the Last', 'Bound by Obsession', 'Will to Live'].includes(p.name)
    ? 'Icono anterior de Laurie'
    : killerLegacy[p.name] || '';
function blankProfile(mode) {
  return {
    app: 'jean-dbd-roulette',
    version: 1,
    owned: [],
    enabled: dataByRole[mode].generalNames.map((n) => 'Generales|' + n),
  };
}
let profiles = { survivor: blankProfile('survivor'), killer: blankProfile('killer') };
function validSettings(v, mode = role) {
  if (
    !v ||
    v.app !== 'jean-dbd-roulette' ||
    v.version !== 1 ||
    !Array.isArray(v.owned) ||
    !Array.isArray(v.enabled)
  )
    throw Error('El archivo no es una configuración compatible.');
  const entries = allFor(mode),
    owners = new Set(dataByRole[mode].catalog.map(([o]) => o)),
    ids = new Set(entries.map((p) => p.id));
  if (
    v.owned.some((o) => typeof o !== 'string' || !owners.has(o)) ||
    v.enabled.some((id) => typeof id !== 'string' || !ids.has(id))
  )
    throw Error('El archivo incluye personajes o perks fuera de este catalogo o modo.');
  const o = new Set(v.owned),
    e = new Set(
      v.enabled.filter((id) => {
        const p = entries.find((p) => p.id === id);
        return p.owner === 'Generales' || o.has(p.owner);
      }),
    );
  return { owned: o, enabled: e };
}
function normalizedProfile(v, mode) {
  const p = validSettings(v, mode);
  return {
    app: 'jean-dbd-roulette',
    version: 1,
    owned: [...p.owned],
    enabled: [...p.enabled],
  };
}
function settings() {
  return {
    app: 'jean-dbd-roulette',
    version: 1,
    owned: [...owned],
    enabled: [...enabled],
  };
}
function allSettings() {
  return { app: 'jean-dbd-roulette', version: 2, lastRole: role, roles: profiles };
}
function applyProfile(mode) {
  role = mode;
  catalog = dataByRole[mode].catalog;
  generalNames = dataByRole[mode].generalNames;
  all = allFor(mode);
  knownOwners = new Set(catalog.map(([o]) => o));
  knownIds = new Set(all.map((p) => p.id));
  const v = validSettings(profiles[mode], mode);
  owned = v.owned;
  enabled = v.enabled;
}
function validateBackup(v) {
  if (v && v.app === 'jean-dbd-roulette' && v.version === 1)
    return {
      lastRole: 'survivor',
      roles: { survivor: normalizedProfile(v, 'survivor'), killer: profiles.killer },
    };
  if (
    !v ||
    v.app !== 'jean-dbd-roulette' ||
    v.version !== 2 ||
    !v.roles ||
    !['survivor', 'killer'].includes(v.lastRole)
  )
    throw Error('El archivo no es una configuración compatible.');
  return {
    lastRole: v.lastRole,
    roles: {
      survivor: normalizedProfile(v.roles.survivor, 'survivor'),
      killer: normalizedProfile(v.roles.killer, 'killer'),
    },
  };
}
function loadSettings() {
  try {
    const current = localStorage.getItem(key);
    if (current) {
      const v = validateBackup(JSON.parse(current));
      profiles = v.roles;
      applyProfile(v.lastRole);
      return;
    }
    const v3 = localStorage.getItem('jean-dbd-pool-v3');
    if (v3) {
      profiles.survivor = normalizedProfile(JSON.parse(v3), 'survivor');
      applyProfile('survivor');
      return;
    }
    const v2 = localStorage.getItem('jean-dbd-pool-v2'),
      old = v2 || localStorage.getItem('jean-dbd-pool-v1');
    if (old) {
      const ids = JSON.parse(old);
      if (Array.isArray(ids)) {
        const entries = allFor('survivor'),
          owners = new Set(dataByRole.survivor.catalog.map(([o]) => o));
        let o = new Set(
          ids
            .map((id) => entries.find((p) => p.id === id)?.owner)
            .filter((n) => owners.has(n)),
        );
        if (!v2) {
          o.delete('Steve Harrington');
          o.delete('Yui Kimura');
          o.delete('Yun-Jin Lee');
          ['Quentin Smith', 'Zarina Kassir', 'Vee Boonyasak'].forEach((n) => o.add(n));
        }
        let e = new Set(
          ids.filter((id) =>
            entries.some(
              (p) => p.id === id && (p.owner === 'Generales' || o.has(p.owner)),
            ),
          ),
        );
        if (!v2)
          entries
            .filter((p) =>
              ['Quentin Smith', 'Zarina Kassir', 'Vee Boonyasak'].includes(p.owner),
            )
            .forEach((p) => e.add(p.id));
        profiles.survivor = {
          app: 'jean-dbd-roulette',
          version: 1,
          owned: [...o],
          enabled: [...e],
        };
      }
    }
  } catch {
    profiles = { survivor: blankProfile('survivor'), killer: blankProfile('killer') };
  }
  applyProfile('survivor');
}
function save() {
  profiles[role] = settings();
  try {
    localStorage.setItem(key, JSON.stringify(allSettings()));
  } catch {
    $('status').textContent =
      'Tu navegador no permite guardar. Usa “Exportar configuración” para conservarla.';
  }
  updateCount();
}
function updateCount() {
  $('poolCount').textContent =
    enabled.size + ' perks activas · ' + owned.size + ' personajes';
  $('configCount').textContent = '(' + enabled.size + ')';
  $('catalogCount').textContent = catalog.length - owned.size + ' personajes por añadir';
  $('welcome').hidden = owned.size > 0;
  $('roleName').textContent =
    'DEAD BY DAYLIGHT / ' + (role === 'killer' ? 'KILLER' : 'SUPERVIVIENTE');
  $('roleBadge').textContent = role === 'killer' ? 'KILLER' : 'SUPERVIVIENTE';
  $('role-survivor').setAttribute('aria-pressed', String(role === 'survivor'));
  $('role-killer').setAttribute('aria-pressed', String(role === 'killer'));
  $('catalogInfo').textContent =
    'Catálogo de ' +
    catalog.length +
    ' ' +
    (role === 'killer' ? 'killers' : 'supervivientes') +
    ' hasta octubre de 2026. ' +
    (role === 'killer'
      ? 'Las perks de Myers y Pinhead, retirados de la venta, están en Generales.'
      : 'Las perks de Laurie, retirada de la venta, están en Generales.') +
    ' No detecta tus compras: añade tú los personajes. Los futuros capítulos requieren actualizar el catálogo.';
}
function clearResult() {
  build.fill(null);
  locks.fill(false);
  history = [];
  $('history').innerHTML = '';
}
function switchRole(mode) {
  if (busy || mode === role || !dataByRole[mode]) return;
  save();
  applyProfile(mode);
  clearResult();
  $('search').value = '';
  $('catalogSearch').value = '';
  save();
  renderGroups();
  renderCatalog();
  renderCards();
  $('status').textContent =
    role === 'killer'
      ? 'Modo Killer. Elige tus asesinos en el catálogo.'
      : 'Modo Superviviente. Elige tus personajes en el catálogo.';
}
function cleanBuild() {
  build.forEach((p, i) => {
    if (p && !enabled.has(p.id)) {
      build[i] = null;
      locks[i] = false;
    }
  });
}
function renderGroups() {
  const q = $('search').value.toLocaleLowerCase();
  $('groups').innerHTML =
    [...catalog.filter(([o]) => owned.has(o)), ['Generales', generalNames]]
      .map(([o, n]) => {
        const list = all.filter(
          (p) =>
            p.owner === o &&
            (o.toLocaleLowerCase().includes(q) ||
              p.name.toLocaleLowerCase().includes(q) ||
              display(p).toLocaleLowerCase().includes(q)),
        );
        if (!list.length) return '';
        return `<div class="group"><div class="group-heading"><label class="group-title"><input type="checkbox" data-owner="${esc(o)}" ${n.every((x) => enabled.has(o + '|' + x)) ? 'checked' : ''}> ${esc(o)}</label>${o !== 'Generales' ? `<button class="remove" data-remove="${esc(o)}" aria-label="Quitar ${esc(o)} de mis personajes">Quitar</button>` : ''}</div>${list.map((p) => `<label class="perk"><input type="checkbox" data-perk="${esc(p.id)}" ${enabled.has(p.id) ? 'checked' : ''}><img class="mini-icon" src="${icons[p.name]}" alt="" loading="lazy" width="36" height="36"><span>${esc(display(p))}${legacyText(p) ? `<small class="legacy-note">${esc(legacyText(p))}</small>` : ''}</span></label>`).join('')}</div>`;
      })
      .join('') || '<p>No se encontraron perks en tu selección.</p>';
  updateCount();
}
function renderCatalog() {
  const q = $('catalogSearch').value.toLocaleLowerCase();
  const results = catalog.filter(
    ([o, n]) =>
      !owned.has(o) &&
      (o.toLocaleLowerCase().includes(q) ||
        n.some(
          (name) =>
            name.toLocaleLowerCase().includes(q) ||
            spanish[name].toLocaleLowerCase().includes(q),
        )),
  );
  $('catalog').innerHTML =
    results
      .map(
        ([o, n]) =>
          `<article class="buy-card"><div><h3>${esc(o)}</h3><div class="preview-perks">${n.map((name) => `<div title="${esc(name)}"><img src="${icons[name]}" alt="" width="46" height="46" loading="lazy"><span>${esc(spanish[name])}</span></div>`).join('')}</div></div><button data-add="${esc(o)}" ${busy ? 'disabled' : ''}>＋ Añadir personaje</button></article>`,
      )
      .join('') || '<p>No hay personajes pendientes que coincidan con la búsqueda.</p>';
  updateCount();
}
function addCharacter(owner) {
  if (busy || !knownOwners.has(owner) || owned.has(owner)) return;
  owned.add(owner);
  all.filter((p) => p.owner === owner).forEach((p) => enabled.add(p.id));
  save();
  renderGroups();
  renderCatalog();
  $('status').textContent = owner + ': sus tres perks ya están en tu ruleta.';
}
function removeCharacter(owner) {
  if (busy || !owned.has(owner)) return;
  owned.delete(owner);
  all.filter((p) => p.owner === owner).forEach((p) => enabled.delete(p.id));
  cleanBuild();
  save();
  renderGroups();
  renderCatalog();
  renderCards();
  $('status').textContent =
    owner + ' quitado. Puedes volver a añadirlo desde el catálogo.';
}
function renderCards() {
  $('cards').innerHTML = build
    .map(
      (p, i) =>
        `<article class="card ${locks[i] ? 'locked' : ''}"><span class="slot">PERK 0${i + 1}</span><button class="lock" data-lock="${i}" ${!p || busy ? 'disabled' : ''} aria-pressed="${locks[i]}" aria-label="${locks[i] ? 'Desbloquear' : 'Bloquear'} perk ${i + 1}">${locks[i] ? '🔒' : '🔓'}</button>${p ? `<img class="perk-icon" src="${icons[p.name]}" alt="Icono de ${esc(display(p))}" width="92" height="92"><span class="english-name">${esc(p.name)}</span>` : '<div class="empty-icon">?</div>'}<h3>${p ? esc(display(p)) : 'Por descubrir'}</h3>${p && legacyText(p) ? `<small class="legacy-note">${esc(legacyText(p))}</small>` : ''}<p>${p ? esc(p.owner) : 'Gira para revelar tu perk'}</p></article>`,
    )
    .join('');
}
const ctx = $('wheel').getContext('2d');
function draw() {
  ctx.clearRect(0, 0, 620, 620);
  ctx.save();
  ctx.translate(310, 310);
  ctx.rotate(angle);
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 275, (i * Math.PI) / 8, ((i + 1) * Math.PI) / 8);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#352847' : '#221c31';
    ctx.fill();
    ctx.strokeStyle = '#57446e';
    ctx.stroke();
    ctx.save();
    ctx.rotate(((i + 0.5) * Math.PI) / 8);
    ctx.translate(220, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = i % 2 ? '#e2bbd2' : '#b4a0d2';
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦', 0, 9);
    ctx.restore();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(310, 310, 283, 0, Math.PI * 2);
  ctx.strokeStyle = '#9274b4';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(310, 310, 130, 0, Math.PI * 2);
  ctx.fillStyle = '#11121b';
  ctx.fill();
  ctx.strokeStyle = '#695380';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8dafb';
  ctx.font = 'bold 57px sans-serif';
  ctx.fillText('DBD', 310, 318);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#ac97c7';
  ctx.fillText('RULETA DE VENTAJAS', 310, 346);
}
function rand(n) {
  if (!Number.isInteger(n) || n < 1) throw Error('Invalid random range');
  const a = new Uint32Array(1),
    limit = Math.floor(4294967296 / n) * n;
  do {
    crypto.getRandomValues(a);
  } while (a[0] >= limit);
  return a[0] % n;
}
function sample(pool, k) {
  if (k > pool.length) throw Error('Not enough perks');
  const a = [...pool];
  for (let i = 0; i < k; i++) {
    const j = i + rand(a.length - i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}
$('spin').onclick = () => {
  if (busy) return;
  const kept = build.filter((p, i) => p && locks[i]),
    pool = all.filter(
      (p) => available(p) && enabled.has(p.id) && !kept.some((k) => k.id === p.id),
    ),
    slots = locks.map((l, i) => (l ? -1 : i)).filter((i) => i >= 0);
  if (!slots.length) {
    $('status').textContent = 'Desbloquea al menos una perk para girar.';
    return;
  }
  if (pool.length < slots.length) {
    $('status').textContent = 'Activa más perks para completar cuatro sin repetir.';
    return;
  }
  const chosen = sample(pool, slots.length);
  busy = true;
  $('spin').disabled = true;
  $('spin').textContent = 'LA ENTIDAD ESTÁ ELIGIENDO…';
  document.body.classList.add('rolling');
  renderCatalog();
  let start = performance.now(),
    prev = 0,
    base = angle;
  renderCards();
  function tick(t) {
    let f = Math.min((t - start) / 2200, 1);
    angle = base + (1 - Math.pow(1 - f, 3)) * Math.PI * 9;
    draw();
    if (t - prev > 90 && f < 0.88) {
      slots.forEach((i) => (build[i] = pool[rand(pool.length)]));
      renderCards();
      prev = t;
    }
    if (f < 1) requestAnimationFrame(tick);
    else {
      slots.forEach((i, j) => (build[i] = chosen[j]));
      busy = false;
      document.body.classList.remove('rolling');
      $('spin').disabled = false;
      $('spin').textContent = 'GIRAR OTRA VEZ';
      renderCards();
      renderCatalog();
      $('status').textContent =
        role === 'killer' ? 'Build lista. ¡A cazar!' : 'Build lista. ¡A sobrevivir!';
      history.unshift(build.map((p) => display(p)).join(' · '));
      history = history.slice(0, 3);
      $('history').innerHTML =
        '<strong>Últimas builds</strong><br>' + history.map(esc).join('<br>');
    }
  }
  requestAnimationFrame(tick);
};
$('cards').onclick = (e) => {
  const b = e.target.closest('[data-lock]');
  if (b && !busy) {
    const i = Number(b.dataset.lock);
    locks[i] = !locks[i];
    renderCards();
  }
};
$('catalog').onclick = (e) => {
  const b = e.target.closest('[data-add]');
  if (b) addCharacter(b.dataset.add);
};
$('groups').onclick = (e) => {
  const b = e.target.closest('[data-remove]');
  if (b) removeCharacter(b.dataset.remove);
};
$('groups').onchange = (e) => {
  if (busy) {
    renderGroups();
    return;
  }
  const p = e.target.dataset.perk,
    o = e.target.dataset.owner;
  if (!p && !o) return;
  const ids = p ? [p] : all.filter((x) => x.owner === o && available(x)).map((x) => x.id);
  ids.forEach((id) => (e.target.checked ? enabled.add(id) : enabled.delete(id)));
  cleanBuild();
  save();
  renderGroups();
  renderCards();
};
$('role-survivor').onclick = () => switchRole('survivor');
$('role-killer').onclick = () => switchRole('killer');
$('choose').onclick = () => {
  $('catalogPanel').open = true;
  $('catalogPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('catalogSearch').focus();
};
$('search').oninput = renderGroups;
$('catalogSearch').oninput = renderCatalog;
$('reset').onclick = () => {
  if (busy) return;
  owned = new Set();
  enabled = new Set(all.filter(available).map((p) => p.id));
  build.fill(null);
  locks.fill(false);
  history = [];
  $('history').innerHTML = '';
  $('search').value = '';
  save();
  renderGroups();
  renderCatalog();
  renderCards();
  $('status').textContent =
    'Selección restablecida. Elige tus personajes en el catálogo.';
};
$('unlock').onclick = () => {
  if (busy) return;
  locks.fill(false);
  renderCards();
};
$('copy').onclick = async () => {
  if (busy || build.some((p) => !p)) {
    $('status').textContent = 'Primero gira para completar tu build.';
    return;
  }
  const text = build.map((p) => display(p) + ' (' + p.owner + ')').join('\n');
  try {
    await navigator.clipboard.writeText(text);
    $('status').textContent = 'Build copiada.';
  } catch {
    $('status').textContent =
      'No se pudo copiar automáticamente. Puedes seleccionar los nombres.';
  }
};
function download(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('export').onclick = () => {
  save();
  download(
    JSON.stringify(allSettings(), null, 2),
    'mi-configuracion-dbd.json',
    'application/json',
  );
  $('status').textContent =
    'Configuración exportada. Impórtala en tu otra página o dispositivo.';
};
$('import').onclick = () => {
  if (!busy) $('importFile').click();
};
$('importFile').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (busy) throw Error('Espera a que termine el giro.');
    if (file.size > 100000) throw Error('El archivo es demasiado grande.');
    const text = await file.text();
    if (busy) throw Error('Espera a que termine el giro.');
    const v = validateBackup(JSON.parse(text));
    profiles = v.roles;
    applyProfile(v.lastRole);
    clearResult();
    save();
    renderGroups();
    renderCatalog();
    renderCards();
    $('status').textContent = 'Configuración importada: ' + owned.size + ' personajes.';
  } catch (err) {
    $('status').textContent =
      err instanceof SyntaxError ? 'El archivo no contiene JSON válido.' : err.message;
  } finally {
    e.target.value = '';
  }
};
loadSettings();
save();
renderGroups();
renderCatalog();
renderCards();
draw();
