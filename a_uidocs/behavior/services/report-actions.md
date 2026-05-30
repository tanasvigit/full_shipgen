# Service: report-actions

**Source:** `packages\ember-core\addon\services\report-actions.js`

## API surface (objects)

- **transition:** create, content, title, panelContentClass, saveOptions, callback, edit, content, title, Edit, panelContentClass, view, tabs, label, component, contentClass
- **panel:** create, content, title, panelContentClass, saveOptions, callback, edit, content, title, Edit, panelContentClass, view, tabs, label, component, contentClass
- **modal:** create, resource, title, acceptButtonText, component, confirm, refresh, edit, resource, title, Edit, acceptButtonText, saveButtonIcon, component, confirm, refresh, view, resource, title, component

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


