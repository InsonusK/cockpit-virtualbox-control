# Контекст задачи: миграция VirtualBox Cockpit-плагина на Alpine.js

## Текущий статус
- Пользователь дал постановку: `Virtualbox plugin alpine migration spec.md`.
- План миграции подготовлен и одобрен, но реализация приостановлена: пользователь отказался от установки Node.js в текущее окружение и планирует обернуть проект в devcontainer. После создания devcontainer задача будет запущена повторно с учётом этого файла.

## Состояние проекта до начала миграции
Последняя рабочая версия (vanilla JS, разделённая на модули) находится в корне рабочей директории:
```
app.js                    — оркестратор
client/
  parser.js               — чистые функции парсинга VBoxManage
  vboxClient.js           — обёртки над cockpit.spawn()
components/
  utils.js                — escapeHtml
  vmCard.js               — рендер карточки VM
  vmDetails.js            — рендер раскрывающейся панели деталей
  snapshotModal.js        — модалка снапшотов
index.html
style.css
manifest.json
```

### Реализованный функционал
- Список VM со статусом (running/paused/off/saved/aborted).
- Действия: start headless/GUI, pause/resume, ACPI shutdown, force off, save state.
- Раскрываемая карточка VM по клику на заголовок.
- Панель деталей:
  - Общая: CPU, Memory, ОС, VRDE port.
  - Сети: таблица (Adapter, Тип, MAC, Включена, Проброс портов).
  - Носители: таблица (Тип, Путь, Размер).
  - USB устройства: таблица (Устройство, Статус подключения, Автоподключение).
  - Общие папки: таблица (Название, Хост, Гость, Только чтение, Автоподключение).
- Модалка снапшотов (список, создание, восстановление).
- Обработка ошибки `E_ACCESSDENIED` от `VBoxManage showvminfo`: human-readable версия вызывается в `try/catch`, а shared folders fallback берутся из machine-readable output.
- Все UUID валидируются в `client/vboxClient.js` через регулярку; команды управления берутся из белых списков.

## Цель миграции (кратко)
Перейти на Alpine.js без build-шага, сохранив весь текущий функционал. Итоговая структура репозитория должна стать:
```
repo-root/
├── src/                          <- Cockpit-пакет целиком
│   ├── manifest.json
│   ├── index.html                 <- только каркас
│   ├── style.css
│   ├── app.js                     <- type="module", оркестратор: загрузка partials + запуск Alpine
│   ├── vendor/
│   │   └── alpine.min.js          <- локальная копия, без CDN
│   ├── client/
│   │   ├── parser.js              <- чистые функции (покрываются тестами)
│   │   └── vboxClient.js          <- обёртки cockpit.spawn()
│   ├── components/
│   │   ├── loadPartial.js         <- fetch + вставка partials
│   │   ├── utils.js
│   │   ├── app.js                 <- Alpine.data('app', ...)
│   │   ├── vmCard.js              <- Alpine.data('vmCard', ...)
│   │   ├── vmDetails.js           <- Alpine.data('vmDetails', ...)
│   │   └── snapshotModal.js       <- Alpine.store('snapshotModal', ...) или аналог
│   └── partials/
│       ├── app.html
│       ├── vm-card.html
│       ├── vm-details.html
│       └── snapshot-modal.html
├── tests/
│   └── parser.test.js             <- node --test, импортирует ../src/client/parser.js
└── README.md
```

## Ключевые архитектурные решения
- **Без build-шага**: Alpine подключается статическим файлом, `<script type="module" src="app.js">`.
- **Жизненный цикл Alpine**: использовать `window.deferLoadingAlpine` (определяется в `index.html` до загрузки `alpine.min.js`) — сохранить callback `startAlpine` и вызвать его из `app.js` только после `fetch` всех partials и регистрации компонентов.
- **Модули**: `client/parser.js` и `client/vboxClient.js` лучше превратить в ES-модули (`export`), чтобы компоненты-модули могли импортировать их напрямую, а не полагаться на глобальные переменные (в ES-модулях глобальные `function` из обычных скриптов не видны).
- **Партиалы**: загружаются через `loadPartial(path, targetSelector)` в DOM до `Alpine.start()`.
- **Тесты**: покрыть `client/parser.js` через встроенный `node:test`. Тесты располагаются в `tests/`, не попадают в `src/`.

## План миграции (подробно)
1. Создать структуру `src/` и `tests/`, перенести текущие файлы в `src/`.
2. Скачать `alpine.min.js` в `src/vendor/` (например, с unpkg).
3. Преобразовать `client/parser.js` и `client/vboxClient.js` в ES-модули с `export`.
4. Создать `src/components/loadPartial.js` — `fetch` + вставка HTML в DOM.
5. Переписать компоненты как `Alpine.data`/`Alpine.store` без HTML-строк в JS.
6. Создать парные partials в `src/partials/` с директивами Alpine.
7. Переписать `src/app.js` модулем: загрузка partials, импорт компонентов, вызов `window.__startAlpine()`.
8. Обновить `src/index.html`: каркас + `deferLoadingAlpine` + подключение скриптов.
9. Актуализировать `src/style.css` (добавить `[x-cloak]` и т.д.).
10. Написать `tests/parser.test.js`.
11. Запустить `node --test tests/`.

## Ограничение
- В текущем окружении **нет Node.js**, поэтому шаг запуска тестов невозможен до создания devcontainer. Тесты всё равно нужно написать.

## Ссылки
- Постановка: `Virtualbox_plugin_alpine_migration_spec.md`
- Одобренный план: `/home/insonusk/.kimi-code/sessions/wd_virtualbox_c0bd26ae598a/session_2ba922e9-1d4a-4761-8881-3d7c2701d0b3/agents/main/plans/crystal-luke-cage-she-hulk.md`
