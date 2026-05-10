# TodoNow++ Agent Documentation

This file provides information about the TodoNow++ project for AI agents.

## Project Overview
TodoNow++ is a task management application built with Ionic, Vue.js, and Capacitor. It is designed to be a "Plus Plus" version of a simple todo app, featuring Dropbox synchronization and a `todo.txt` based storage format.

## Tech Stack
- **Framework:** Ionic Vue
- **Build Tool:** Vite
- **Language:** TypeScript
- **State Management:** Vue Composition API (refs)
- **Synchronization:** Dropbox API (via custom `DropboxService`)
- **Storage Format:** `todo.txt` (parsed and reconstructed in `TodoService`)

## Key Components
- `TodoService`: Core logic for loading, saving, parsing, and managing todo items and lists.
- `DropboxService`: Handles communication with Dropbox.
- `AddTodoModal.vue`: UI for creating and editing tasks.
- `TodoItemDisplay.vue`: UI for displaying individual tasks.
- `TodoListView.vue`: Manages the list of tasks, including reordering and selection.

## MCP Configuration (Windows)
When configuring MCP servers on Windows (e.g., in `.junie/mcp/mcp.json`), use `npx.cmd` instead of `npx` for Node-based tools to ensure the command can be correctly located by the system:
```json
"playwright": {
  "command": "npx.cmd",
  "args": ["-y", "@playwright/mcp@latest"]
}
```

## Data Format
Tasks are stored in `todo.txt` format with some custom extensions:
- `# List Name`: Lines starting with `#` define a new list (category).
- `(A) Task text`: Parentheses at the start define priority.
- `x YYYY-MM-DD Task text`: `x` at the start marks a completed task.
- `due:YYYY-MM-DD`: Due date tag.
- `cat:CategoryName`: Category tag.
- `spent:Minutes`: Time spent tag (for deep work tracking).
- `note:Longer text`: (Recently added) Note tag for storing additional information.

## File Structure
- `src/services/`: Backend logic and services.
- `src/components/`: Reusable Vue components.
- `src/views/`: Main pages/views of the application.
- `src/composables/`: Vue composables for shared logic.
