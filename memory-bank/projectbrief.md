# Project Brief: Merged Demo Application

## 1. Overview

The primary goal of this project is to merge two existing demo applications, `promptdj` and `promptdj-midi`, into a single, cohesive web application.

## 2. Core Requirements

- **Unified Interface:** The merged application must feature a main interface with a sidebar menu.
- **Demo Selection:** The sidebar will allow users to select and switch between the `promptdj` and `promptdj-midi` demos.
- **Preserve Functionality:** The original logic, functionality, and layout of each individual demo must be maintained within its respective view.
- **Component Reuse:** Existing components should be reused wherever possible to maintain consistency and reduce redundancy.
- **Code Integrity:** Avoid unnecessary changes that could introduce bugs or break existing functionality.

## 3. Project Scope

- Create a new application shell that hosts both demos.
- Refactor the existing demos to be embeddable components within the new shell.
- Implement a navigation system (e.g., sidebar) for switching between demos.
- Consolidate dependencies and build configurations.
