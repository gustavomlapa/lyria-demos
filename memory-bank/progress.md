# Progress: Merged Demo Application

## 1. What Works

-   **Unified Application Shell:** The application successfully runs as a single page application (SPA).
-   **Sidebar Navigation:** Users can switch between the `promptdj` and `promptdj-midi` demos using the sidebar.
-   **Demo Integration:** Both demos are encapsulated in React components and render correctly within the main application shell.
-   **Consolidated Build Process:** The project uses a single, unified `package.json` and Vite configuration.

## 2. What's Left to Build

-   No major features are left to build. The primary goal of merging the applications is complete.
-   Future work may involve further code cleanup, bug fixing, or performance optimizations.

## 3. Current Status

-   **Phase:** Implementation Complete.
-   **Completed:**
    -   Creation of the unified application shell.
    -   Refactoring of demos into components.
    -   Integration of demos into the shell.
    -   Consolidation of dependencies and build configurations.
-   **Next:** Thoroughly test the merged application and refine the documentation.

## 4. Known Issues

-   The `promptdj` demo now presents the prompt asking at the beginning (on tab click) and not only after clicking on the prompt button.
-   A loading indicator is now displayed after the user submits a prompt and before the sliders are updated.
-   The "Temperature", "Guidance", and "Top K" controls are now hidden while the loading spinner is active.
-   The play, restart, and back buttons are now hidden while the loading spinner is active.
