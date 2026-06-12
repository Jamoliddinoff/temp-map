# Project Rules & Code Standards

## 1. Token Efficiency & Task Scope (STRICT)

- **Stay inside the task scope** — only reason about and change what was actually asked; don't analyze, plan, or touch things outside the request
- **Don't overthink simple changes** — approach the problem precisely and solve it directly; extra reasoning on out-of-scope things wastes tokens
- **Follow the rules in this document when writing code** — don't improvise an approach that contradicts it
- **Never re-read a file** that was already read in the same conversation
- **No redundant grep/find** if the file structure is already known from context
- **No TypeScript check** (`tsc --noEmit`) after every small edit — only run for complex type changes
- **Edit directly** without reading first if the target code is visible in context
- Every unnecessary tool call wastes tokens — minimize tool calls for simple tasks
- **Figma MCP**: only call when user explicitly provides a Figma URL or says "Figmadan ol". Never call speculatively or "just to check" — and fetch only what the current task needs

---

## 2. Tech Stack

- Projects are always bootstrapped with **Vite**
- **TypeScript** is always used
- **Strict typing** is enforced everywhere
- `any` is **forbidden** (only allowed in extreme edge cases with a comment explaining why)

---

## 3. Folder Architecture (Simplified Feature-Sliced Design)

```
src/
├── app/          # App config, providers, router
├── pages/        # Page components
├── widgets/      # Large UI blocks
├── features/     # Business features
├── entities/     # Core domain (models, types)
├── routes/       # all page routes 
└── shared/
    ├── ui/       # Reusable UI components
    ├── hooks/    # Global hooks
    ├── utils/    # Helper functions
    ├── lib/      # Core logic
    ├── constants/
    ├── styles/
    ├── assets/
    └── i18n/     # Translations
```

---

## 4. Component Rules

- Every component must be **modular and small**
- Maximum **150–200 lines**; if larger — split into smaller components
- A component contains only **UI + minimal logic**
- **Forbidden inside components:** API calls, heavy business logic

---

## 5. Page Rules

- Maximum **300–400 lines**
- Pages act as **orchestrators only**: they call components and use hooks
- **No business logic inside pages**

---

## 6. Hooks & Logic Separation

- Every API call, state logic, and side effect → goes into a dedicated **custom hook**
- Global hooks: `shared/hooks/`
- Page-/module-specific hooks: `pages/[page]/hooks/` or `[module]/hooks/`
- **Split hooks by responsibility** — don't cram unrelated logic into one giant hook; one hook = one concern
- If a component only has 1–2 simple functions or effects, keeping them inline is fine — don't force an extraction for trivial logic
- Goal: a component should stay simple enough that another developer can read, understand, and refactor it without digging through unrelated logic
- **React Query hooks** live in the current page's/module's own `hooks/` folder — never scatter or mix them across unrelated modules; a developer should always find data-fetching hooks next to the feature that uses them

---

## 7. Business Logic

- Business logic **never lives inside components**
- It belongs in: `hooks`, `utils`, or `services`

---

## 8. Utils & Constants

- Shared utility functions: `shared/utils/`
- Constants: `shared/constants/`

---

## 9. Types

- Don't dump every type into one global `types.ts`
- For each component, page, or module → create a local `types.ts` (or `[Name].types.ts`) in its own folder and keep its types there
- Truly shared/cross-cutting types (used by 2+ modules) → `entities/` per the folder architecture
- Goal: keep components and modules self-contained — a developer shouldn't have to search a giant shared file to find a type that belongs to a single component

---

## 10. Table Columns — Always in a Hook

- Table columns must be **defined inside a hook** and returned from it
- Reason: columns may depend on state, translations (`t`), permissions (roles), or dynamic action buttons
- Complex components inside columns must also be extracted into separate components

---

## 11. Reusable & Global Components

Before writing any new UI piece, check in this order:
1. **Existing project components** in `shared/ui/` — reuse them, don't recreate
2. **Ant Design (`antd`)** — it already covers most UI patterns; use it before building from scratch
3. **Only if neither fits** → build your own

- Newly built components must be **small, universal, and reusable** — written so other pages can use them too
- Place such components in `shared/ui/`, not buried inside one page/feature
- If any component ends up used in **2 or more pages** → it belongs in `shared/ui/`

---

## 12. Assets & Icons

- Extract all images and SVGs from Figma
- Images: `shared/assets/images/`
- Icons: `shared/assets/icons/`
- Naming: **kebab-case**, meaningful names
- **Icon priority:** first check **React Icons** — if it exists there, use it; only save an SVG when it's not available there

---

## 13. Styling

- Primary styling: **Tailwind CSS** — write styles as Tailwind utility classes
- Don't dump styles into global `.css`/`.scss` files — it makes the codebase hard to read and trace
- If Tailwind classes for a component/page get too long or hard to read → create a `[Name].module.css` **next to that component/page** and move the complex styles there (scoped, not global)

---

## 14. Theme System

**Fayl:** `src/index.css` — `@theme` direktivi (Tailwind v4)

Barcha dizayn tokenlari `@theme` blokida aniqlanadi va **Tailwind utility class** sifatida ishlatiladi.

### Qoidalar

**TAQIQLANGAN — komponent className da:**
```tsx
// ❌ CSS variable — ishlatma
className="bg-[var(--color-primary-600)]"
className="text-[var(--text-strong)]"

// ❌ Arbitrary hex — ishlatma
className="text-[#222]"
className="bg-[#dee5ed]"
```

