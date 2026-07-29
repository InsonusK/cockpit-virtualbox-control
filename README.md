# VirtualBox Cockpit Plugin

Cockpit-плагин для управления VirtualBox VM через `VBoxManage`.

## Структура

```text
repo-root/
├── src/                        # Cockpit-пакет целиком
│   ├── app.js                  # оркестратор: загрузка partials + старт Alpine
│   ├── index.html              # каркас + <template> для runtime-шаблонов
│   ├── style.css
│   ├── manifest.json
│   ├── vendor/alpine.min.js    # локальная копия Alpine ESM (без CDN)
│   ├── client/
│   │   ├── parser.js           # чистые функции парсинга (покрыты тестами)
│   │   └── vboxClient.js       # обёртки над cockpit.spawn()
│   ├── components/
│   │   ├── loadPartial.js      # fetch + вставка partials
│   │   ├── utils.js            # утилиты UI-слоя
│   │   ├── app.js              # Alpine.data('app')
│   │   ├── vmCard.js           # Alpine.data('vmCard')
│   │   └── snapshotModal.js    # Alpine.store('snapshotModal')
│   └── partials/
│       ├── app.html            # шапка + список VM
│       ├── vm-card.html        # шаблон карточки VM (runtime-шаблон)
│       ├── vm-details.html     # шаблон деталей VM (runtime-шаблон)
│       └── snapshot-modal.html # модалка снапшотов
├── tests/parser.test.js
├── README.md
├── context.md
└── Virtualbox_plugin_alpine_migration_spec.md
```

## Технологии

- Alpine.js 3.x (локальная копия в `src/vendor/alpine.min.js`, без CDN и без build-шага).
- ES-модулы (`<script type="module" src="app.js">`).
- `cockpit.spawn()` для вызова `VBoxManage`.
- `node:test` для тестов.

## Быстрый цикл разработки

```bash
# Симлинк Cockpit-пакета в пользовательскую директорию Cockpit
ln -s "$(pwd)/src" ~/.local/share/cockpit/virtualbox
```

После этого правите файлы в `src/` и обновляете страницу в браузере (`Ctrl+Shift+R`).

## Про `cockpit.js`

`<script src="../base1/cockpit.js"></script>` в `src/index.html` — стандартное подключение к глобальному скрипту, который предоставляет сама среда Cockpit. В репозитории его нет, он появляется автоматически при разворачивании пакета в `~/.local/share/cockpit/virtualbox/`.

## Тестирование

```bash
node --test
```

В Node.js 24 с багом [nodejs/node#64555](https://github.com/nodejs/node/issues/64555) явный аргумент директории (`node --test tests/`) может падать с `MODULE_NOT_FOUND`. Без аргументов `node --test` корректно обнаруживает директорию `tests/` и запускает все тесты.

## Архитектура

- `src/client/parser.js` — чистые функции парсинга вывода `VBoxManage`. Единственный слой, покрытый unit-тестами.
- `src/client/vboxClient.js` — обёртки над `cockpit.spawn()`. Все вызовы идут с массивами аргументов, без конкатенации shell-строк.
- `src/components/*.js` — Alpine-компоненты (`Alpine.data` / `Alpine.store`), без HTML-строк внутри JS.
- `src/partials/*.html` — HTML-шаблоны. Карточка VM и детали VM загружаются как `<template>` до старта Alpine и клонируются в DOM через кастомную директиву `x-partial`.
- `src/app.js` — оркестратор: регистрирует компоненты и директиву `x-partial`, загружает партиалы, запускает Alpine.

## Как работают runtime-шаблоны

1. `index.html` содержит пустые `<template id="tpl-vm-card">` и `<template id="tpl-vm-details">`.
2. `app.js` загружает в них `partials/vm-card.html` и `partials/vm-details.html` до `Alpine.start()`.
3. В `app.html` список VM рендерится через `x-for`; каждый элемент получает `x-partial="tpl-vm-card"`, которая клонирует содержимое шаблона и вызывает `Alpine.initTree()`.
4. Внутри карточки детали VM подгружаются аналогично через `x-partial="tpl-vm-details"` только при раскрытии карточки (`x-if="!loadingDetails && details"`).
