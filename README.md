# VirtualBox Cockpit Plugin

Cockpit-плагин для управления VirtualBox VM через `VBoxManage`.

## Структура

```text
repo-root/
├── src/                         # TypeScript-исходники Cockpit-пакета
│   ├── app.ts                   # оркестратор: загрузка partials + старт Alpine
│   ├── index.html               # каркас страницы
│   ├── style.css
│   ├── manifest.json
│   ├── vendor/
│   │   ├── alpine.min.js        # локальная копия Alpine ESM (без CDN)
│   │   └── alpine.min.d.ts      # типы для вендорной копии Alpine
│   ├── types/cockpit.d.ts       # ambient-тип глобала `cockpit`
│   ├── client/
│   │   ├── types.ts             # общие интерфейсы (Vm, VmDetails, ...)
│   │   ├── parser.ts            # чистые функции парсинга (покрыты тестами)
│   │   └── vboxClient.ts        # обёртки над cockpit.spawn()
│   ├── tools/
│   │   ├── loadPartial.ts       # fetch + вставка partials
│   │   └── utils.ts             # утилиты UI-слоя
│   ├── components/
│   │   ├── app/app.ts           # Alpine.data('app')
│   │   ├── vm-card/vm-card.ts   # Alpine.data('vmCard')
│   │   └── snapshot-modal/snapshot-modal.ts # Alpine.store('snapshotModal')
│   └── partials/
│       ├── app.html             # шапка + список VM
│       ├── vm-card.html         # шаблон карточки VM (runtime-шаблон)
│       ├── vm-details.html      # шаблон деталей VM (runtime-шаблон)
│       └── snapshot-modal.html  # модалка снапшотов
├── tests/
│   ├── parser.test.ts           # unit-тесты парсера VBoxManage
│   ├── mediumParser.test.ts     # unit-тесты парсера реальных выводов VBoxManage
│   ├── vboxClient.test.ts       # моки cockpit.spawn
│   ├── components.test.ts       # моки cockpit + Alpine-компоненты
│   └── loadPartial.test.ts      # моки fetch + document
├── scripts/copy-static.js       # копирует статику (html/css/json/vendor) в dist/ при сборке
├── tsconfig.json
├── package.json
├── README.md
├── context.md
└── Virtualbox_plugin_alpine_migration_spec.md
```

`dist/` — результат `npm run build`, в репозитории не хранится (см. `.gitignore`). Ветка `master` содержит только его: именно из неё Cockpit устанавливает плагин, и именно туда автоматически публикуется скомпилированный JS после мержа релизного PR (см. `.github/workflows/release-master.yml`) — руками эту ветку не редактируют.

## Технологии

- TypeScript — компилируется `tsc` в обычные ES-модули файл-в-файл, без бандлера: Cockpit грузит `<script type="module">` с относительными импортами как есть, поэтому браузер должен получать ровно ту же файловую раскладку, что и раньше.
- Alpine.js 3.x (локальная копия в `src/vendor/alpine.min.js`, без CDN).
- `cockpit.spawn()` для вызова `VBoxManage`.
- `node:test` для тестов — Node исполняет `.ts` напрямую (нативный type-stripping в Node 24+), поэтому тесты не требуют сборки.

## Быстрый цикл разработки

```bash
npm install
npx tsc --watch          # пересобирает src/**/*.ts -> dist/ при изменениях
# Симлинк собранного пакета в пользовательскую директорию Cockpit
ln -s "$(pwd)/dist" ~/.local/share/cockpit/virtualbox
```

Cockpit не умеет исполнять `.ts` — правите файлы в `src/`, `tsc --watch` пересобирает их в `dist/`, обновляете страницу в браузере (`Ctrl+Shift+R`). Разовая сборка: `npm run build`.

## Про `cockpit.js`

`<script src="../base1/cockpit.js"></script>` в `src/index.html` — стандартное подключение к глобальному скрипту, который предоставляет сама среда Cockpit. В репозитории его нет, он появляется автоматически при разворачивании пакета в `~/.local/share/cockpit/virtualbox/`. Тип глобала `cockpit` для TypeScript объявлен вручную в `src/types/cockpit.d.ts` — минимальный набор методов, которым реально пользуется `vboxClient.ts`.

## Тестирование

```bash
node --test
# или
npm test
```

Запускает все тесты из директории `tests/`:

- `tests/client/integration/listVms.test.ts` — парсинг вывода `VBoxManage list vms` в модели VirtualBox.
- `tests/client/integration/listHdds.test.ts` — парсинг вывода `VBoxManage list hdds`.
- `tests/client/integration/listDvds.test.ts` — парсинг вывода `VBoxManage list dvds`.
- `tests/client/integration/getVmInfo.test.ts` — парсинг `VBoxManage showvminfo --machinereadable` в `VBoxVmInfo`.
- `tests/client/integration/getVmInfoHuman.test.ts` — парсинг shared folders из человекочитаемого `showvminfo`.
- `tests/client/integration/controlVm.test.ts` — валидация и вызов `controlvm`.
- `tests/client/integration/startVm.test.ts` — валидация и вызов `startvm`.
- `tests/client/integration/listSnapshots.test.ts` — парсинг `VBoxManage snapshot list` и обработка отсутствия снапшотов.
- `tests/client/integration/takeSnapshot.test.ts` — валидация и вызов `snapshot take`.
- `tests/client/integration/restoreSnapshot.test.ts` — валидация и вызов `snapshot restore`.
- `tests/client/integration/vbox.test.ts` — мокирование базового `vbox()` и проверка опций `cockpit.spawn()`.
- `tests/client/listVms.test.ts` — маппинг VM-модели VirtualBox в модель приложения.
- `tests/client/getVmState.test.ts` — маппинг состояния VM в строку приложения.
- `tests/client/getVmDetails.test.ts` — маппинг деталей VM в `VmDetails`.
- `tests/client/controlVm.test.ts` — маппинг результата `controlvm`.
- `tests/client/startVm.test.ts` — маппинг результата `startvm`.
- `tests/client/listSnapshots.test.ts` — маппинг списка снапшотов в имена.
- `tests/client/takeSnapshot.test.ts` — маппинг результата `snapshot take`.
- `tests/client/restoreSnapshot.test.ts` — маппинг результата `snapshot restore`.
- `tests/components.test.ts` — моки `cockpit` и минимальный стаб Alpine.js для проверки логики компонентов.
- `tests/loadPartial.test.ts` — моки `fetch()` и `document` для механизма подгрузки партиалов.

