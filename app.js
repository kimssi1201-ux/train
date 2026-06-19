const API_BASE = "http://swopenapi.seoul.go.kr/api/subway";
const STATION_COORDS_URL = "https://raw.githubusercontent.com/chanyou/open-seoul-subway/master/station_code.csv";
const STORAGE_KEY = "metro-live-api-key";
const REFRESH_MS = 30000;

const LINES = [
  { name: "1호선", short: "1", color: "#0052a4" },
  { name: "2호선", short: "2", color: "#00a84d" },
  { name: "3호선", short: "3", color: "#ef7c1c" },
  { name: "4호선", short: "4", color: "#00a5de" },
  { name: "5호선", short: "5", color: "#996cac" },
  { name: "6호선", short: "6", color: "#cd7c2f" },
  { name: "7호선", short: "7", color: "#747f00" },
  { name: "8호선", short: "8", color: "#e6186c" },
  { name: "9호선", short: "9", color: "#bdb092" },
  { name: "경의중앙선", short: "경의", color: "#77c4a3" },
  { name: "공항철도", short: "공항", color: "#0090d2" },
  { name: "경춘선", short: "경춘", color: "#0c8e72" },
  { name: "수인분당선", short: "수분", color: "#f5a200" },
  { name: "신분당선", short: "신분", color: "#d4003b" },
  { name: "우이신설선", short: "우이", color: "#b0ce18" },
  { name: "서해선", short: "서해", color: "#81a914" },
  { name: "신림선", short: "신림", color: "#6789ca" },
  { name: "경강선", short: "경강", color: "#003da5" },
  { name: "GTX-A", short: "GTX", color: "#a71e31" },
  { name: "용인 에버라인", apiName: "에버라인", short: "용인", color: "#56b948" },
];

const STATUS_LABELS = {
  0: "진입",
  1: "도착",
  2: "출발",
  3: "전역출발",
};

const STATUS_CLASSES = {
  0: "status-enter",
  1: "status-arrive",
  2: "status-depart",
  3: "status-depart",
};

const FORMATION_CARS = {
  "1호선": "10량",
  "2호선": "10량",
  "3호선": "10량",
  "4호선": "10량",
  "5호선": "8량",
  "6호선": "8량",
  "7호선": "8량",
  "8호선": "6량",
  "9호선": "6량",
  경의중앙선: "8량",
  공항철도: "6량",
  경춘선: "8량",
  수인분당선: "6량",
  신분당선: "6량",
  우이신설선: "2량",
  서해선: "4량",
  신림선: "3량",
  경강선: "4량",
  "GTX-A": "8량",
  "용인 에버라인": "1량",
};

const DEMO_ROWS = [
  ["2호선", "강남", "3424", "성수종착", "0", "1", "2026-06-19 20:20:07", "1002000222"],
  ["5호선", "광화문", "5122", "방화", "1", "2", "2026-06-19 20:20:10", "1005002532"],
  ["9호선", "여의도", "9331", "중앙보훈병원", "0", "0", "2026-06-19 20:20:12", "1009004115"],
  ["신분당선", "판교", "D208", "광교", "1", "1", "2026-06-19 20:20:14", "1077000754"],
];

const EVERLINE_LINE_NAME = "용인 에버라인";
const EVERLINE_STATIONS = [
  { name: "기흥", lat: 37.275619, lng: 127.115936 },
  { name: "강남대", lat: 37.270161, lng: 127.126033 },
  { name: "지석", lat: 37.269606, lng: 127.136515 },
  { name: "어정", lat: 37.274917, lng: 127.143714 },
  { name: "동백", lat: 37.269043, lng: 127.152716 },
  { name: "초당", lat: 37.260752, lng: 127.159443 },
  { name: "삼가", lat: 37.242115, lng: 127.168075 },
  { name: "시청·용인대", lat: 37.239151, lng: 127.178406 },
  { name: "명지대", lat: 37.237964, lng: 127.190294 },
  { name: "김량장", lat: 37.237247, lng: 127.198781 },
  { name: "운동장·송담대", lat: 37.237845, lng: 127.209198 },
  { name: "고진", lat: 37.24484, lng: 127.214251 },
  { name: "보평", lat: 37.258965, lng: 127.218457 },
  { name: "둔전", lat: 37.267051, lng: 127.21364 },
  { name: "전대·에버랜드", lat: 37.285342, lng: 127.219561 },
];

