/**
 * Browser frame-rate and heap benchmark for the real renderer.
 *
 * `chart-engine-benchmark.mjs` measures the data structures in Node — useful,
 * but it never paints. This one drives the running app in Chromium and measures
 * what a user actually feels: frame intervals while panning and zooming, and JS
 * heap growth across the interaction.
 *
 *   npm run build && node tests/performance/browser-frame-benchmark.mjs
 *
 * It fails on regressions against the thresholds below rather than only
 * printing numbers, so it can run as a gate. Thresholds are deliberately loose:
 * this is a smoke test for "the renderer collapsed", not a precision instrument,
 * and CI hardware varies. Treat a failure as "look at it", not "revert".
 */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = 3109;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/** A dropped-frame budget rather than an average: stutter is what users notice. */
const THRESHOLDS = {
  /** Median frame interval, ms. 60fps is 16.7ms; allow well past that. */
  medianFrameMs: 34,
  /** 95th percentile frame interval, ms. */
  p95FrameMs: 90,
  /** Heap growth across the whole interaction, MB. Catches per-frame leaks. */
  heapGrowthMb: 60,
};

const startServer = async () => {
  const server = spawn('npx', ['next', 'start', '--hostname', '127.0.0.1', '--port', String(PORT)], {
    stdio: 'ignore',
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(BASE_URL)).ok) return server;
    } catch {
      // not up yet
    }
    await new Promise(done => setTimeout(done, 500));
  }
  server.kill();
  throw new Error(`server did not start on ${BASE_URL}; run "npm run build" first`);
};

const percentile = (sorted, fraction) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];

const heapMb = async page =>
  page.evaluate(() => {
    const memory = performance.memory;
    return memory ? memory.usedJSHeapSize / 1024 / 1024 : null;
  });

const server = await startServer();
const browser = await chromium.launch({ args: ['--enable-precise-memory-info'] });
let failures = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE_URL}/playground`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('canvas')].some(canvas => canvas.width > 0 && canvas.height > 0),
  );
  await page.waitForTimeout(1500);

  const heapBefore = await heapMb(page);

  // Record frame intervals in the page while the interaction runs here.
  await page.evaluate(() => {
    window.__frameIntervals = [];
    let previous = performance.now();
    const tick = now => {
      window.__frameIntervals.push(now - previous);
      previous = now;
      window.__frameHandle = requestAnimationFrame(tick);
    };
    window.__frameHandle = requestAnimationFrame(tick);
  });

  const rect = await page.locator('canvas').evaluateAll(canvases => {
    const largest = canvases
      .map(canvas => {
        const box = canvas.getBoundingClientRect();
        return { left: box.left, top: box.top, width: box.width, height: box.height, area: box.width * box.height };
      })
      .sort((a, b) => b.area - a.area)[0];
    if (!largest) throw new Error('no canvas');
    return largest;
  });
  const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

  // Pan: press and drag across the chart, several sweeps.
  await page.mouse.move(centre.x, centre.y);
  await page.mouse.down();
  for (let sweep = 0; sweep < 4; sweep += 1) {
    await page.mouse.move(centre.x - rect.width * 0.3, centre.y, { steps: 25 });
    await page.mouse.move(centre.x + rect.width * 0.3, centre.y, { steps: 25 });
  }
  await page.mouse.up();

  // Zoom: wheel in and out over the chart.
  for (let step = 0; step < 30; step += 1) {
    await page.mouse.wheel(0, step % 2 === 0 ? -120 : 120);
    await page.waitForTimeout(8);
  }

  // Crosshair: continuous hover, the most frequent repaint path.
  for (let step = 0; step < 40; step += 1) {
    await page.mouse.move(rect.left + (rect.width * step) / 40, centre.y + Math.sin(step / 4) * 80);
  }

  const intervals = await page.evaluate(() => {
    cancelAnimationFrame(window.__frameHandle);
    return window.__frameIntervals;
  });
  const heapAfter = await heapMb(page);

  // Drop the first few frames: they include layout settling, not interaction.
  const sorted = intervals.slice(5).sort((a, b) => a - b);
  if (sorted.length < 30) throw new Error(`only ${sorted.length} frames recorded; interaction did not run`);

  const median = percentile(sorted, 0.5);
  const p95 = percentile(sorted, 0.95);
  const growth = heapBefore !== null && heapAfter !== null ? heapAfter - heapBefore : null;

  console.log(JSON.stringify({
    frames: sorted.length,
    medianFrameMs: Number(median.toFixed(2)),
    p95FrameMs: Number(p95.toFixed(2)),
    approxFps: Number((1000 / median).toFixed(1)),
    heapBeforeMb: heapBefore === null ? null : Number(heapBefore.toFixed(1)),
    heapAfterMb: heapAfter === null ? null : Number(heapAfter.toFixed(1)),
    heapGrowthMb: growth === null ? null : Number(growth.toFixed(1)),
  }, null, 2));

  if (median > THRESHOLDS.medianFrameMs) {
    failures.push(`median frame ${median.toFixed(1)}ms exceeds ${THRESHOLDS.medianFrameMs}ms`);
  }
  if (p95 > THRESHOLDS.p95FrameMs) {
    failures.push(`p95 frame ${p95.toFixed(1)}ms exceeds ${THRESHOLDS.p95FrameMs}ms`);
  }
  if (growth !== null && growth > THRESHOLDS.heapGrowthMb) {
    failures.push(`heap grew ${growth.toFixed(1)}MB, over ${THRESHOLDS.heapGrowthMb}MB`);
  }
  if (growth === null) {
    console.warn('performance.memory unavailable; heap growth not checked');
  }
} finally {
  await browser.close();
  server.kill();
}

if (failures.length > 0) {
  console.error(`\nbrowser frame benchmark failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('\nbrowser frame benchmark passed');
