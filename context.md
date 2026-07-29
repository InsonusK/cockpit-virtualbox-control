# Контекст задачи: миграция VirtualBox Cockpit-плагина на Alpine.js

## Текущий статус
- Миграция завершена в рамках постановки `Virtualbox_plugin_alpine_migration_spec.md`.
- Проект работает в devcontainer, Node.js доступен, тесты проходят.
- Основные runtime-ошибки, оставленные предыдущим агентом, исправлены:
  - `Alpine.store(...).open is not a function` — store снапшотов переведён обратно на plain object, метод переименован в `show`.
  - `Maximum call stack size exceeded` и `$parent is not defined` — убран runtime-директив `x-partial` и ручной `Alpine.initTree`; партиалы теперь вставляются статически через `loadPartial` с `<x-include>` до `Alpine.start()`.

## Итоговая структура репозитория
```
repo-root/
├── src/                          <- Cockpit-пакет целиком
│   ├── manifest.json
│   ├── index.html                 <- каркас + подключение cockpit.js (runtime) и app.js
│   ├── style.css
│   ├── app.js                     <- оркестратор: регистрация Alpine-компонентов, загрузка партиалов, Alpine.start()
│   ├── vendor/
│   │   └── alpine.min.js          <- локальная копия Alpine
│   ├── client/
│   │   ├── parser.js              <- чистые функции парсинга (покрыты тестами)
│   │   └── vboxClient.js          <- обёртки над cockpit.spawn()
│   ├── components/
│   │   ├── loadPartial.js         <- fetch + разрешение <x-include> до вставки в DOM
│   │   ├── utils.js               <- escapeHtml, formatFlag, stateLabel, stateDotClass
│   │   ├── app.js                 <- Alpine.data('app', ...)
│   │   ├── vmCard.js               <- Alpine.data('vmCard', ...)
│   │   └── snapshotModal.js       <- Alpine.store('snapshotModal', ...)
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
- **Без build-шага**: Alpine подключается статическим файлом, `app.js` — `type="module"`.
- **Партиалы**: загружаются через `loadPartial` до `Alpine.start()`. Внутри партиалов используется `<x-include src="...">` для вложенных шаблонов; все include-ы разрешаются рекурсивно и вставляются в DOM как обычный HTML, после чего Alpine стартует на уже готовом дереве.
- **Модули**: `client/parser.js` и `client/vboxClient.js` — ES-модули с `export`, компоненты импортируют их напрямую.
- **Состояние**: `app` и `vmCard` — `Alpine.data`, модалка снапшотов — `Alpine.store` (plain object).
- **Тесты**: `node --test` — 22/22.

## Ограничения и ожидаемые runtime-факты
- `src/index.html` загружает `../base1/cockpit.js` — этот файл предоставляется средой выполнения Cockpit, в репозитории его нет. В devcontainer без Cockpit он будет 404, что нормально для development-only окружения.
- Запросы `po.manifest.js` / `po.js` — это Cockpit-локализация, не контролируется плагином.
- Для ручной проверки в реальном Cockpit плагин должен быть развёрнут в `~/.local/share/cockpit/virtualbox/`, и в браузере нужна жёсткая перезагрузка (Ctrl+Shift+R) для сброса кэша.

## Definition of done
- [x] Все текущие функции сохранены: список VM, действия, детали, снапшоты.
- [x] В `src/` нет build-артефактов, только статические файлы.
- [x] Каждый компонент имеет парный partial.
- [x] `node --test tests/` проходит без ошибок (22/22).
- [x] Все аргументы `cockpit.spawn()` — массивы.
