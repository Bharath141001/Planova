---
description: Scaffold a new page in Planova with route registration and SCSS module
---

Create a new page for Planova. The user will specify:
- Page name (PascalCase, e.g. `TimelinePage`)
- Route path (e.g. `/projects/:projectKey/timeline`)
- Which sidebar section it belongs to (or none)

## Files to create

### 1. Page component — `frontend/src/pages/<domain>/<PageName>.tsx`
```tsx
import styles from './<PageName>.module.scss';

export function <PageName>() {
  return (
    <div className={styles.root}>
      <h1>Page Title</h1>
    </div>
  );
}
```
- Named export only (no default export)
- Use `styles.root` as the outermost wrapper class

### 2. SCSS module — `frontend/src/pages/<domain>/<PageName>.module.scss`
```scss
@use '@/styles/mixins' as *;

.root {
  padding: 1.5rem;
}
```

### 3. Register the route in `frontend/src/router/AppRouter.tsx`
Find the appropriate `<Route>` group and add:
```tsx
<Route path="<route-path>" element={<PageName />} />
```
Import the component at the top of the file.

### 4. Add to sidebar (if applicable) — `frontend/src/components/layout/Sidebar.tsx`
Find the navItems array and add an entry:
```ts
{ label: 'Page Label', path: `/projects/${projectKey}/<route-segment>`, icon: <IconComponent /> }
```

## Checklist for the user
- [ ] Route added to `AppRouter.tsx`
- [ ] Sidebar link added (if needed)
- [ ] Page requires auth — verify it's inside the `<ProtectedRoute>` wrapper in the router
- [ ] If the page fetches project data, use `useParams()` to get `projectKey` and pass it to TanStack Query hooks from `@/hooks/`
