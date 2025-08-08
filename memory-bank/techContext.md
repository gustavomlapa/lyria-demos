# Tech Context: Merged Demo Application

## 1. Technologies Used

Both `promptdj` and `promptdj-midi` are built using a similar technology stack:

-   **Language:** TypeScript
-   **Framework:** React
-   **Build Tool:** Vite
-   **Styling:** CSS

## 2. Development Setup

-   The project is now a single entity, run with `npm install` and `npm run dev` from the root directory.
-   Configuration files (`package.json`, `tsconfig.json`, `vite.config.ts`) have been consolidated at the root level.

## 3. Technical Constraints & Dependencies

-   The application's dependencies have been successfully merged into the root `package.json`.
-   The root Vite configuration now handles the entire application build.
-   The `promptdj-midi` project has specific dependencies related to Web MIDI API and audio processing that must be preserved.

## 4. Tool Usage Patterns

-   The development workflow will revolve around Vite's fast development server.
-   TypeScript will be used for all new components and logic to maintain consistency.
