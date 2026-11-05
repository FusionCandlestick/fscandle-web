"use client";

import { useEffect, useRef, useState } from 'react';
import { Search, Star, X, Plus, Blocks, Code2, Check } from 'lucide-react';
import { pluginTemplates } from './indicatorPlugins';

type Entry = { id: string; name: string; category: string; desc: string; defaultParams: string };
const defaults = ['MA', 'EMA', 'BOLL', 'RSI', 'MACD'];
const packages = [
  { name: 'Trend & momentum', desc: 'Trend direction, momentum and trailing price levels.', ids: ['EMA', 'MACD', 'PSAR'] },
  { name: 'Volatility & reversion', desc: 'Price bands, relative strength and trading range.', ids: ['BOLL', 'RSI', 'ATR'] },
  { name: 'Volume & momentum', desc: 'Volume accumulation, average volume and stochastic momentum.', ids: ['OBV', 'VOLMA', 'KDJ'] },
  { name: 'Momentum extremes', desc: 'Compare three complementary momentum oscillators.', ids: ['WR', 'CCI', 'STOCHRSI'] },
  { name: 'Channels & trend', desc: 'Price channels, trend flips and the Ichimoku cloud.', ids: ['DC', 'KC', 'SUPERTREND', 'ICHIMOKU'] },
];

