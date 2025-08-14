# Active Context: Merged Demo Application

## 1. Current Work Focus

The current focus is on hiding the play, restart, and back buttons while the loading spinner is active.

## 2. Next Steps

1.  **Verify Functionality:** Thoroughly test the changes to ensure that the loading indicator is displayed correctly.
2.  **Code Cleanup:** Review the integrated code for any potential improvements or refactoring opportunities.
3.  **Update Documentation:** Ensure all memory bank files are consistent and up-to-date with the final implementation.

## 3. Active Decisions & Considerations

-   **Project Structure:** The project has been successfully structured with the original demos located in the `src/demos` directory.
-   **Dependency Management:** Dependencies have been consolidated into the root `package.json`.
-   **Component Model:** The demos are loaded via React wrapper components (`PromptDjComponent`, `PromptDjMidiComponent`, and `VisionDjComponent`), which dynamically inject the original Lit-based applications.