const state = {
  selectedLine: "all",
  query: "",
  positions: [],
  lineTotals: new Map(),
  stationCoords: new Map(),
  errors: [],
  isLoading: false,
  lastUpdated: null,
  usingFallback: false,
  timer: null,
  map: null,
  mapLayer: null,
  mapBounds: null,
};

const els = {
  lineTabs: document.querySelector("#lineTabs"),
  searchInput: document.querySelector("#searchInput"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  saveKeyButton: document.querySelector("#saveKeyButton"),
  autoRefresh: document.querySelector("#autoRefresh"),
  refreshButton: document.querySelector("#refreshButton"),
  visibleCount: document.querySelector("#visibleCount"),
  lineCount: document.querySelector("#lineCount"),
  updatedAt: document.querySelector("#updatedAt"),
  dataMode: document.querySelector("#dataMode"),
  statusText: document.querySelector("#statusText"),
  mapCanvas: document.querySelector("#mapCanvas"),
  mapSummary: document.querySelector("#mapSummary"),
  fitMapButton: document.querySelector("#fitMapButton"),
  lineSummary: document.querySelector("#lineSummary"),
  trackBoard: document.querySelector("#trackBoard"),
  sortSelect: document.querySelector("#sortSelect"),
  toast: document.querySelector("#toast"),
};

function init() {
  renderLineTabs();
  els.lineCount.textContent = String(LINES.length);
  els.apiKeyInput.value = localStorage.getItem(STORAGE_KEY) || "";
  bindEvents();
  loadStationCoordinates();
  refresh();
  scheduleRefresh();
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    render();
  });

  els.sortSelect.addEventListener("change", render);

  els.saveKeyButton.addEventListener("click", () => {
    const key = els.apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
      showToast("인증키를 저장했습니다.");
    } else {
      localStorage.removeItem(STORAGE_KEY);
      showToast("sample 키로 전환했습니다.");
    }
    refresh();
  });

  els.refreshButton.addEventListener("click", refresh);
  els.fitMapButton.addEventListener("click", () => fitMapToMarkers(true));

  els.autoRefresh.addEventListener("change", () => {
    scheduleRefresh();
    showToast(els.autoRefresh.checked ? "자동 새로고침 켜짐" : "자동 새로고침 꺼짐");
  });
}

function renderLineTabs() {
  const allTab = { name: "all", label: "전체", short: "ALL", color: "#141820" };
  const numberLines = LINES.filter((line) => /^[1-9]호선$/.test(line.name));
  const otherLines = LINES.filter((line) => !/^[1-9]호선$/.test(line.name));
  const groups = [
    { title: "전체·1-9호선", className: "is-numbered", tabs: [allTab, ...numberLines] },
    { title: "광역·기타", className: "is-other", tabs: otherLines },
  ];

  els.lineTabs.replaceChildren(
    ...groups.map((group) => {
      const section = document.createElement("section");
      section.className = `line-tab-group ${group.className}`;
      const heading = document.createElement("h2");
      heading.className = "line-tab-heading";
      heading.textContent = group.title;
      const grid = document.createElement("div");
      grid.className = "line-tab-grid";

      grid.replaceChildren(...group.tabs.map(lineTabButton));
      section.replaceChildren(heading, grid);
      return section;
    }),
  );
}

function lineTabButton(tab) {
  const button = document.createElement("button");
  button.type = "button";
  const isNumberLine = /^[1-9]호선$/.test(tab.name);
  const label = isNumberLine ? tab.short : tab.label || tab.name;
  button.className = `line-tab${isNumberLine ? " is-number" : ""}${tab.name === "all" ? " is-all" : ""}${
    state.selectedLine === tab.name ? " is-active" : ""
  }`;
  button.style.setProperty("--line-color", tab.color);
  button.title = tab.name === "all" ? "전체" : tab.name;
  button.innerHTML = `<span class="line-dot"></span><span>${escapeHtml(label)}</span>`;
  button.addEventListener("click", () => {
    state.selectedLine = tab.name;
    renderLineTabs();
    refresh();
  });
  return button;
}

