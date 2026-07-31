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
| 17 | `parseVmInfo` parses full VM info output | ✅ covered | |
| 18 | `parseVmGeneralInfo` parses general fields (name, VMState, cpus, memory, ostype, vrde, vrdePorts) | ✅ covered | |
| 19 | `parseVmGeneralInfo` returns empty strings and `unknown` for missing fields | ✅ covered | |
| 20 | `parseVmNics` returns empty array when no NICs configured | ✅ covered | |
| 21 | `parseVmNics` parses single NAT adapter with port forwarding | ✅ covered | |
| 22 | `parseVmNics` skips disabled NICs (`none`) | ✅ covered | |
| 23 | `parseVmNics` parses multiple port forwarding rules | ✅ covered | |
| 24 | `parseVmStorageAttachments` returns empty array when no attachments | ✅ covered | |
| 25 | `parseVmStorageAttachments` parses simple HDD attachment | ✅ covered | |
| 26 | `parseVmStorageAttachments` parses controller names with spaces | ✅ covered | |
| 27 | `parseVmStorageAttachments` ignores `none` and attribute keys (`nonrotational`, `discard`, `ImageUUID`, `IsEjected`) | ✅ covered | |
| 28 | `parseVmStorageAttachments` parses empty IDE drives (`emptydrive`) | ✅ covered | |
| 29 | `parseVmStorageAttachments` handles snapshot path with UUID in curly braces | ✅ covered | Regression for differencing images |
| 30 | `parseVmUsbFilters` returns empty array when no filters | ✅ covered | |
| 31 | `parseVmUsbFilters` parses USB filter with all fields | ✅ covered | |
| 32 | `parseVmUsbFilters` parses multiple filters | ✅ covered | |
| 33 | `parseVmSharedFolderMappings` returns empty array when no mappings | ✅ covered | |
| 34 | `parseVmSharedFolderMappings` parses single and multiple mappings | ✅ covered | |
| 35 | `parseVmSharedFolderMappings` uses empty string when host path is missing | ✅ covered | |
| 36 | `getVmInfoHuman` validates UUID and calls `showvminfo` | ✅ covered | |
| 37 | `getVmInfoHuman` rejects invalid UUID | ✅ covered | |
| 38 | `getVmInfoHuman` returns empty array for empty output | ✅ covered | |
| 39 | `getVmInfoHuman` parses shared folder with flags | ✅ covered | |
| 40 | `getVmInfoHuman` parses shared folder without auto-mount | ✅ covered | |
| 41 | `parseKeyValue` parses simple pairs | ✅ covered | |
| 42 | `parseKeyValue` strips surrounding quotes | ✅ covered | |
| 43 | `parseKeyValue` handles unquoted values | ✅ covered | |
| 44 | `parseKeyValue` returns empty object for empty output | ✅ covered | |
| 45 | `parseKeyValue` keeps keys with spaces | ✅ covered | |
| 46 | `controlVm` validates UUID and command, calls `controlvm` | ✅ covered | |
| 47 | `controlVm` returns typed command result | ✅ covered | |
| 48 | `controlVm` rejects invalid control command | ✅ covered | |
| 49 | `controlVm` rejects invalid UUID | ✅ covered | |
| 50 | `startVm` validates UUID and type, calls `startvm --type` | ✅ covered | |
| 51 | `startVm` supports `headless` and `gui` | ✅ covered | |
| 52 | `startVm` returns typed command result | ✅ covered | |
| 53 | `startVm` rejects invalid start type | ✅ covered | |
| 54 | `startVm` rejects invalid UUID | ✅ covered | |
| 55 | `listSnapshots` validates UUID and calls `snapshot list --machinereadable` | ✅ covered | |
| 56 | `listSnapshots` parses snapshot list | ✅ covered | |
| 57 | `listSnapshots` returns empty array when no snapshots | ✅ covered | |
| 58 | `listSnapshots` treats empty rejection as empty list | ✅ covered | |
| 59 | `listSnapshots` propagates real errors | ✅ covered | |
| 60 | `listSnapshots` rejects invalid UUID | ✅ covered | |
| 61 | `takeSnapshot` validates UUID and trims name, calls `snapshot take` | ✅ covered | |
| 62 | `takeSnapshot` returns typed command result | ✅ covered | |
| 63 | `takeSnapshot` rejects empty snapshot name | ✅ covered | |
| 64 | `takeSnapshot` rejects invalid UUID | ✅ covered | |
| 65 | `restoreSnapshot` validates UUID and calls `snapshot restore` | ✅ covered | |
| 66 | `restoreSnapshot` returns typed command result | ✅ covered | |
| 67 | `restoreSnapshot` rejects empty snapshot name | ✅ covered | |
| 68 | `restoreSnapshot` rejects invalid UUID | ✅ covered | |
| 69 | `vbox` helper throws when `cockpit` global missing | ✅ covered | |
| 70 | `vbox` helper propagates spawn rejection | ✅ covered | |
| 71 | `vbox` helper passes VBoxManage as first argument and forwards options | ✅ covered | |

