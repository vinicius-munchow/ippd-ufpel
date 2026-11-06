import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

test(
  'CRUD dos dois módulos e persistência após reiniciar o processo',
  { timeout: 30000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nest-crud-'));
    await mkdir(join(directory, 'data'));
    for (const name of ['tasks', 'books'])
      await writeFile(join(directory, 'data', name + '.json'), '[]');
    const entry = resolve('dist/main.js');
    const socket = createServer();
    socket.listen(0, '127.0.0.1');
    await once(socket, 'listening');
    const port = socket.address().port;
    await new Promise((resolve) => socket.close(resolve));
    const base = 'http://127.0.0.1:' + port;
    let child;
    let logs = '';
    async function start() {
      child = spawn(process.execPath, [entry], {
        cwd: directory,
        env: { ...process.env, PORT: String(port) },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
      child.stdout.on('data', (chunk) => {
        logs += chunk;
      });
      child.stderr.on('data', (chunk) => {
        logs += chunk;
      });
      for (let attempt = 0; attempt < 100; attempt++) {
        if (child.exitCode !== null) throw new Error(logs);
        try {
          if ((await fetch(base)).ok) return;
        } catch {}
        await delay(50);
      }
      throw new Error('Servidor não iniciou: ' + logs);
    }
    async function stop() {
      if (child && child.exitCode === null) {
        const exited = once(child, 'exit');
        child.kill();
        await exited;
      }
    }
    async function call(method, path, body, status = 200) {
      const response = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      assert.equal(response.status, status, method + ' ' + path);
      const text = await response.text();
      return text ? JSON.parse(text) : undefined;
    }
    try {
      await start();
      const records = [];
      for (const [name, initial, defaults, replacement, patch] of [
        [
          'tasks',
          { descricao: 'Estudar NestJS', inicio: 1, fim: 10 },
          { status: 'PENDENTE', resultado: null },
          {
            descricao: 'Entregar trabalho',
            inicio: 2,
            fim: 20,
            status: 'EM_ANDAMENTO',
            resultado: null,
          },
          { status: 'CONCLUIDA', resultado: [2, 3, 5] },
        ],
        [
          'books',
          { titulo: 'Dom Casmurro', autor: 'Machado de Assis', paginas: 256 },
          { lido: false },
          {
            titulo: 'Memorias Postumas',
            autor: 'Machado de Assis',
            paginas: 320,
            lido: false,
          },
          { lido: true },
        ],
      ]) {
        const path = '/' + name;
        assert.deepEqual(await call('GET', path), []);
        const created = await call('POST', path, initial, 201);
        assert.deepEqual(created, { ...initial, ...defaults, id: created.id });
        assert.deepEqual(await call('GET', path + '/' + created.id), created);
        assert.deepEqual(await call('GET', path), [created]);
        const replaced = await call(
          'PUT',
          path + '/' + created.id,
          replacement,
        );
        assert.deepEqual(replaced, { ...replacement, id: created.id });
        const updated = await call('PATCH', path + '/' + created.id, patch);
        assert.deepEqual(updated, { ...replaced, ...patch });
        assert.equal(typeof created.id, 'number');
        await call('GET', path + '/abc', undefined, 400);
        await call('GET', path + '/999999', undefined, 404);
        await call('PUT', path + '/999999', replacement, 404);
        await call('PATCH', path + '/999999', patch, 404);
        await call('DELETE', path + '/999999', undefined, 404);
        assert.deepEqual(
          JSON.parse(
            await readFile(join(directory, 'data', name + '.json'), 'utf8'),
          ),
          [updated],
        );
        records.push({ path, updated });
      }
      await stop();
      await start();
      for (const { path, updated } of records) {
        assert.deepEqual(await call('GET', path + '/' + updated.id), updated);
        assert.deepEqual(await call('GET', path), [updated]);
        await call('DELETE', path + '/' + updated.id, undefined, 200);
        await call('GET', path + '/' + updated.id, undefined, 404);
      }
      await stop();
      await start();
      for (const { path } of records)
        assert.deepEqual(await call('GET', path), []);
    } finally {
      await stop();
      await rm(directory, { recursive: true, force: true });
    }
  },
);