async function refresh() {
  if (state.isLoading) return;
  state.isLoading = true;
  state.usingFallback = false;
  els.statusText.textContent = "실시간 위치 불러오는 중";
  els.refreshButton.disabled = true;

  try {
    const targetLines = state.selectedLine === "all" ? LINES : LINES.filter((line) => line.name === state.selectedLine);
    const results = await Promise.allSettled(targetLines.map(fetchLinePositions));
    const positions = [];
    const totals = new Map();
    const errors = [];

    results.forEach((result, index) => {
      const line = targetLines[index];
      if (result.status === "fulfilled") {
        positions.push(...result.value.positions);
        totals.set(line.name, result.value.total);
      } else {
        errors.push(`${line.name}: ${result.reason.message}`);
      }
    });

    if (positions.length === 0 && errors.length === targetLines.length) {
      throw new Error(errors[0] || "받은 열차 위치가 없습니다.");
    }

    state.positions = positions;
    state.lineTotals = totals;
    state.errors = errors;
    state.lastUpdated = new Date();
  } catch (error) {
    state.positions = createDemoPositions();
    state.lineTotals = new Map();
    state.errors = [error.message];
    state.lastUpdated = new Date();
    state.usingFallback = true;
    showToast("데모 데이터로 표시 중입니다.");
  } finally {
    state.isLoading = false;
    els.refreshButton.disabled = false;
    render();
  }
}

