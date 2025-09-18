# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

######## README FOR THE FRONTEND APP ##########

Active AOI: An AOI with a status of "active" indicates that it is currently valid and usable. This could mean:

The AOI has been successfully purchased (i.e., payment was completed after adding it to the cart and checking out).
The AOI is accessible for viewing on the map, and the user can interact with it (e.g., click to zoom to its location on the map).
It might still be within a valid time period or subscription (if applicable, though subscriptions were removed from your app).
For example, in the code, activeAois is calculated as aois.filter((aoi) => aoi.status === "active"), counting AOIs that are currently active.


Inactive AOI: An AOI with a status of "inactive" indicates that it is not currently usable or valid. This could mean:

The AOI's payment was not completed, or it failed during checkout.
The AOI might have expired (e.g., if there’s a time limit or a trial period associated with it, though trials were removed).
It could be an AOI that was drawn but not yet purchased or processed.
Alternatively, it might represent an AOI that was deactivated for some reason (e.g., manually by the user or due to an issue with the data).
In the code, inactiveAois is calculated as aois.filter((aoi) => aoi.status === "inactive"), counting AOIs that are not active.



How These Statuses Are Used

The dashboard displays the count of active and inactive AOIs in the stats cards (activeAois.length and inactiveAois.length).
A pie chart visualizes the proportion of active vs. inactive AOIs, with pieData defined as:
tsxconst pieData = [
  { name: "Active AOIs", value: activeAois.length },
  { name: "Inactive AOIs", value: inactiveAois.length },
];

In the "Recent AOIs" section, each AOI is displayed with its status shown as a badge (e.g., green for "ACTIVE" and red for "INACTIVE").
The status field influences how AOIs are presented and potentially how they behave when the user interacts with them (e.g., clicking "View on Map" might only work for active AOIs, depending on your backend logic).