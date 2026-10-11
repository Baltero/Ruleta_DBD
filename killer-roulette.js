'use strict';
// La colección personal se comparte con la selección de perks del modo Killer.
let killerSpinning = false;
let selectedKiller = null;
const killerNodes = {
  panel: document.getElementById('killerRoulette'),
  grid: document.getElementById('killerPortraitGrid'),
  button: document.getElementById('spinKiller'),
  all: document.getElementById('allKillers'),
  animate: document.getElementById('animateKillers'),
  name: document.getElementById('killerWinnerName'),
  image: document.getElementById('killerWinnerImage'),
  status: document.getElementById('killerWheelStatus'),
};
function killerPool() {
  return killerCatalog
    .map(([name], index) => ({ name, index }))
    .filter((k) => killerNodes.all.checked || owned.has(k.name));
}
function portraitFor(index) {
  const key = killerPortraitKeys[index];
  return availableKillerPortraits.has(key)
    ? `portraits/${key}.png`
    : 'portraits/fallback.svg';
}
function showKiller(killer, final = false) {
  killerNodes.name.textContent = killer.name.split(' / ')[0];
  killerNodes.image.src = portraitFor(killer.index);
  killerNodes.image.alt = killer.name;
  killerNodes.image.classList.remove('portrait-passing', 'portrait-landed');
  void killerNodes.image.offsetWidth;
  killerNodes.image.classList.add(final ? 'portrait-landed' : 'portrait-passing');
  killerNodes.grid.querySelectorAll('[data-killer-index]').forEach((tile) => {
    const active = Number(tile.dataset.killerIndex) === killer.index;
    tile.classList.toggle('is-active', active);
    tile.classList.toggle('is-winner', active && final);
  });
}
function refreshKillerRoulette() {
  // Los scripts se cargan después de app.js; esta función se invoca desde updateCount.
  if (typeof killerNodes === 'undefined') return;
  killerNodes.panel.hidden = role !== 'killer';
  killerNodes.panel.classList.toggle('animation-enabled', killerNodes.animate.checked);
  if (role !== 'killer' || killerSpinning) return;
  const pool = killerPool();
  killerNodes.grid.replaceChildren();
  for (const killer of pool) {
    const tile = document.createElement('div');
    tile.className = 'killer-tile';
    tile.dataset.killerIndex = killer.index;
    tile.title = killer.name;
    const img = document.createElement('img');
    img.src = portraitFor(killer.index);
    img.alt = killer.name;
    img.loading = 'lazy';
    const caption = document.createElement('span');
    caption.textContent = killer.name.split(' / ')[0];
    tile.append(img, caption);
    killerNodes.grid.append(tile);
  }
  killerNodes.button.disabled = pool.length === 0;
  if (!selectedKiller || !pool.some((k) => k.index === selectedKiller.index)) {
    selectedKiller = null;
    killerNodes.name.textContent = pool.length
      ? 'Que decida la suerte'
      : 'Elige tus killers';
    killerNodes.image.src = 'portraits/fallback.svg';
    killerNodes.image.alt = '';
    killerNodes.status.textContent = pool.length
      ? `${pool.length} killers disponibles para el sorteo.`
      : 'Añade tus killers desde el catálogo para comenzar.';
  } else {
    showKiller(selectedKiller, true);
    killerNodes.status.textContent = `${pool.length} killers disponibles · Resultado: ${selectedKiller.name}`;
  }
}
async function spinKillerRoulette() {
  if (busy || killerSpinning || role !== 'killer') return;
  const pool = killerPool();
  if (!pool.length) return;
  killerNodes.panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Se elige el resultado una sola vez con el muestreo uniforme de la app.
  const winner = pool[rand(pool.length)];
  busy = true;
  killerSpinning = true;
  killerNodes.button.disabled = true;
  killerNodes.all.disabled = true;
  killerNodes.animate.disabled = true;
  killerNodes.status.textContent = 'La Entidad está eligiendo…';
  try {
    if (killerNodes.animate.checked && pool.length > 1) {
      // Recorre al menos una vuelta completa y frena hasta el ganador, sin saltar.
      const winnerPosition = pool.findIndex((k) => k.index === winner.index);
      const startPosition = selectedKiller
        ? Math.max(
            0,
            pool.findIndex((k) => k.index === selectedKiller.index),
          )
        : rand(pool.length);
      const remaining = (winnerPosition - startPosition + pool.length) % pool.length;
      const totalSteps =
        pool.length * Math.max(1, Math.ceil(28 / pool.length)) + remaining;
      killerNodes.panel.classList.add('is-spinning');
      // Precarga los retratos para evitar cuadros vacíos durante el giro.
      pool.forEach((k) => {
        const image = new Image();
        image.src = portraitFor(k.index);
      });
      for (let step = 1; step <= totalSteps; step++) {
        showKiller(pool[(startPosition + step) % pool.length]);
        const stepsLeft = totalSteps - step;
        const braking = stepsLeft < 12 ? (12 - stepsLeft) / 12 : 0;
        const delay = 45 + Math.pow(braking, 2.4) * 380;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    selectedKiller = winner;
    showKiller(winner, true);
    killerNodes.status.textContent = `Jugarás con ${winner.name}. Puedes girar las perks abajo para preparar tu build.`;
  } finally {
    killerNodes.panel.classList.remove('is-spinning');
    busy = false;
    killerSpinning = false;
    killerNodes.button.disabled = false;
    killerNodes.all.disabled = false;
    killerNodes.animate.disabled = false;
  }
}
killerNodes.button.onclick = spinKillerRoulette;
killerNodes.all.onchange = refreshKillerRoulette;
killerNodes.animate.onchange = refreshKillerRoulette;
document.getElementById('chooseKillerRoster').onclick = () => {
  if (busy) return;
  document.getElementById('catalogPanel').open = true;
  document.getElementById('catalogPanel').scrollIntoView({ behavior: 'smooth' });
};
refreshKillerRoulette();
