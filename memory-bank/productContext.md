# Product Context: Merged Demo Application

## 1. Problem Solved

Currently, the `promptdj` and `promptdj-midi` demos exist as separate, isolated projects. This fragmentation makes it difficult for users to discover and compare the two experiences. It also creates overhead in terms of maintenance and deployment.

## 2. Desired User Experience

The merged application should provide a seamless and intuitive user experience. Users should be able to:

-   Easily launch a single application.
-   Understand that there are two distinct demos available.
-   Switch between the demos effortlessly using a clear navigation element (sidebar).
-   Experience each demo's full functionality without any degradation.

## 3. How It Should Work

From a user's perspective, the application will open to a default view, likely one of the two demos or a landing page. A persistent sidebar menu will clearly display options for "Prompt DJ" and "Prompt DJ MIDI". Clicking on a menu item will render the corresponding demo in the main content area. The state of each demo should be managed appropriately when switching between them.
