# Service: service-area-actions

**Source:** `packages\fleetops\addon\services\service-area-actions.js`

## API surface (objects)

- **transition:** view, queryParams, service_area, edit, queryParams, service_area, editing, create, queryParams, creating
- **panel:** create, content, title, resource, useDefaultSaveTask, saveOptions, callback, edit, content, title, resourceName, useDefaultSaveTask, view, tabs, label, component
- **modal:** create, resource, title, resource, acceptButtonText, resource, component, confirm, refresh, edit, resource, title, resourceName, acceptButtonText, saveButtonIcon, component, confirm, refresh, view, resource, title, component

## Custom actions/tasks (1)

### task `loadAll`



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


