---
description: Scaffold a new React component with SCSS module following Planova conventions
---

Create a new React component for Planova. The user will specify:
- Component name (PascalCase)
- Destination folder under `frontend/src/components/` (e.g. `board`, `issue`, `common`, `ui`, `layout`, `backlog`, `sprint`, `reports`, `roadmap`, `admin`)
- Optional: props interface, brief description of what it renders

## Rules

1. Always create TWO files:
   - `frontend/src/components/<folder>/<ComponentName>.tsx`
   - `frontend/src/components/<folder>/<ComponentName>.module.scss`

2. **TSX template:**
   ```tsx
   import styles from './<ComponentName>.module.scss';

   interface <ComponentName>Props {
     // props here
   }

   export function <ComponentName>({ ...props }: <ComponentName>Props) {
     return (
       <div className={styles.root}>
         {/* content */}
       </div>
     );
   }
   ```
   - Named export (not default)
   - Import styles as `styles` from the module file
   - Props interface named `<ComponentName>Props`
   - Use `styles.root` as the outermost class

3. **SCSS module template:**
   ```scss
   @use '@/styles/mixins' as *;

   .root {
     // styles here
   }
   ```
   - Use `@use '@/styles/mixins' as *;` at the top if mixins are needed
   - BEM-lite naming inside the module (`.root`, `.header`, `.item`, etc.)
   - No global selectors; everything scoped to the module

4. Do NOT use styled-components, CSS-in-JS, or inline styles.
5. Do NOT add a default export.
6. If the component needs Zustand store access, import from `@/store/<storeFile>`.
7. If the component fetches data, use a TanStack Query hook from `@/hooks/`.

After creating the files, show the user the file paths and the key exports so they can import it immediately.