В Node.js 24 с багом [nodejs/node#64555](https://github.com/nodejs/node/issues/64555) явный аргумент директории (`node --test tests/`) может падать с `MODULE_NOT_FOUND`. Без аргументов `node --test` корректно обнаруживает директорию `tests/` и запускает все тесты.

`npm run typecheck` (`tsc --noEmit`) проверяет типы без генерации `dist/`.

## Архитектура

- `src/client/integration/` — слой интеграции с VirtualBox. Каждый файл содержит ровно один публичный метод, который вызывает `VBoxManage` и превращает строковый ответ в типизированную модель VirtualBox (`VBoxVm`, `VBoxVmInfo`, `VBoxMedium`, ...). Внутри метода два блока: вызов `VBoxManage` и маппинг строки ответа в объект. Если API изменится или появится другой виртуализатор (VMware, libvirt), достаточно переписать или расширить этот слой.
- `src/client/model/` — модели данных, удобные приложению (`Vm`, `VmDetails`, `NetworkAdapter`, `MediaItem`, `UsbFilter`, `SharedFolder`).
- `src/client/*.ts` — слой клиента. Каждый файл содержит один публичный метод, удобный приложению. Метод вызывает один или несколько методов из `src/client/integration/` и преобразует их ответ в модели приложения. Компоненты не думают о формате VirtualBox — они получают уже готовые модели.
- `src/components/**/*.ts` — Alpine-компоненты (`Alpine.data` / `Alpine.store`), без HTML-строк внутри TS. Используют только методы и модели из `src/client/`. Логика компонентов покрыта мок-тестами без реального DOM и браузера.
- `src/partials/*.html` — HTML-шаблоны компонентов. Вложенные шаблоны (карточка и детали VM) подключаются через `<x-include src="...">` и разрешаются `loadPartial` до старта Alpine. Механизм `loadPartial` покрыт мок-тестами через подмену `fetch` и `document`.
- `src/app.ts` — оркестратор: регистрирует компоненты, загружает партиалы, запускает Alpine.

Внутримодульные импорты пишутся с реальным расширением `.ts` (например `import { formatFlag } from "../../tools/utils.ts"`) — так Node может исполнять исходники напрямую без сборки (тесты), а `tsc` при компиляции сам переписывает `.ts` на `.js` в `dist/` (опция `rewriteRelativeImportExtensions`), давая браузеру корректные относительные пути. Единственное исключение — импорт вендорного `vendor/alpine.min.js`: это готовый JS-файл, а не TS-исходник, поэтому его импортируют с `.js` как есть; типы для него берутся из соседнего `alpine.min.d.ts`.

## Как работают partials

1. `loadPartial(path, targetSelector)` загружает HTML-фрагмент по `fetch`.
2. Перед вставкой в DOM рекурсивно разрешаются все `<x-include src="partials/...">` внутри фрагмента.
3. `app.ts` загружает `partials/app.html` в `#app` и `partials/snapshot-modal.html` в `#modal-container` до вызова `Alpine.start()`.
4. `partials/app.html` использует `<x-include src="partials/vm-card.html">` внутри `x-for`; карточка, в свою очередь, включает `partials/vm-details.html` для раскрываемой панели деталей.
5. Таким образом к моменту старта Alpine в DOM уже находится полная разметка, и ручной вызов `Alpine.initTree()` не требуется.

## Релиз в `master`

`master` — защищённая ветка, принимает изменения только через PR, и содержит исключительно скомпилированный JS + статику (тот же плоский набор файлов, что Cockpit ожидает в `~/.local/share/cockpit/virtualbox`). TypeScript-исходники в `master` не попадают.

После мержа релизного PR в `master` workflow `.github/workflows/release-master.yml` собирает `npm run build` и коммитит содержимое `dist/` поверх дерева ветки от имени бота — обычным пушем (без `--force`), используя PAT, добавленный в список исключений (bypass) для правила "только через PR". Это разовая ручная настройка репозитория, которую нужно сделать через GitHub UI:

1. Завести бота/сервисный аккаунт или fine-grained PAT с правом `contents: write` на этот репозиторий.
2. Добавить этого актора в bypass-список правила защиты ветки `master` (Settings → Rules → Rulesets, либо classic branch protection → "Allow specified actors to bypass required pull requests") — только он сможет пушить в обход PR, для людей ограничение остаётся.
3. Сохранить PAT как секрет репозитория (например `RELEASE_BOT_TOKEN`) — workflow ожидает его под этим именем.
