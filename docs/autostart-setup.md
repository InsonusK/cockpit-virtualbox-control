# Настройка автозапуска ВМ на хосте

Это руководство — для администратора сервера, который хочет, чтобы флаг "Автозапуск при старте хоста" в плагине (модалка "Параметры VM") реально работал: чтобы выбранные ВМ стартовали сами при включении/перезагрузке сервера, без захода в Cockpit.

Это **не** про установку самого плагина — про неё см. [README.md](../README.md#релиз) и агентский skill [virtualbox-cockpit-plugin-install.skill](skills/devops/virtualbox-cockpit-plugin-install.skill/virtualbox-cockpit-plugin-install.skill.md). Настройка ниже делается один раз на хосте, независимо от того, как и куда развёрнут сам плагин.

## Почему без этой настройки автозапуск не работает

Плагин просто вызывает `VBoxManage modifyvm <uuid> --autostart-enabled on` — ту же команду, что можно выполнить в терминале. Но у VirtualBox автозапуск — это отдельная подсистема хоста: нужна общая "база автозапуска" (каталог, куда VirtualBox складывает список машин, которым разрешено стартовать без интерактивного логина) и системная служба, которая читает эту базу при загрузке сервера. Без них команда всегда падает с одной и той же ошибкой, независимо от того, кто её вызвал — плагин или вы руками:

```
VBoxManage: error: The path to the autostart database is not set
```

Отдельная и не связанная с этим ошибка — `The machine is not mutable (state is Saved)`. Она про изменение объёма памяти/CPU, а не про автозапуск: VirtualBox не разрешает менять `--memory`/`--cpus`, пока машина не полностью выключена (сохранённое состояние "Saved" этому мешает так же, как и работающая машина). Если видите обе ошибки сразу в одной отправке формы — это две разные проблемы: автозапуск включится независимо, а память/CPU нужно будет поменять после полного выключения ВМ.

## Шаги

Выполняются один раз на хосте. Команды с `sudo` — от root, остальные — от имени того ОС-пользователя, под которым вы заходите в Cockpit и видите нужные машины (это важно, см. ниже).

```bash
# 1. Общий каталог базы автозапуска
sudo groupadd -f vboxusers
sudo mkdir -p /etc/vbox/autostart.d
sudo chgrp vboxusers /etc/vbox/autostart.d
sudo chmod 1770 /etc/vbox/autostart.d
sudo usermod -aG vboxusers "$USER"        # добавить своего пользователя в группу

# 2. Включить автозапуск в конфиге пакета VirtualBox
sudo sed -i \
  -e 's/^#\?VBOXAUTOSTART_DB=.*/VBOXAUTOSTART_DB=\/etc\/vbox\/autostart.d/' \
  -e 's/^#\?VBOXAUTOSTART_START=.*/VBOXAUTOSTART_START=1/' \
  /etc/default/virtualbox

# 3. Указать путь к базе для СВОЕГО пользователя (без sudo!)
VBoxManage setproperty autostartdbpath /etc/vbox/autostart.d

# 4. Включить и запустить службу автозапуска
sudo systemctl enable --now vboxautostart-service
```

После этого перелогиньтесь в Cockpit (шаг 1 добавил вас в группу — это применяется только к новым сессиям) и повторите включение автозапуска в модалке "Параметры VM".

### Почему шаг 3 важен и его легко сделать неправильно

`VBoxManage setproperty autostartdbpath` сохраняет путь не в общий системный файл, а в личный конфиг VirtualBox того пользователя, который выполнил команду (`~/.config/VirtualBox/VirtualBox.xml`). Плагин всегда выполняет `VBoxManage` от имени того ОС-пользователя, что залогинен в Cockpit (без повышения прав) — поэтому шаг 3 нужно выполнить именно под этим пользователем, а не под root и не под каким-то другим. Если выполнить его не под тем пользователем, ошибка про "path... is not set" останется, даже когда все остальные шаги сделаны верно.

Проверить, под каким пользователем выполняются команды плагина, можно, открыв терминал прямо из Cockpit (а не по SSH) и выполнив `whoami`.

## Проверка

```bash
VBoxManage modifyvm <uuid> --autostart-enabled on   # должно пройти без ошибки
sudo systemctl status vboxautostart-service
```

Финальная проверка — перезагрузка хоста: машина с включённым флагом должна подняться сама, без входа в Cockpit. Логи службы — `journalctl -u vboxautostart-service`.

## Частые проблемы

| Симптом | Причина | Решение |
| --- | --- | --- |
| `The path to the autostart database is not set` после всех шагов | Шаг 3 выполнен от другого пользователя | Узнать правильного пользователя через терминал Cockpit (`whoami`) и повторить шаг 3 от его имени |
| `/etc/default/virtualbox` не существует | Не Debian/Ubuntu-пакет VirtualBox | Проверить `systemctl list-unit-files \| grep -i autostart` — если юнита нет вовсе, у вашей сборки VirtualBox нет штатной службы автозапуска, и её придётся реализовать самостоятельным systemd-юнитом, вызывающим `VBoxManage startvm <uuid> --type headless` при загрузке |
| `vboxautostart-service`: unit not found | Другая сборка/пакет VirtualBox | Проверить установленный пакет (`dpkg -l \| grep -i virtualbox` или `rpm -qa \| grep -i VirtualBox`) |
| После `usermod -aG vboxusers` всё равно не работает | Группа применяется только к новым сессиям | Разлогиниться и залогиниться в Cockpit заново (не просто открыть новый терминал) |
| `The machine is not mutable (state is Saved)` | Не связано с автозапуском — ВМ не полностью выключена | Выключить ВМ полностью (Force off/обычное выключение гостевой ОС), не оставлять в "Saved", и повторить изменение памяти/CPU |

## Подробности для автоматизации

Пошаговая версия этой настройки в формате, рассчитанном на выполнение агентом/скриптом (ansible и т.п.), с дополнительными проверками ошибок — в [procedure-autostart-setup.md](skills/devops/virtualbox-cockpit-plugin-install.skill/procedure-autostart-setup.md).
