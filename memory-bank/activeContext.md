# Active Context: Merged Demo Application

## 1. Current Work Focus

The current focus is on fixing a bug related to WebSocket connections not being properly closed when switching between demo tabs. This now includes the new `visiondj` component.

## 2. Next Steps

1.  **Verify Functionality:** Thoroughly test the fix to ensure that WebSocket connections are now properly closed when switching between the `promptdj` and `promptdj-midi` demos.
2.  **Code Cleanup:** Review the integrated code for any potential improvements or refactoring opportunities.
3.  **Update Documentation:** Ensure all memory bank files are consistent and up-to-date with the final implementation.

## 3. Active Decisions & Considerations

-   **Project Structure:** The project has been successfully structured with the original demos located in the `src/demos` directory.
-   **Dependency Management:** Dependencies have been consolidated into the root `package.json`.
-   **Component Model:** The demos are loaded via React wrapper components (`PromptDjComponent`, `PromptDjMidiComponent`, and `VisionDjComponent`), which dynamically inject the original Lit-based applications.