async function fetchLinePositions(line) {
  const key = getApiKey();
  const isSample = key.toLowerCase() === "sample";
  const endRow = isSample ? 5 : 160;
  const apiLineName = line.apiName || line.name;
  const url = `${API_BASE}/${encodeURIComponent(key)}/json/realtimePosition/0/${endRow}/${encodeURIComponent(apiLineName)}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const message = data.errorMessage;

  if (message && message.code && message.code !== "INFO-000") {
    throw new Error(message.message || message.code);
  }

  const rows = Array.isArray(data.realtimePositionList) ? data.realtimePositionList : [];
  const total = Number(message?.total ?? rows[0]?.totalCount ?? rows.length);

  return {
    total,
    positions: rows.map((row) => normalizeRow(row, line)),
  };
}

function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || els.apiKeyInput.value.trim() || "sample";
}

function normalizeRow(row, line) {
  const statusCode = String(row.trainSttus ?? "");
  const stationId = Number(String(row.statnId || "").replace(/\D/g, "")) || Number(row.rowNum) || 0;

  return {
    id: `${line.name}-${row.trainNo || row.rowNum}-${row.statnId || row.rowNum}-${row.updnLine || "x"}`,
    lineName: line.name,
    shortLine: line.short,
    lineColor: line.color,
    station: row.statnNm || "-",
    stationId,
    trainNo: row.trainNo || "-",
    formation: formationLabel(line.name, row.trainNo),
    destination: cleanupDestination(row.statnTnm),
    directionCode: String(row.updnLine ?? ""),
    direction: directionLabel(line.name, row.updnLine),
    statusCode,
    status: STATUS_LABELS[statusCode] || "운행",
    statusClass: STATUS_CLASSES[statusCode] || "",
    recordedAt: row.recptnDt || "",
    express: row.directAt === "1",
    last: row.lstcarAt === "1",
  };
}

function formationLabel(lineName, trainNo) {
  const cars = FORMATION_CARS[lineName];
  const number = trainNo || "-";
  return cars ? `${number} · ${cars}` : String(number);
}

function cleanupDestination(value) {
  return String(value || "-").replace(/종착$/, "행");
}

function directionLabel(lineName, code) {
  const normalized = String(code ?? "");
  if (lineName === "2호선") {
    return normalized === "0" ? "내선" : normalized === "1" ? "외선" : "방향";
  }
  return normalized === "0" ? "상행" : normalized === "1" ? "하행" : "방향";
}

function createDemoPositions() {
  return DEMO_ROWS.map(([lineName, station, trainNo, destination, directionCode, statusCode, recordedAt, statnId]) => {
    const line = LINES.find((item) => item.name === lineName) || LINES[0];
    return normalizeRow(
      {
        subwayNm: lineName,
        statnNm: station,
        trainNo,
        statnTnm: destination,
        updnLine: directionCode,
        trainSttus: statusCode,
        recptnDt: recordedAt,
        statnId,
      },
      line,
    );
  });
}

function render() {
  const filtered = getFilteredPositions();
  const sorted = sortPositions(filtered);
  const activeLines = new Set(sorted.map((item) => item.lineName));
  const missingLineCount = state.selectedLine === "all" ? Math.max(0, LINES.length - activeLines.size) : 0;
  const endedLineCount =
    state.selectedLine === "all" ? LINES.filter((line) => !activeLines.has(line.name) && lineIsEnded(line.name)).length : 0;
  const mode = getApiKey() === "sample" ? "sample" : "live key";

  els.visibleCount.textContent = String(sorted.length);
  els.updatedAt.textContent = state.lastUpdated ? formatClock(state.lastUpdated) : "-";
  els.dataMode.textContent = state.usingFallback ? "demo" : mode;
  els.statusText.textContent = statusMessage(sorted.length, activeLines.size, missingLineCount, endedLineCount);
  els.lineSummary.textContent =
    state.selectedLine === "all" ? `전체 ${LINES.length}개 노선` : `${state.selectedLine} 실시간 위치`;

  renderMap(sorted);
  renderTrack(sorted);
}

async function loadStationCoordinates() {
  seedFallbackCoordinates();

  try {
    const response = await fetch(STATION_COORDS_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    parseStationCsv(await response.text());
    render();
  } catch (error) {
    els.mapSummary.textContent = "기본 좌표로 지도 표시 중";
  }
}

function seedFallbackCoordinates() {
  [
    ["서울역", 37.556228, 126.972135],
    ["시청", 37.565715, 126.977088],
    ["종각", 37.570161, 126.982923],
    ["종로3가", 37.570406, 126.991847],
    ["동대문", 37.57142, 127.009745],
    ["강남", 37.497958, 127.027539],
    ["잠실", 37.513305, 127.100129],
    ["선릉", 37.504503, 127.049008],
    ["왕십리", 37.561533, 127.037732],
    ["여의도", 37.521624, 126.924191],
    ["홍대입구", 37.557192, 126.925381],
    ["건대입구", 37.540373, 127.069191],
    ["사당", 37.47653, 126.981685],
    ["신도림", 37.508725, 126.891295],
    ["광화문", 37.571026, 126.976669],
    ["판교", 37.394761, 127.111217],
    ...EVERLINE_STATIONS.map((station) => [station.name, station.lat, station.lng]),
  ].forEach(([name, lat, lng]) => setStationCoord(name, lat, lng));
}

function parseStationCsv(csv) {
  csv
    .split(/\r?\n/)
    .slice(1)
    .forEach((line) => {
      const cols = line.split(",");
      const name = cols[3]?.trim();
      const lat = Number(cols[4]);
      const lng = Number(cols[5]);
      if (name && Number.isFinite(lat) && Number.isFinite(lng)) {
        setStationCoord(name, lat, lng);
      }
    });
}

function setStationCoord(name, lat, lng) {
  state.stationCoords.set(normalizeStationName(name), { lat, lng });
}

function normalizeStationName(name) {
  return String(name || "")
    .replace(/\(.+?\)/g, "")
    .replace(/역$/g, "")
    .replace(/[·.]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function renderMap(items) {
  if (!els.mapCanvas) return;

  if (!window.L) {
    els.mapSummary.textContent = "지도 라이브러리 로딩 중";
    return;
  }

  ensureMap();
  requestAnimationFrame(() => state.map.invalidateSize());
  state.mapLayer.clearLayers();

  const markerGroups = groupMapMarkers(items);
  const bounds = [];

  markerGroups.forEach((group) => {
    const color = group.trains[0]?.lineColor || "#141820";
    const marker = window.L.circleMarker([group.lat, group.lng], {
      radius: Math.min(18, 8 + group.trains.length * 1.3),
      color,
      fillColor: color,
      fillOpacity: 0.78,
      opacity: 0.95,
      weight: 3,
    });
    marker.bindPopup(mapPopupTemplate(group));
    marker.addTo(state.mapLayer);
    bounds.push([group.lat, group.lng]);
  });

  const everlineStationCount = renderEverlineOverlay(bounds);
  state.mapBounds = bounds.length ? window.L.latLngBounds(bounds) : null;
  fitMapToMarkers(true);

  const mappedCount = markerGroups.reduce((sum, group) => sum + group.trains.length, 0);
  const missing = Math.max(0, items.length - mappedCount);
  els.mapSummary.textContent = mapSummaryText(mappedCount, missing, everlineStationCount);
}

function renderEverlineOverlay(bounds) {
  if (!shouldShowEverlineOnMap()) return 0;

  const line = LINES.find((item) => item.name === EVERLINE_LINE_NAME);
  const color = line?.color || "#56b948";
  const points = EVERLINE_STATIONS.map((station) => [station.lat, station.lng]);

  window.L.polyline(points, {
    color,
    dashArray: state.selectedLine === EVERLINE_LINE_NAME ? null : "8 7",
    opacity: 0.9,
    weight: state.selectedLine === EVERLINE_LINE_NAME ? 6 : 4,
  }).addTo(state.mapLayer);

  EVERLINE_STATIONS.forEach((station) => {
    const marker = window.L.circleMarker([station.lat, station.lng], {
      color,
      fillColor: "#ffffff",
      fillOpacity: 1,
      opacity: 1,
      radius: state.selectedLine === EVERLINE_LINE_NAME ? 6 : 4,
      weight: 2,
    });
    marker.bindPopup(`
      <div class="train-popup">
        <strong>${escapeHtml(EVERLINE_LINE_NAME)} ${escapeHtml(station.name)}</strong>
        <span>실시간 열차 위치 정보 없음</span>
      </div>
    `);
    marker.addTo(state.mapLayer);
    bounds.push([station.lat, station.lng]);
  });

  return EVERLINE_STATIONS.length;
}

function shouldShowEverlineOnMap() {
  return state.selectedLine === "all" || state.selectedLine === EVERLINE_LINE_NAME;
}

function mapSummaryText(mappedCount, missing, everlineStationCount) {
  if (state.selectedLine === EVERLINE_LINE_NAME && everlineStationCount) {
    return `${EVERLINE_LINE_NAME} 역 ${everlineStationCount}개 표시 · 실시간 열차 정보 없음`;
  }

  const parts = [];
  if (mappedCount) parts.push(`열차 ${mappedCount}대`);
  if (missing) parts.push(`${missing}대 좌표 없음`);
  if (everlineStationCount) parts.push(`에버라인 역 ${everlineStationCount}개`);

  return parts.length ? `지도에 ${parts.join(", ")} 표시` : "지도에 표시할 좌표가 없습니다.";
}

function ensureMap() {
  if (state.map) return;

  state.map = window.L.map(els.mapCanvas, {
    zoomControl: true,
    attributionControl: true,
  }).setView([37.5665, 126.978], 11);

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(state.map);

  state.mapLayer = window.L.layerGroup().addTo(state.map);
}

function groupMapMarkers(items) {
  const groups = new Map();

  items.forEach((train) => {
    const coord = state.stationCoords.get(normalizeStationName(train.station));
    if (!coord) return;

    const key = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)},${normalizeStationName(train.station)}`;
    const group = groups.get(key) || {
      lat: coord.lat,
      lng: coord.lng,
      station: train.station,
      trains: [],
    };
    group.trains.push(train);
    groups.set(key, group);
  });

  return Array.from(groups.values());
}

