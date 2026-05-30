# Service: resource-action

**Source:** `packages\ember-core\addon\services\resource-action.js`


## Custom actions/tasks (19)

### action `create`


### action `update`


### action `delete`

**Modal:**
- **confirm**: confirm dialog — User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

### action `confirmContinueWithUnsavedChanges`

**Modal:**
- **confirm**: common.continue-without-saving — User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

### action `bulkDelete`


### action `export`


### action `import`


### action `search`


### action `refresh`

- `router.refresh()` after success

### action `transitionTo`


### task `createTask`


### task `updateTask`


### task `saveTask`


### task `modalTask`


### task `deleteTask`


### action `getRecordName`


### action `createNewInstance`


### action `can`


### action `cannot`


