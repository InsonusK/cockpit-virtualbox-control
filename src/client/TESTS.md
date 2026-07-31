# Client module test trace matrix

This matrix tracks the behavior scenarios for `src/client/*` and `src/client/integration/*` after the refactor into integration (VirtualBox string → VirtualBox model) and client (VirtualBox model → application model) layers.

## Integration layer scenarios

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 1 | `listVms` calls `VBoxManage list vms` | ✅ covered | |
| 2 | `listVms` passes `LC_ALL=C` and `err:"message"` options | ✅ covered | |
| 3 | `listVms` parses empty output to empty array | ✅ covered | |
| 4 | `listVms` parses single VM with name and UUID | ✅ covered | |
| 5 | `listVms` parses multiple VMs | ✅ covered | |
| 6 | `listVms` unescapes quotes in VM names | ✅ covered | |
| 7 | `listHdds` calls `VBoxManage list hdds` | ✅ covered | |
| 8 | `listHdds` parses empty output to empty array | ✅ covered | |
| 9 | `listHdds` parses real VBoxManage block with UUID, State, Type, Location, Storage format, Capacity, Encryption | ✅ covered | |
| 10 | `listHdds` parses multiple medium blocks | ✅ covered | |
| 11 | `listHdds` skips blocks without UUID | ✅ covered | |
| 12 | `listDvds` calls `VBoxManage list dvds` | ✅ covered | |
| 13 | `listDvds` parses empty output to empty array | ✅ covered | |
| 14 | `listDvds` sets kind to `dvd` and keeps only UUID blocks | ✅ covered | |
| 15 | `getVmInfo` validates UUID and calls `showvminfo --machinereadable` | ✅ covered | |
| 16 | `getVmInfo` rejects invalid UUID | ✅ covered | |
| 17 | `getVmInfo` parses VM state | ✅ covered | |
| 18 | `getVmInfo` returns `unknown` state when field missing | ✅ covered | |
| 19 | `getVmInfo` parses general info (name, cpus, memory, ostype, vrde, vrdePorts) | ✅ covered | |
| 20 | `getVmInfo` parses network adapters (slot, type, mac, cableConnected) | ✅ covered | |
| 21 | `getVmInfo` parses port forwarding rules | ✅ covered | |
| 22 | `getVmInfo` parses storage attachments including controller names with spaces | ✅ covered | |
| 23 | `getVmInfo` parses USB filters | ✅ covered | |
| 24 | `getVmInfo` parses shared folder machine mappings | ✅ covered | |
| 25 | `getVmInfoHuman` validates UUID and calls `showvminfo` | ✅ covered | |
| 26 | `getVmInfoHuman` rejects invalid UUID | ✅ covered | |
| 27 | `getVmInfoHuman` returns empty array for empty output | ✅ covered | |
| 28 | `getVmInfoHuman` parses shared folder with flags | ✅ covered | |
| 29 | `getVmInfoHuman` parses shared folder without auto-mount | ✅ covered | |
| 30 | `controlVm` validates UUID and command, calls `controlvm` | ✅ covered | |
| 31 | `controlVm` returns typed command result | ✅ covered | |
| 32 | `controlVm` rejects invalid control command | ✅ covered | |
| 33 | `controlVm` rejects invalid UUID | ✅ covered | |
| 34 | `startVm` validates UUID and type, calls `startvm --type` | ✅ covered | |
| 35 | `startVm` supports `headless` and `gui` | ✅ covered | |
| 36 | `startVm` returns typed command result | ✅ covered | |
| 37 | `startVm` rejects invalid start type | ✅ covered | |
| 38 | `startVm` rejects invalid UUID | ✅ covered | |
| 39 | `listSnapshots` validates UUID and calls `snapshot list --machinereadable` | ✅ covered | |
| 40 | `listSnapshots` parses snapshot list | ✅ covered | |
| 41 | `listSnapshots` returns empty array when no snapshots | ✅ covered | |
| 42 | `listSnapshots` treats empty rejection as empty list | ✅ covered | |
| 43 | `listSnapshots` propagates real errors | ✅ covered | |
| 44 | `listSnapshots` rejects invalid UUID | ✅ covered | |
| 45 | `takeSnapshot` validates UUID and trims name, calls `snapshot take` | ✅ covered | |
| 46 | `takeSnapshot` returns typed command result | ✅ covered | |
| 47 | `takeSnapshot` rejects empty snapshot name | ✅ covered | |
| 48 | `takeSnapshot` rejects invalid UUID | ✅ covered | |
| 49 | `restoreSnapshot` validates UUID and calls `snapshot restore` | ✅ covered | |
| 50 | `restoreSnapshot` returns typed command result | ✅ covered | |
| 51 | `restoreSnapshot` rejects empty snapshot name | ✅ covered | |
| 52 | `restoreSnapshot` rejects invalid UUID | ✅ covered | |
| 53 | `vbox` helper throws when `cockpit` global missing | ✅ covered | |
| 54 | `vbox` helper propagates spawn rejection | ✅ covered | |
| 55 | `vbox` helper passes VBoxManage as first argument and forwards options | ✅ covered | |

