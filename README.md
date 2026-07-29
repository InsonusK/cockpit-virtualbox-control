# VirtualBox Cockpit Plugin

Cockpit-плагин для управления VirtualBox VM через `VBoxManage`.

## Структура

```text
repo-root/
├── src/                        # Cockpit-пакет целиком
│   ├── app.js                  # оркестратор: загрузка partials + старт Alpine
│   ├── index.html              # каркас страницы
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
├── tests/
│   ├── parser.test.js          # unit-тесты парсера VBoxManage
│   ├── vboxClient.test.js      # моки cockpit.spawn
│   ├── components.test.js      # моки cockpit + Alpine-компоненты
│   └── loadPartial.test.js     # моки fetch + document
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

Запускает все тесты из директории `tests/`:

- `parser.test.js` — unit-тесты чистых функций парсинга.
- `vboxClient.test.js` — мокирование `cockpit.spawn()`, проверка аргументов и валидации.
- `components.test.js` — моки `cockpit` и минимальный стаб Alpine.js для проверки логики компонентов.
- `loadPartial.test.js` — моки `fetch()` и `document` для механизма подгрузки партиалов.

В Node.js 24 с багом [nodejs/node#64555](https://github.com/nodejs/node/issues/64555) явный аргумент директории (`node --test tests/`) может падать с `MODULE_NOT_FOUND`. Без аргументов `node --test` корректно обнаруживает директорию `tests/` и запускает все тесты.

## Архитектура

- `src/client/parser.js` — чистые функции парсинга вывода `VBoxManage`.
- `src/client/vboxClient.js` — обёртки над `cockpit.spawn()`. Все вызовы идут с массивами аргументов, без конкатенации shell-строк. Покрыт мок-тестами через подмену глобального `cockpit`.
- `src/components/*.js` — Alpine-компоненты (`Alpine.data` / `Alpine.store`), без HTML-строк внутри JS. Логика компонентов покрыта мок-тестами без реального DOM и браузера.
- `src/partials/*.html` — HTML-шаблоны компонентов. Вложенные шаблоны (карточка и детали VM) подключаются через `<x-include src="...">` и разрешаются `loadPartial` до старта Alpine. Механизм `loadPartial` покрыт мок-тестами через подмену `fetch` и `document`.
- `src/app.js` — оркестратор: регистрирует компоненты, загружает партиалы, запускает Alpine.

## Как работают partials

1. `loadPartial(path, targetSelector)` загружает HTML-фрагмент по `fetch`.
2. Перед вставкой в DOM рекурсивно разрешаются все `<x-include src="partials/...">` внутри фрагмента.
3. `app.js` загружает `partials/app.html` в `#app` и `partials/snapshot-modal.html` в `#modal-container` до вызова `Alpine.start()`.
4. `partials/app.html` использует `<x-include src="partials/vm-card.html">` внутри `x-for`; карточка, в свою очередь, включает `partials/vm-details.html` для раскрываемой панели деталей.
5. Таким образом к моменту старта Alpine в DOM уже находится полная разметка, и ручной вызов `Alpine.initTree()` не требуется.
