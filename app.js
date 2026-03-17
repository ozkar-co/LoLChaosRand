const el = {
  spinBtn: document.getElementById("spin-btn"),
  shareBtn: document.getElementById("share-btn"),
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
  current: { champion: null, role: null, build: null },
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

function showShareBtn() {
  el.shareBtn.style.display = "";
}

function buildShareUrl() {
  const { champion, role, build } = state.current;
  const params = new URLSearchParams();
  if (champion) params.set("champion", champion.id);
  if (role) params.set("role", role.id);
  if (build) params.set("build", build.name);
  const base = `${location.origin}${location.pathname}`;
  return params.toString() ? `${base}?${params}` : base;
}

function applyPreload() {
  const params = new URLSearchParams(location.search);
  const championId = params.get("champion");
  const roleId = params.get("role");
  const buildName = params.get("build");

  if (!championId && !roleId && !buildName) return;

  const champion = championId
    ? state.champions.find((c) => c.id === championId) ?? null
    : null;
  const role = roleId
    ? state.roles.find((r) => r.id === roleId) ?? null
    : null;
  const build = buildName
    ? state.builds.find((b) => b.name === buildName) ?? null
    : null;

  if (champion) {
    state.current.champion = champion;
    el.championValue.textContent = champion.name;
    el.championMeta.textContent = champion.title;
    updateChampionImage(champion.id);
  }
  if (role) {
    state.current.role = role;
    el.roleValue.textContent = role.name;
    el.roleMeta.textContent = role.responsibility;
  }
  if (build) {
    state.current.build = build;
    el.buildValue.textContent = build.name;
    el.buildMeta.textContent = `${build.style} | ${build.description}`;
  }

  if (champion || role || build) {
    setStatus("Configuracion caotica lista. Buena suerte.");
    showShareBtn();
  }
}

async function spinAll() {
  if (state.spinning) return;

  state.spinning = true;
  el.spinBtn.disabled = true;
  el.shareBtn.style.display = "none";

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

    state.current.champion = champion;
    await updateChampionImage(champion.id);
    await sleep(250);

    setStatus("Girando rol...");
    const role = await rouletteSpin({
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

    state.current.role = role;
    await sleep(220);

    setStatus("Girando build...");
    const build = await rouletteSpin({
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

    state.current.build = build;
    setStatus("Configuracion caotica lista. Buena suerte.");
    showShareBtn();
  } catch (error) {
    console.error(error);
    setStatus("Error durante la ruleta. Revisa la consola.");
  } finally {
    state.spinning = false;
    el.spinBtn.disabled = false;
  }
}

async function handleShare() {
  const url = buildShareUrl();
  try {
    await navigator.clipboard.writeText(url);
    setStatus("Enlace copiado al portapapeles.");
  } catch {
    prompt("Copia este enlace:", url);
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

    applyPreload();

    if (!state.current.champion && !state.current.role && !state.current.build) {
      setStatus("Listo para girar.");
    }
    el.spinBtn.disabled = false;
  } catch (error) {
    console.error(error);
    setStatus("No se pudieron cargar los datos JSON.");
    el.spinBtn.disabled = true;
  }
}

el.spinBtn.addEventListener("click", spinAll);
el.shareBtn.addEventListener("click", handleShare);
el.spinBtn.disabled = true;
initialize();