## Client layer scenarios

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 72 | `listVms` maps `VBoxVm[]` to `Vm[]` | ✅ covered | |
| 73 | `listVms` returns empty array when VirtualBox returns nothing | ✅ covered | |
| 74 | `getVmState` maps `VBoxVmInfo.vmState` to application string | ✅ covered | |
| 75 | `getVmState` maps missing state to `unknown` | ✅ covered | |
| 76 | `getVmDetails` maps full VM details to `VmDetails` | ✅ covered | |
| 77 | `getVmDetails` maps NAT port forwarding rules to UI strings | ✅ covered | |
| 78 | `getVmDetails` maps HDD media with size from medium list | ✅ covered | |
| 79 | `getVmDetails` identifies DVD/ISO by extension or medium type | ✅ covered | |
| 80 | `getVmDetails` treats `emptydrive` as DVD/ISO | ✅ covered | |
| 81 | `getVmDetails` resolves media by `ImageUUID` when path is a snapshot differencing image | ✅ covered | Regression |
| 82 | `getVmDetails` falls back to machine-readable shared folders when human output is missing | ✅ covered | |
| 83 | `getVmDetails` maps USB filters to labels | ✅ covered | |
| 84 | `getVmDetails` maps shared folders with flags to readOnly/autoMount | ✅ covered | |
| 85 | `controlVm` calls integration and resolves to void | ✅ covered | |
| 86 | `controlVm` rejects invalid control command | ✅ covered | |
| 87 | `controlVm` rejects invalid UUID | ✅ covered | |
| 88 | `startVm` calls integration and resolves to void | ✅ covered | |
| 89 | `startVm` supports `headless` and `gui` | ✅ covered | |
| 90 | `startVm` rejects invalid start type | ✅ covered | |
| 91 | `startVm` rejects invalid UUID | ✅ covered | |
| 92 | `listSnapshots` maps `VBoxSnapshot[]` to `string[]` | ✅ covered | |
| 93 | `listSnapshots` returns empty array when no snapshots | ✅ covered | |
| 94 | `listSnapshots` propagates real errors | ✅ covered | |
| 95 | `listSnapshots` rejects invalid UUID | ✅ covered | |
| 96 | `takeSnapshot` calls integration and resolves to void | ✅ covered | |
| 97 | `takeSnapshot` trims snapshot name | ✅ covered | |
| 98 | `takeSnapshot` rejects empty snapshot name | ✅ covered | |
| 99 | `takeSnapshot` rejects invalid UUID | ✅ covered | |
| 100 | `restoreSnapshot` calls integration and resolves to void | ✅ covered | |
| 101 | `restoreSnapshot` rejects empty snapshot name | ✅ covered | |
| 102 | `restoreSnapshot` rejects invalid UUID | ✅ covered | |

## Function → Test reverse table

| Function | Test file |
|----------|-----------|
| `integration/vbox` | src/client/integration/test/vbox.test.ts |
| `integration/listVms` | src/client/integration/test/listVms.test.ts |
| `integration/listHdds` | src/client/integration/test/listHdds.test.ts |
| `integration/listDvds` | src/client/integration/test/listDvds.test.ts |
| `integration/getVmInfo` | src/client/integration/test/getVmInfo.test.ts |
| `integration/parseVmInfo` | src/client/integration/test/parseVmInfo.test.ts |
| `integration/parseVmGeneralInfo` | src/client/integration/test/parseVmGeneralInfo.test.ts |
| `integration/parseVmNics` | src/client/integration/test/parseVmNics.test.ts |
| `integration/parseVmStorageAttachments` | src/client/integration/test/parseVmStorageAttachments.test.ts |
| `integration/parseVmUsbFilters` | src/client/integration/test/parseVmUsbFilters.test.ts |
| `integration/parseVmSharedFolderMappings` | src/client/integration/test/parseVmSharedFolderMappings.test.ts |
| `integration/parseKeyValue` | src/client/integration/test/parseKeyValue.test.ts |
| `integration/getVmInfoHuman` | src/client/integration/test/getVmInfoHuman.test.ts |
| `integration/controlVm` | src/client/integration/test/controlVm.test.ts |
| `integration/startVm` | src/client/integration/test/startVm.test.ts |
| `integration/listSnapshots` | src/client/integration/test/listSnapshots.test.ts |
| `integration/takeSnapshot` | src/client/integration/test/takeSnapshot.test.ts |
| `integration/restoreSnapshot` | src/client/integration/test/restoreSnapshot.test.ts |
| `client/listVms` | src/client/test/listVms.test.ts |
| `client/getVmState` | src/client/test/getVmState.test.ts |
| `client/getVmDetails` | src/client/test/getVmDetails.test.ts |
| `client/controlVm` | src/client/test/controlVm.test.ts |
| `client/startVm` | src/client/test/startVm.test.ts |
| `client/listSnapshots` | src/client/test/listSnapshots.test.ts |
| `client/takeSnapshot` | src/client/test/takeSnapshot.test.ts |
| `client/restoreSnapshot` | src/client/test/restoreSnapshot.test.ts |
