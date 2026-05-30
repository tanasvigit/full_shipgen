# Service: driver-actions

**Source:** `packages\fleetops\addon\services\driver-actions.js`

## API surface (objects)

- **transition:** view, edit, create
- **panel:** create, content, title, resource, saveOptions, callback, useDefaultSaveTask, edit, content, title, resourceName, actionButtons, icon, fn, useDefaultSaveTask, view, header, actionButtons, icon, fn, tabs
- **modal:** create, resource, title, resource, acceptButtonText, resource, component, confirm, refresh, edit, resource, title, resourceName, acceptButtonText, saveButtonIcon, component, confirm, refresh, view, resource, title, component

## Custom actions/tasks (3)

### action `locate`


### action `assignOrder`

**Modal:**
- **show**: modals/driver-assign-order — Opens modal; confirm handler may call save/API; decline may rollback

### action `assignVehicle`

**Modal:**
- **show**: modals/driver-assign-vehicle — Opens modal; confirm handler may call save/API; decline may rollback


## Inherited from resource-action (19)

create, update, delete, bulkDelete, export, import, refresh, transitionTo, search — see [resource-action.md](./resource-action.md)

### action `confirmContinueWithUnsavedChanges` _(inherited)_

**Modal:**
- **confirm**: common.continue-without-saving — User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

### task `createTask` _(inherited)_


### task `updateTask` _(inherited)_


### task `saveTask` _(inherited)_


### task `modalTask` _(inherited)_


### task `deleteTask` _(inherited)_


### action `getRecordName` _(inherited)_


### action `createNewInstance` _(inherited)_


### action `can` _(inherited)_


### action `cannot` _(inherited)_


