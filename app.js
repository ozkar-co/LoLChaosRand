const el = {
  spinBtn: document.getElementById("spin-btn"),
  status: document.getElementById("status"),
  championValue: document.getElementById("champion-value"),
  championMeta: document.getElementById("champion-meta"),
  roleValue: document.getElementById("role-value"),
  roleMeta: document.getElementById("role-meta"),
  buildValue: document.getElementById("build-value"),
  buildMeta: document.getElementById("build-meta"),
  championCard: document.getElementById("champion-card"),
  roleCard: document.getElementById("role-card"),
  buildCard: document.getElementById("build-card"),
  championImage: document.getElementById("champion-image"),
};

const state = {
  champions: [],
  roles: [],
  builds: [],
  spinning: false,
};

function sampleRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }
  return response.json();
}

function collectBuilds(playstyleJson) {
  return playstyleJson.playstyles.flatMap((style) =>
    style.builds.map((build) => ({
      style: style.label,
      name: build.name,
      description: build.description,
    }))
  );
}

function setCardSpinning(card, active) {
  card.classList.toggle("is-spinning", active);
}

async function rouletteSpin({
  card,
  list,
  durationMs,
  tickMs,
  onTick,
  onFinal,
}) {
  setCardSpinning(card, true);
  const start = performance.now();

  while (performance.now() - start < durationMs) {
    onTick(sampleRandom(list));
    await sleep(tickMs);
  }

  const finalItem = sampleRandom(list);
  onFinal(finalItem);
  setCardSpinning(card, false);
  return finalItem;
}

function setStatus(text) {
  el.status.textContent = text;
}

async function updateChampionImage(championId) {
  const src = `assets/loading/${championId}.jpg`;
  const ok = await new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = src;
  });

  if (ok) {
    el.championImage.style.display = "block";
    el.championImage.src = src;
    return;
  }

  el.championImage.style.display = "none";
}

async function spinAll() {
  if (state.spinning) return;

  state.spinning = true;
  el.spinBtn.disabled = true;

  try {
    setStatus("Girando campeon...");
    const champion = await rouletteSpin({
      card: el.championCard,
      list: state.champions,
      durationMs: 2100,
      tickMs: 75,
      onTick: (item) => {
        el.championValue.textContent = item.name;
        el.championMeta.textContent = item.title;
      },
      onFinal: (item) => {
        el.championValue.textContent = item.name;
        el.championMeta.textContent = item.title;
      },
    });

    await updateChampionImage(champion.id);
    await sleep(250);

    setStatus("Girando rol...");
    await rouletteSpin({
      card: el.roleCard,
      list: state.roles,
      durationMs: 1700,
      tickMs: 90,
      onTick: (item) => {
        el.roleValue.textContent = item.name;
        el.roleMeta.textContent = item.responsibility;
      },
      onFinal: (item) => {
        el.roleValue.textContent = item.name;
        el.roleMeta.textContent = item.responsibility;
      },
    });

    await sleep(220);

    setStatus("Girando build...");
    await rouletteSpin({
      card: el.buildCard,
      list: state.builds,
      durationMs: 2200,
      tickMs: 80,
      onTick: (item) => {
        el.buildValue.textContent = item.name;
        el.buildMeta.textContent = item.style;
      },
      onFinal: (item) => {
        el.buildValue.textContent = item.name;
        el.buildMeta.textContent = `${item.style} | ${item.description}`;
      },
    });

    setStatus("Configuracion caotica lista. Buena suerte.");
  } catch (error) {
    console.error(error);
    setStatus("Error durante la ruleta. Revisa la consola.");
  } finally {
    state.spinning = false;
    el.spinBtn.disabled = false;
  }
}

async function initialize() {
  try {
    const [championJson, roleJson, playstyleJson] = await Promise.all([
      loadJson("data/champion.json"),
      loadJson("data/roles.json"),
      loadJson("data/playstyle.json"),
    ]);

    state.champions = Object.values(championJson.data).map((champion) => ({
      id: champion.id,
      name: champion.name,
      title: champion.title,
    }));

    state.roles = roleJson.roles;
    state.builds = collectBuilds(playstyleJson);

    if (!state.champions.length || !state.roles.length || !state.builds.length) {
      throw new Error("Datos incompletos para inicializar la ruleta");
    }

    setStatus("Listo para girar.");
    el.spinBtn.disabled = false;
  } catch (error) {
    console.error(error);
    setStatus("No se pudieron cargar los datos JSON.");
    el.spinBtn.disabled = true;
  }
}

el.spinBtn.addEventListener("click", spinAll);
el.spinBtn.disabled = true;
initialize();