function fitMapToMarkers(force) {
  if (!state.map || !state.mapBounds) return;
  state.map.invalidateSize();
  if (!force && state.map.getZoom() !== 11) return;
  state.map.fitBounds(state.mapBounds, { padding: [34, 34], maxZoom: 13 });
}

function mapPopupTemplate(group) {
  const lines = group.trains
    .slice(0, 8)
    .map(
      (train) =>
        `<span>${escapeHtml(train.lineName)} ${escapeHtml(train.trainNo)} · ${escapeHtml(train.destination)} · ${escapeHtml(train.status)}</span>`,
    )
    .join("");
  const more = group.trains.length > 8 ? `<span>외 ${group.trains.length - 8}대</span>` : "";

  return `
    <div class="train-popup">
      <strong>${escapeHtml(group.station)}</strong>
      ${lines}
      ${more}
    </div>
  `;
}

function statusMessage(visibleCount, activeLineCount, missingLineCount, endedLineCount) {
  if (state.usingFallback) return "공식 API 연결 실패";
  if (visibleCount === 0 && state.selectedLine !== "all") {
    return lineIsEnded(state.selectedLine) ? `${state.selectedLine} 운행종료` : `${state.selectedLine} 위치 정보 없음`;
  }
  if (visibleCount === 0 && endedLineCount > 0) return `${endedLineCount}개 노선 운행종료`;
  if (visibleCount === 0) return "표시할 열차 없음";
  if (state.errors.length) return `${activeLineCount}개 노선 표시, 일부 노선 실패`;
  if (endedLineCount > 0 && endedLineCount === missingLineCount) {
    return `${activeLineCount}개 노선 실시간, ${endedLineCount}개 운행종료`;
  }
  if (endedLineCount > 0) {
    return `${activeLineCount}개 노선 실시간, ${endedLineCount}개 운행종료, ${missingLineCount - endedLineCount}개 정보 없음`;
  }
  if (missingLineCount > 0) return `${activeLineCount}개 노선 실시간, ${missingLineCount}개 정보 없음`;
  return `${activeLineCount}개 노선 실시간 표시`;
}

