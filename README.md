# IPPD - Optativa 01

API em NestJS para cadastro de tarefas e livros, com os módulos `/tasks` e `/books`.
Os dois possuem GET, POST, PUT, PATCH e DELETE.

Os dados ficam em `data/tasks.json` e `data/books.json` e permanecem após reiniciar o servidor.

## Executar

```bash
npm install
npm run start:dev
```

A API fica disponível em `http://localhost:3000`.

## Testar

```bash
npm run test:api
```

Testa as rotas dos dois módulos e verifica se os dados permanecem após reiniciar o servidor.