export function IndicatorLibraryModal({ catalog, onClose, onAdd }: {
  catalog: Entry[]; onClose: () => void; onAdd: (names: string[]) => void;
}) {
  const [tab, setTab] = useState<'all' | 'favorites' | 'formulas' | 'popular'>('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('fscandle.indicatorFavorites') ?? 'null');
      if (Array.isArray(stored)) return [...new Set(stored.filter((id): id is string => typeof id === 'string' && catalog.some(item => item.id === id)))];
    } catch { /* Defaults work when storage is unavailable. */ }
    return defaults;
  });
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    input.current?.focus();
    return () => previous?.focus();
  }, [catalog]);
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(value => value !== id) : [...favorites, id];
    setFavorites(next);
    try { localStorage.setItem('fscandle.indicatorFavorites', JSON.stringify(next)); } catch { /* Optional persistence. */ }
  };
  const add = (ids: string[], name: string) => {
    try { onAdd(ids); setNotice(`Added ${name}`); }
    catch { setNotice(`Could not add ${name}. Please try again.`); }
  };
  const matches = (value: string) => value.toLowerCase().includes(search.trim().toLowerCase());
  const entries = tab === 'formulas'
    ? pluginTemplates.map(template => ({ id: template.shortName, name: template.name, category: 'plugin', defaultParams: 'Price measures · v1.0', desc: template.shortName === 'CANDLE_RANGE' ? 'High − low, in price units.' : 'Close within the candle range (0–100). Flat candles return 50.' }))
    : catalog.filter(item => tab !== 'favorites' || favorites.includes(item.id));
  const filtered = entries.filter(item => matches(`${item.id} ${item.name} ${item.desc}`));
  const bundles = packages.filter(item => matches(`${item.name} ${item.desc} ${item.ids.join(' ')}`));
  return (
    <div data-testid="indicator-modal-overlay" className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="indicator-library-title" className="flex h-[650px] max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--popover-bg)] text-[var(--text-main)] shadow-2xl" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
        if (event.key === 'Tab') {
          const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input');
          const first = controls?.[0], last = controls?.[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
        <header className="flex items-start justify-between px-6 pb-4 pt-5">
          <div><h2 id="indicator-library-title" className="text-lg font-semibold tracking-tight">Indicators & Strategies</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Technical indicators and modular chart packages</p></div>
          <button type="button" aria-label="Close indicators" onClick={onClose} className="rounded-md p-2 hover:bg-[var(--control-hover-bg)]"><X size={18}/></button>
        </header>
        <div className="px-6">
          <label className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--control-bg)] px-3 focus-within:border-blue-500"><Search size={17} className="text-[var(--text-muted)]"/><input ref={input} aria-label="Search indicators" placeholder="Search indicators, plugins or packages…" value={search} onChange={event => setSearch(event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"/>{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={14}/></button>}</label>
          <nav aria-label="Indicator categories" className="flex flex-wrap gap-1 py-3">
            {([{ id: 'favorites', label: 'Favorites', icon: Star }, { id: 'formulas', label: 'Custom Formulas', icon: Code2 }, { id: 'popular', label: 'Popular Packages', icon: Blocks }] as const).map(item => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => { setTab(tab === item.id ? 'all' : item.id); setNotice(''); }} className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${tab === item.id ? 'bg-blue-500/15 text-blue-500' : 'text-[var(--text-muted)] hover:bg-[var(--control-hover-bg)]'}`}><item.icon size={14}/>{item.label}{item.id === 'favorites' && <span className="rounded bg-[var(--control-bg)] px-1.5 py-0.5 tabular-nums">{favorites.length}</span>}</button>)}
          </nav>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--border)] px-6 py-3">
          {tab === 'formulas' && <p className="mb-3 rounded-lg bg-[var(--control-bg)] p-3 text-xs leading-relaxed text-[var(--text-muted)]">Formula editor retired. These compiled indicator plugins use the chart’s plugin API. Add each independently; remove it from its chart legend.</p>}
          <div className="mb-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]"><span>{tab === 'popular' ? 'Curated packages' : tab === 'formulas' ? 'Plugin indicators' : tab === 'favorites' ? 'Saved indicators' : 'Indicator library'}</span><span>{tab === 'popular' ? bundles.length : filtered.length} results</span></div>
          {tab === 'popular' ? bundles.map(bundle => <div key={bundle.name} className="mb-3 rounded-lg border border-[var(--border)] p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium">{bundle.name}</h3><button type="button" aria-label={`Add ${bundle.name}`} onClick={() => add(bundle.ids, bundle.name)} className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white"><Plus size={13}/>Add package</button></div><p className="mt-2 text-xs text-[var(--text-muted)]">{bundle.desc}</p><p className="mt-3 text-xs font-mono text-blue-400">{bundle.ids.join(' · ')}</p></div>) : filtered.map(item => <div key={item.id} className="group flex items-center gap-3 border-b border-[var(--border)] py-3">
            {tab !== 'formulas' && <button type="button" aria-label={`${favorites.includes(item.id) ? 'Unfavorite' : 'Favorite'} ${item.id}`} aria-pressed={favorites.includes(item.id)} onClick={() => toggleFavorite(item.id)} className="shrink-0 rounded p-1.5 hover:bg-[var(--control-hover-bg)]"><Star size={15} className={favorites.includes(item.id) ? 'fill-amber-400 text-amber-400' : 'text-[var(--text-muted)]'}/></button>}
            <button type="button" aria-label={`Add ${item.id}`} onClick={() => add([item.id], item.name)} className="flex min-w-0 flex-1 items-center gap-3 rounded text-left focus-visible:outline-blue-500"><div className="min-w-0 flex-1"><div className="text-sm font-medium">{item.name}<span className="ml-2 text-[10px] font-normal text-[var(--text-muted)]">{item.id}</span></div><p className="mt-1 truncate text-xs text-[var(--text-muted)]">{item.desc}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{item.defaultParams}</p></div><span className="hidden text-[10px] text-[var(--text-muted)] sm:block">{item.category === 'overlay' ? 'Main chart' : 'Subpane'}</span><Plus size={16} className="shrink-0 text-blue-500"/></button>
          </div>)}
          {(tab === 'popular' ? bundles.length : filtered.length) === 0 && <div className="py-16 text-center text-sm text-[var(--text-muted)]">{tab === 'favorites' && !search ? 'No favorites yet. Toggle Favorites off to explore the library.' : 'No matches. Try another name or symbol.'}</div>}
        </div>
        <footer className="flex min-h-11 items-center gap-2 border-t border-[var(--border)] px-6 py-3 text-xs text-[var(--text-muted)]" role="status" aria-live="polite">{notice ? <><Check size={14} className="text-blue-500"/>{notice}</> : 'Click an indicator to add it to the active chart.'}</footer>
      </div>
    </div>
  );
}