function getFilteredPositions() {
  const query = state.query.toLowerCase();
  if (!query) return state.positions;

  return state.positions.filter((item) =>
    [item.lineName, item.station, item.trainNo, item.formation, item.destination, item.direction, item.status]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}

function sortPositions(items) {
  const sort = els.sortSelect.value;
  const next = [...items];

  next.sort((a, b) => {
    if (sort === "station") {
      return a.station.localeCompare(b.station, "ko") || a.lineName.localeCompare(b.lineName, "ko");
    }
    if (sort === "time") {
      return parseDate(b.recordedAt) - parseDate(a.recordedAt);
    }
    if (sort === "status") {
      return a.status.localeCompare(b.status, "ko") || a.lineName.localeCompare(b.lineName, "ko");
    }
    return lineIndex(a.lineName) - lineIndex(b.lineName) || a.stationId - b.stationId;
  });

  return next;
}

function lineIndex(name) {
  const index = LINES.findIndex((line) => line.name === name);
  return index === -1 ? 999 : index;
}

function renderTrack(items) {
  if (items.length === 0 && state.selectedLine !== "all") {
    els.trackBoard.innerHTML = `<div class="empty-state">${emptyStateMessage()}</div>`;
    return;
  }

  const groups = groupBy(items, "lineName");
  const displayLines =
    state.selectedLine === "all"
      ? LINES
      : LINES.filter((line) => line.name === state.selectedLine || groups.has(line.name));

  const fragments = displayLines.map((lineMeta) => {
      const lineName = lineMeta.name;
      const trains = groups.get(lineName) || [];
      const line = LINES.find((item) => item.name === lineName) || { color: "#141820" };
      const total = state.lineTotals.get(lineName);
      const countText = total && total > trains.length ? `${trains.length}/${total}대` : `${trains.length}대`;
      const track = trains.length ? lineTrackTemplate(trains) : `<div class="no-train">${lineEmptyLabel(lineName)}</div>`;

      return `
        <article class="line-strip${trains.length ? "" : " is-empty"}" style="--line-color:${line.color}">
          <div class="strip-label">
            <strong>${escapeHtml(lineName)}</strong>
            <span>${countText}</span>
          </div>
          ${track}
        </article>
      `;
    });

  els.trackBoard.innerHTML = fragments.join("");
}

function lineTrackTemplate(trains) {
  const ordered = trains
    .slice()
    .sort((a, b) => a.stationId - b.stationId || a.directionCode.localeCompare(b.directionCode) || a.trainNo.localeCompare(b.trainNo));
  const bounds = trackBounds(ordered);
  const width = Math.max(720, Math.min(5200, ordered.length * 92));
  const markers = ordered.map((train, index) => trackMarkerTemplate(train, index, ordered.length)).join("");

  return `
    <div class="route-track">
      <div class="route-track-inner" style="--track-width:${width}px">
        <div class="route-rail" aria-hidden="true"></div>
        <div class="route-endpoints" aria-hidden="true">
          <span>${escapeHtml(bounds.start?.station || "시작")}</span>
          <span>${escapeHtml(bounds.end?.station || "끝")}</span>
        </div>
        <div class="route-markers">
          ${markers}
        </div>
      </div>
    </div>
  `;
}

function trackBounds(ordered) {
  const withStationId = ordered.filter((train) => Number.isFinite(train.stationId) && train.stationId > 0);
  const source = withStationId.length ? withStationId : ordered;
  return {
    min: source[0]?.stationId || 0,
    max: source[source.length - 1]?.stationId || 0,
    start: source[0],
    end: source[source.length - 1],
  };
}

function trackMarkerTemplate(train, index, total) {
  const position = trackPosition(index, total);
  const stack = index % 3;
  const title = `${train.lineName} ${train.trainNo} ${train.station} ${train.status}`;
  const statusLabel = trackStatusLabel(train);

  return `
    <div class="train-pin ${train.statusClass}" style="--pos:${position}; --stack:${stack}" title="${escapeHtml(title)}">
      <span class="train-pin-dot"></span>
      <span class="train-pin-label">
        <strong>${escapeHtml(train.station)}</strong>
        <span class="pin-detail">
          <span class="pin-status">${escapeHtml(statusLabel)}</span>
          <span class="pin-meta">${escapeHtml(train.trainNo)} · ${escapeHtml(train.direction)}</span>
        </span>
      </span>
    </div>
  `;
}

function trackStatusLabel(train) {
  if (train.status === "도착") return "정차";
  return train.status || "상태없음";
}

function trackPosition(index, total) {
  if (total <= 1) return 50;
  const raw = (index / (total - 1)) * 100;
  return clamp(raw, 3, 97).toFixed(2);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function emptyStateMessage() {
  if (state.query) return "검색 결과가 없습니다.";
  if (state.selectedLine !== "all" && lineIsEnded(state.selectedLine)) return `${state.selectedLine} 운행종료`;
  if (state.selectedLine !== "all") return `${state.selectedLine}의 실시간 위치 정보가 현재 제공되지 않습니다.`;
  return "표시할 열차가 없습니다.";
}

function lineEmptyLabel(lineName) {
  return lineIsEnded(lineName) ? "운행종료" : "현재 위치 정보 없음";
}

function lineIsEnded(lineName) {
  if (state.query || state.usingFallback) return false;
  const knownTotal = state.lineTotals.get(lineName);
  return knownTotal === 0 && isEndOfServicePeriod(new Date());
}

function isEndOfServicePeriod(date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= 30 && minutes < 300;
}

function groupBy(items, key) {
  return items.reduce((map, item) => {
    const value = item[key];
    const group = map.get(value) || [];
    group.push(item);
    map.set(value, group);
    return map;
  }, new Map());
}

function formatClock(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function parseDate(value) {
  if (!value) return 0;
  return new Date(String(value).replace(" ", "T")).getTime();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2400);
}

function scheduleRefresh() {
  window.clearInterval(state.timer);
  if (els.autoRefresh.checked) {
    state.timer = window.setInterval(refresh, REFRESH_MS);
  }
}

init();