## Client layer scenarios

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 56 | `listVms` maps `VBoxVm[]` to `Vm[]` | ✅ covered | |
| 57 | `listVms` returns empty array when VirtualBox returns nothing | ✅ covered | |
| 58 | `getVmState` maps `VBoxVmInfo.vmState` to application string | ✅ covered | |
| 59 | `getVmState` maps missing state to `unknown` | ✅ covered | |
| 60 | `getVmDetails` maps full VM details to `VmDetails` | ✅ covered | |
| 61 | `getVmDetails` maps NAT port forwarding rules to UI strings | ✅ covered | |
| 62 | `getVmDetails` maps HDD media with size from medium list | ✅ covered | |
| 63 | `getVmDetails` identifies DVD/ISO by extension or medium type | ✅ covered | |
| 64 | `getVmDetails` falls back to machine-readable shared folders when human output is missing | ✅ covered | |
| 65 | `getVmDetails` maps USB filters to labels | ✅ covered | |
| 66 | `getVmDetails` maps shared folders with flags to readOnly/autoMount | ✅ covered | |
| 67 | `controlVm` calls integration and resolves to void | ✅ covered | |
| 68 | `controlVm` rejects invalid control command | ✅ covered | |
| 69 | `controlVm` rejects invalid UUID | ✅ covered | |
| 70 | `startVm` calls integration and resolves to void | ✅ covered | |
| 71 | `startVm` supports `headless` and `gui` | ✅ covered | |
| 72 | `startVm` rejects invalid start type | ✅ covered | |
| 73 | `startVm` rejects invalid UUID | ✅ covered | |
| 74 | `listSnapshots` maps `VBoxSnapshot[]` to `string[]` | ✅ covered | |
| 75 | `listSnapshots` returns empty array when no snapshots | ✅ covered | |
| 76 | `listSnapshots` propagates real errors | ✅ covered | |
| 77 | `listSnapshots` rejects invalid UUID | ✅ covered | |
| 78 | `takeSnapshot` calls integration and resolves to void | ✅ covered | |
| 79 | `takeSnapshot` trims snapshot name | ✅ covered | |
| 80 | `takeSnapshot` rejects empty snapshot name | ✅ covered | |
| 81 | `takeSnapshot` rejects invalid UUID | ✅ covered | |
| 82 | `restoreSnapshot` calls integration and resolves to void | ✅ covered | |
| 83 | `restoreSnapshot` rejects empty snapshot name | ✅ covered | |
| 84 | `restoreSnapshot` rejects invalid UUID | ✅ covered | |

## Function → Test reverse table

| Function | Test file |
|----------|-----------|
| `integration/vbox` | tests/client/integration/vbox.test.ts |
| `integration/listVms` | tests/client/integration/listVms.test.ts |
| `integration/listHdds` | tests/client/integration/listHdds.test.ts |
| `integration/listDvds` | tests/client/integration/listDvds.test.ts |
| `integration/getVmInfo` | tests/client/integration/getVmInfo.test.ts |
| `integration/getVmInfoHuman` | tests/client/integration/getVmInfoHuman.test.ts |
| `integration/controlVm` | tests/client/integration/controlVm.test.ts |
| `integration/startVm` | tests/client/integration/startVm.test.ts |
| `integration/listSnapshots` | tests/client/integration/listSnapshots.test.ts |
| `integration/takeSnapshot` | tests/client/integration/takeSnapshot.test.ts |
| `integration/restoreSnapshot` | tests/client/integration/restoreSnapshot.test.ts |
| `client/listVms` | tests/client/listVms.test.ts |
| `client/getVmState` | tests/client/getVmState.test.ts |
| `client/getVmDetails` | tests/client/getVmDetails.test.ts |
| `client/controlVm` | tests/client/controlVm.test.ts |
| `client/startVm` | tests/client/startVm.test.ts |
| `client/listSnapshots` | tests/client/listSnapshots.test.ts |
| `client/takeSnapshot` | tests/client/takeSnapshot.test.ts |
| `client/restoreSnapshot` | tests/client/restoreSnapshot.test.ts |