**TO'G'RI — Tailwind token:**
```tsx
// ✅ @theme da aniqlangan token
className="bg-primary-600"
className="text-neutral-900"
className="border-line"
className="shadow-header"
className="text-brand-dark"
```

### Mavjud token guruhlari

| Guruh | Misol classlar |
|-------|---------------|
| Brand primary | `bg-primary-600`, `text-primary-300`, `border-primary-700` |
| Brand variants | `text-brand-dark` (#2957a5), `text-brand-cyan` (#00b0f0) |
| Neutral | `bg-neutral-0`, `bg-neutral-50`, `text-neutral-400`, `text-neutral-900` |
| Line/border | `border-line` (#dee5ed — Figma border) |
| Semantic | `bg-success-light`, `text-error-dark`, `bg-warning-light` |
| Shadows | `shadow-sm`, `shadow-lg`, `shadow-header` |
| Z-index | `z-sticky` (200), `z-modal` (300), `z-dropdown` (100) |

### CSS fayllarida (index.css, .scss)

CSS fayllarida `var()` ishlatish **ruxsat etiladi**:
```css
/* ✅ CSS faylda — OK */
body { color: var(--color-neutral-500); }
```

### Yangi rang qo'shish

`src/index.css` → `@theme` blokiga qo'sh:
```css
--color-brand-new: #xxxxxx;   /* → bg-brand-new, text-brand-new */
```

---

## 15. Memoization (IMPORTANT)

- `React.memo`, `useMemo`, `useCallback` — use **only when actually needed**
- Overusing them wastes resources and makes code harder to maintain
- **With TanStack Query:** data is already cached — wrapping it in `useMemo` is double optimization and usually pointless

---

## 16. Lazy Loading

The following must be **lazy loaded**:
- Pages (opened via router)
- Large UI components (tables, modals, charts)
- Rarely used components

---

## 17. Error Handling

- Every layer must be wrapped with an **ErrorBoundary**
- Production: show a user-friendly error UI
- Development: display the full error cause clearly

---

## 18. Forms & Inputs

- Form logic → in a dedicated **hook**
- Validation → in a dedicated **schema** (Zod or Yup)

---

## 19. Linting & Formatting

- **ESLint** and **Prettier** are mandatory

---

## 20. API Layer Rules

- All API communication lives in a **centralized service layer**
- A separate service is created for each API endpoint
- **TanStack Query** (or equivalent) is used for data fetching
- API calls are **never written inside components** — always via a hook or service
- Error handling is managed separately for each API call

---

## 21. State Management

- Global state: **only when necessary**
- Local state: stays inside the component or hook
- Avoid creating unnecessary global state; keep state **minimal**

---

## 22. Loading States

- Every async operation must have a **loading state**
- Use **Skeleton UI** or a **Spinner**

---

## 23. Dependency Management

- Do not add unnecessary dependencies
- Before adding a large library, evaluate: performance, security, and cybersecurity compliance

---

## 24. Environment Variables

- API URLs, configs, and secret keys → stored in `.env` files

---

## 25. Security

- User input: **always validated**
- Sensitive data: **never stored on the frontend**

---

## 26. Accessibility (a11y)

- Use semantic HTML elements correctly
- Always add `aria-label` where needed
- Keyboard navigation must be supported

---

## 27. Git & Commit Rules

Use Conventional Commits:
```
feat: (description)
fix: (description)
refactor: (description)
```
- Commits must be **small and descriptive**

---

## 28. i18n & Text Rules

- Translation keys = **Figma text as-is** (usually Russian): `t('Для бизнеса')`, `t('На карте')`, `t('Найти')`
- **NEVER modify text extracted from Figma** — no translating, trimming, formatting, or normalizing it. Even a single-character difference is a failure. Copy text exactly as-is.
- **Forbidden:** nested object keys (`t('footer.business.title')`, `t('nav.login')`), aliases, grouped keys, renamed keys
- Structure must be **flat and minimal** — the same text is both key and value, stored in one JSON file:
  ```json
  {
    "Нежилые объекты": "Нежилые объекты"
  }
  ```
- Only fill **`src/locales/uz/translation.json`** — leave `ru` and `en` for the user to translate
- Always render text via `t("TEXT_FROM_FIGMA")` — **never hardcode text** in components

---

## 29. Figma → Code Rules

- When a Figma URL is given, **clone it exactly** — colors, spacing, pixels, and typography must match the design 1:1 (pixel-perfect)
- Take styles **directly from Figma** and map them onto the design tokens from section 14 (Theme System) — don't reinterpret, simplify, or rewrite the design
- Don't break or "clean up" the design to make it easier to code — the visual result must match Figma
- Build the resulting components/pages following the folder architecture and component/page rules (sections 3–5, 11)
- Keep Figma MCP usage scoped to the current task — see section 1 (Token Efficiency & Task Scope)

---

## 30. Permissions

- You have full autonomy to make all changes without asking for confirmation
- Do not ask "Should I proceed?", "Can I modify this?", or similar questions
- Make all necessary changes directly and report what was done

---

## 31. Final Principles

- Always follow **Clean Code**, **DRY**, and **SOLID**
- Goal: **pixel-perfect UI**, zero unnecessary resources, a clean and scalable architecture
- Keep this file in sync — when a convention changes, update CLAUDE.md to match
