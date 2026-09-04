export interface WorkspaceState {
  watchlist: string[];
  panelSymbols: string[];
  recentSymbols: string[];
  activePanelIndex: number;
  panelCompareSymbols: string[][];
}

const WORKSPACE_STORAGE_KEY = "fscandle_workspace_state_v2";
const PANEL_COUNT = 4;
const DEFAULT_WATCHLIST = ["SPY", "QQQ", "BTC", "NVDA"];
const DEFAULT_PANEL_SYMBOLS = ["SPY", "QQQ", "BTC", "NVDA"];
const DEFAULT_COMPARE_SYMBOLS = [[], [], [], []];

const MAX_RECENT_SYMBOLS = 8;

const normalizeSymbol = (value: string) => value.trim().toUpperCase();

export const uniqueSymbolList = (symbols: string[]) => {
  const seen = new Set<string>();
  const next: string[] = [];

  symbols.forEach((symbol) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    next.push(normalized);
  });

  return next;
};

const normalizePanelSymbols = (panelSymbols?: string[]) => {
  const next = [...DEFAULT_PANEL_SYMBOLS];

  uniqueSymbolList(panelSymbols ?? [])
    .slice(0, PANEL_COUNT)
    .forEach((symbol, index) => {
      next[index] = symbol;
    });

  return next;
};

const normalizePanelCompareSymbols = (panelCompareSymbols: string[][] | undefined, panelSymbols: string[]) => {
  const next = Array.from({ length: PANEL_COUNT }, (_, index) => {
    const source = panelCompareSymbols?.[index] ?? DEFAULT_COMPARE_SYMBOLS[index] ?? [];
    return uniqueSymbolList(source)
      .filter((symbol) => symbol !== panelSymbols[index])
      .slice(0, 5);
  });

  return next;
};

export function createDefaultWorkspaceState(): WorkspaceState {
  return {
    watchlist: [...DEFAULT_WATCHLIST],
    panelSymbols: [...DEFAULT_PANEL_SYMBOLS],
    recentSymbols: [DEFAULT_PANEL_SYMBOLS[0]],
    activePanelIndex: 0,
    panelCompareSymbols: DEFAULT_COMPARE_SYMBOLS.map((symbols) => [...symbols]),
  };
}

export function normalizeWorkspaceState(
  state?: Partial<WorkspaceState> | null,
): WorkspaceState {
  const defaults = createDefaultWorkspaceState();
  const panelSymbols = normalizePanelSymbols(state?.panelSymbols);
  const activePanelIndex = Math.min(
    Math.max(0, state?.activePanelIndex ?? defaults.activePanelIndex),
    PANEL_COUNT - 1,
  );
  const normalizedWatchlist = Array.isArray(state?.watchlist)
    ? uniqueSymbolList(state?.watchlist ?? [])
    : defaults.watchlist;

  return {
    watchlist: normalizedWatchlist,
    panelSymbols,
    recentSymbols: uniqueSymbolList([...(state?.recentSymbols ?? []), panelSymbols[activePanelIndex]]).slice(0, MAX_RECENT_SYMBOLS),
    activePanelIndex,
    panelCompareSymbols: normalizePanelCompareSymbols(state?.panelCompareSymbols, panelSymbols),
  };
}

export function loadWorkspaceState(): WorkspaceState {
  if (typeof window === "undefined") {
    return createDefaultWorkspaceState();
  }

  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      return createDefaultWorkspaceState();
    }

    return normalizeWorkspaceState(JSON.parse(raw) as Partial<WorkspaceState>);
  } catch {
    return createDefaultWorkspaceState();
  }
}

export function saveWorkspaceState(state: WorkspaceState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify(normalizeWorkspaceState(state)),
    );
  } catch {
    // Ignore storage write failures and keep the workspace usable.
  }
}

export function mergeRecentWorkspaceSymbol(symbol: string, recentSymbols: string[]) {
  return uniqueSymbolList([symbol, ...recentSymbols]).slice(0, MAX_RECENT_SYMBOLS);
}
