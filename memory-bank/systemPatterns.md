# System Patterns: Merged Demo Application

## 1. High-Level Architecture

The merged application will follow a **Single Page Application (SPA)** architecture. A main `App` component will serve as the shell, containing the sidebar navigation and a content area.

```
+--------------------------------------------------+
|  App Shell                                       |
| +-----------------+----------------------------+ |
| |                 |                            | |
| |  Sidebar        |  Content Area              | |
| |  (Navigation)   |  (Active Demo)             | |
| |                 |                            | |
| | - Prompt DJ     |  [Renders PromptDjApp]     | |
| | - Prompt DJ MIDI|  [Renders PromptDjMidiApp] | |
| |                 |                            | |
| +-----------------+----------------------------+ |
+--------------------------------------------------+
```

## 2. Key Design Patterns

-   **Component-Based Architecture:** The existing `promptdj` and `promptdj-midi` applications will be refactored into self-contained components (`PromptDjApp`, `PromptDjMidiApp`).
-   **State Management:** The `App` component uses React's `useState` hook to manage the currently selected demo.
-   **Component Encapsulation:** The original Lit-based demos are encapsulated within React components (`PromptDjComponent`, `PromptDjMidiComponent`). These React components act as wrappers, creating a container element and dynamically injecting the Lit applications.
-   **Conditional Rendering:** The content area will use conditional rendering to display the selected demo component based on the application's state.

## 3. Component Relationships

-   `App` (Root): Manages the overall layout and application state.
-   `Sidebar`: Renders navigation links and updates the application state on user selection.
-   `PromptDjComponent`: A React wrapper for the `promptdj` Lit application.
-   `PromptDjMidiComponent`: A React wrapper for the `promptdj-midi` Lit application.
