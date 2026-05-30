# Service: order-actions

**Source:** `packages\fleetops\addon\services\order-actions.js`

## API surface (objects)

- **transition:** view, edit, create
- **panel:** create, content, title, resource, saveOptions, callback, useDefaultSaveTask, edit, content, title, resourceName, useDefaultSaveTask, view, tabs, label, component
- **modal:** create, resource, title, resource, acceptButtonText, resource, component, confirm, refresh, edit, resource, title, resourceName, acceptButtonText, saveButtonIcon, component, confirm, refresh, view, resource, title, component

## Custom actions/tasks (16)

### action `cancel`

**Modal:**
- **confirm**: order.prompts.cancel-title — User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

### action `dispatch`

**Modal:**
- **confirm**: order.prompts.dispatch-title — User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

### action `bulkCancel`


### action `bulkDispatch`


### action `bulkAssignDriver`


### action `optimizeOrderRoutes`


### action `editRoute`


### action `updateActivity`

**Modal:**
- **show**: modals/update-order-activity — Opens modal; confirm handler may call save/API; decline may rollback

### action `editOrderDetails`


### action `assignDriver`


### action `unassignDriver`


### action `viewMetadata`

**Modal:**
- **show**: modals/view-metadata — Opens modal; confirm handler may call save/API; decline may rollback

### action `editMetadata`

**Modal:**
- **show**: modals/edit-metadata — Opens modal; confirm handler may call save/API; decline may rollback
- set `meta` = meta

### action `viewLabel`

**Modal:**
- **show**: modal component — Opens modal; confirm handler may call save/API; decline may rollback

### action `importOrders`

**Modal:**
- **show**: modals/orchestrator-import — Opens modal; confirm handler may call save/API; decline may rollback

### task `saveRoute`



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


