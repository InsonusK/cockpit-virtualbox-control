# VirtualBox Cockpit Plugin

Cockpit-плагин для управления VirtualBox VM через `VBoxManage`.

## Структура

- `src/` — Cockpit-пакет целиком. Именно эта директория разворачивается в `~/.local/share/cockpit/virtualbox/` для разработки или копируется на сервер при деплое.
- `tests/` — unit-тесты для чистых функций парсинга (`node:test`).
- `Virtualbox_plugin_alpine_migration_spec.md` — постановка миграции на Alpine.js.
- `context.md` — контекст работы предыдущего агента.

## Технологии

- Alpine.js 3.x (локальная копия в `src/vendor/alpine.min.js`, без CDN).
- ES-модули (`<script type="module" src="app.js">`), без build-шага.
- `cockpit.spawn()` для вызова `VBoxManage`.
- `node:test` для тестов.

## Быстрый цикл разработки

```bash
# Симлинк Cockpit-пакета в пользовательскую директорию Cockpit
ln -s "$(pwd)/src" ~/.local/share/cockpit/virtualbox
```

После этого правите файлы в `src/` и обновляете страницу в браузере (`Ctrl+Shift+R`).

## Тестирование

```bash
node --test
```

В Node.js 24 с багом [nodejs/node#64555](https://github.com/nodejs/node/issues/64555) явный аргумент директории (`node --test tests/`) может падать с `MODULE_NOT_FOUND`. Без аргументов `node --test` корректно обнаруживает директорию `tests/` и запускает все тесты.

## Архитектура

- `src/client/parser.js` — чистые функции парсинга вывода `VBoxManage`. Единственный слой, покрытый unit-тестами.
- `src/client/vboxClient.js` — обёртки над `cockpit.spawn()`. Все вызовы идут с массивами аргументов, без конкатенации shell-строк.
- `src/components/*.js` — Alpine-компоненты (`Alpine.data` / `Alpine.store`), без HTML-строк внутри JS.
- `src/partials/*.html` — HTML-фрагменты, парные компонентам. Загружаются в DOM через `src/components/loadPartial.js` до старта Alpine.
- `src/app.js` — оркестратор: регистрирует компоненты, загружает партиалы, запускает Alpine.
