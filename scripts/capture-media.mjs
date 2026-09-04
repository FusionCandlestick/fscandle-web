// Captures the README/release media: one still per public route plus a short
// screen recording of a drawing interaction on /playground.
//
//   npm run build && node scripts/capture-media.mjs
//
// Stills land in docs/assets/. The recording is written as .webm and converted
// to .gif when an ffmpeg binary is available (Playwright ships one); without it
// the .webm is kept and the conversion is skipped with a warning.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, devices } from '@playwright/test';

const PORT = 3108;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const root = resolve(import.meta.dirname, '..');
const assets = resolve(root, 'docs/assets');
const videoDir = resolve(root, '.media-tmp');

const waitForCanvas = async page => {
  await page.waitForSelector('canvas');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('canvas')].some(canvas => canvas.width > 0 && canvas.height > 0),
  );
  // Let the first paint and any entrance animation settle before the shutter.
  await page.waitForTimeout(1200);
};

const largestCanvasRect = page =>
  page.locator('canvas').evaluateAll(canvases => {
    const largest = canvases
      .map(canvas => {
        const rect = canvas.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, area: rect.width * rect.height };
      })
      .sort((a, b) => b.area - a.area)[0];
    if (!largest) throw new Error('no canvas found');
    return largest;
  });

const startServer = async () => {
  const server = spawn('npx', ['next', 'start', '--hostname', '127.0.0.1', '--port', String(PORT)], {
    cwd: root,
    stdio: 'ignore',
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return server;
    } catch {
      // server not up yet
    }
    await new Promise(done => setTimeout(done, 500));
  }
  server.kill();
  throw new Error(`production server did not come up on ${BASE_URL}; run "npm run build" first`);
};

const captureStills = async browser => {
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // The homepage opens on a text hero, so scroll the first live chart into view
  // before the shutter: a screenshot of a charting library has to show a chart.
  for (const [route, name, scrollToChart] of [['/', 'home', true], ['/playground', 'playground', false]]) {
    await page.goto(`${BASE_URL}${route}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForCanvas(page);
    if (scrollToChart) {
      await page.locator('canvas').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
    }
    await page.screenshot({ path: resolve(assets, `${name}.png`) });
    console.log(`  captured docs/assets/${name}.png`);
  }

  await context.close();
};

const captureDrawingClip = async browser => {
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/playground`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForCanvas(page);

  const rect = await largestCanvasRect(page);
  const at = (x, y) => [rect.left + rect.width * x, rect.top + rect.height * y];

  await page.getByRole('button', { name: 'Drawings', exact: true }).click();
  await page.waitForTimeout(600);
  await page.getByTestId('drawing-menu').locator('[data-drawing-tool="line:segment"]').click();
  await page.waitForTimeout(400);

  // Draw a trend line, then let the crosshair sweep across it.
  await page.mouse.click(...at(0.25, 0.35));
  await page.mouse.move(...at(0.55, 0.55), { steps: 30 });
  await page.mouse.click(...at(0.55, 0.55));
  await page.waitForTimeout(600);
  await page.mouse.move(...at(0.8, 0.3), { steps: 40 });
  await page.waitForTimeout(800);

  // Then a four-point ABCD wave, which shows the multi-step drawing model.
  await page.getByRole('button', { name: 'Drawings', exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByTestId('drawing-menu').locator('[data-drawing-tool="wave:abcd"]').click();
  for (const point of [[0.22, 0.56], [0.36, 0.34], [0.51, 0.62], [0.67, 0.38]]) {
    await page.mouse.move(...at(...point), { steps: 20 });
    await page.mouse.click(...at(...point));
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1200);

  await context.close();

  const recorded = readdirSync(videoDir).find(file => file.endsWith('.webm'));
  if (!recorded) throw new Error('playwright produced no recording');
  const webm = resolve(assets, 'playground-drawing.webm');
  renameSync(resolve(videoDir, recorded), webm);
  rmSync(videoDir, { recursive: true, force: true });
  console.log('  captured docs/assets/playground-drawing.webm');
  return webm;
};

// Playwright bundles an ffmpeg build for video capture, but it is stripped down
// and carries no GIF muxer — so only a full system ffmpeg can do the conversion.
const findFfmpeg = () => {
  const probe = spawnSync('ffmpeg', ['-hide_banner', '-muxers'], { encoding: 'utf8' });
  if (probe.status === 0 && probe.stdout.includes(' gif')) return 'ffmpeg';
  return null;
};

const convertToGif = async webm => {
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) {
    console.warn('  no ffmpeg with GIF support on PATH; keeping the .webm only.');
    console.warn('  install one (macOS: brew install ffmpeg) and re-run to also produce the GIF.');
    return;
  }
  const gif = resolve(assets, 'playground-drawing.gif');
  // Two-pass palette so the gradients in the chart chrome do not band.
  const palette = resolve(videoDir, 'palette.png');
  mkdirSync(videoDir, { recursive: true });
  const run = args =>
    new Promise((done, fail) => {
      const child = spawn(ffmpeg, args, { stdio: 'ignore' });
      child.on('exit', code => (code === 0 ? done() : fail(new Error(`ffmpeg exited ${code}`))));
      child.on('error', fail);
    });
  const filters = 'fps=12,scale=1000:-1:flags=lanczos';
  await run(['-y', '-i', webm, '-vf', `${filters},palettegen=stats_mode=diff`, palette]);
  await run(['-y', '-i', webm, '-i', palette, '-lavfi', `${filters}[x];[x][1:v]paletteuse=dither=bayer`, gif]);
  rmSync(videoDir, { recursive: true, force: true });
  console.log('  captured docs/assets/playground-drawing.gif');
};

mkdirSync(assets, { recursive: true });
rmSync(videoDir, { recursive: true, force: true });
console.log(`starting production server on ${BASE_URL}`);
const server = await startServer();
const browser = await chromium.launch();
try {
  await captureStills(browser);
  const webm = await captureDrawingClip(browser);
  await convertToGif(webm);
} finally {
  await browser.close();
  server.kill();
  rmSync(videoDir, { recursive: true, force: true });
}
console.log('media capture complete');
