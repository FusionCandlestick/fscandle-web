import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createExportServer } from '../../scripts/serve-export.mjs';

test('serves exported routes and assets under a base path, with no filesystem escape', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'fscandle-export-'));
  const root = join(directory, 'out');
  await mkdir(root);
  await writeFile(join(root, 'index.html'), 'home');
  await writeFile(join(root, 'playground.html'), 'playground');
  await writeFile(join(root, 'app.js'), 'console.log(1)');
  await writeFile(join(directory, 'private.txt'), 'private');
  await symlink(join(directory, 'private.txt'), join(root, 'escape.txt'));
  const server = createExportServer(root, '/demo');
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    assert.equal(await (await fetch(origin + '/demo/')).text(), 'home');
    assert.equal(await (await fetch(origin + '/demo/playground')).text(), 'playground');
    assert.match((await fetch(origin + '/demo/app.js')).headers.get('content-type'), /javascript/);
    assert.equal((await fetch(origin + '/demo/playground', { method: 'HEAD' })).status, 200);
    assert.equal((await fetch(origin + '/demo/', { method: 'POST' })).status, 405);
    for (const path of ['/playground', '/demo/missing', '/demo/escape.txt', '/demo/%2e%2e%2fprivate.txt']) {
      assert.equal((await fetch(origin + path)).status, 404, path);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true });
  }
});
