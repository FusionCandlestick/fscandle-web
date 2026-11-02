export interface PersistedIndicator {
  id: string;
  name: string;
  newPane?: boolean;
  calcParams?: number[];
  formula?: string;
}

export interface WorkspaceState {
  watchlist: string[];
  panelSymbols: string[];
  recentSymbols: string[];
  activePanelIndex: number;
  panelCompareSymbols: string[][];
  panelIndicators: PersistedIndicator[][];
}

const WORKSPACE_STORAGE_KEY = "fscandle_workspace_state_v2";
const PANEL_COUNT = 4;
const DEFAULT_WATCHLIST = ["SPY", "QQQ", "BTC", "NVDA"];
const DEFAULT_PANEL_SYMBOLS = ["SPY", "QQQ", "BTC", "NVDA"];
const DEFAULT_COMPARE_SYMBOLS = [[], [], [], []];

const MAX_RECENT_SYMBOLS = 8;

const normalizeSymbol = (value: string) => value.trim().toUpperCase();

export const uniqueSymbolList = (symbols: string[]) => {
  return [...new Set(symbols.map(normalizeSymbol).filter(Boolean))];
};

const normalizePanelSymbols = (panelSymbols?: string[]) => {
  return DEFAULT_PANEL_SYMBOLS.map((fallback, index) =>
    normalizeSymbol(panelSymbols?.[index] ?? fallback) || fallback,
  );
};

const normalizePanelCompareSymbols = (panelCompareSymbols: string[][] | undefined, panelSymbols: string[]) => {
  return Array.from({ length: PANEL_COUNT }, (_, index) => {
    const source = panelCompareSymbols?.[index] ?? DEFAULT_COMPARE_SYMBOLS[index] ?? [];
    return uniqueSymbolList(source)
      .filter((symbol) => symbol !== panelSymbols[index])
      .slice(0, 5);
  });
};

const DEFAULT_PANEL_INDICATORS: PersistedIndicator[][] = [[], [], [], []];

const normalizePanelIndicators = (panelIndicators?: PersistedIndicator[][]): PersistedIndicator[][] => {
  return Array.from({ length: PANEL_COUNT }, (_, index) => {
    const list = panelIndicators?.[index];
    if (!Array.isArray(list)) return [];
    return list.filter((item): item is PersistedIndicator => Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' && !item.formula));
  });
};

export function createDefaultWorkspaceState(): WorkspaceState {
  return {
    watchlist: [...DEFAULT_WATCHLIST],
    panelSymbols: [...DEFAULT_PANEL_SYMBOLS],
    recentSymbols: [DEFAULT_PANEL_SYMBOLS[0]],
    activePanelIndex: 0,
    panelCompareSymbols: DEFAULT_COMPARE_SYMBOLS.map((symbols) => [...symbols]),
    panelIndicators: DEFAULT_PANEL_INDICATORS.map((items) => [...items]),
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
    panelIndicators: normalizePanelIndicators(state?.panelIndicators),
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
