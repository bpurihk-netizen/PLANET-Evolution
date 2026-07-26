---
name: Hooks before early return
description: React rule violation causing "Rendered more hooks than during the previous render" crash in InfoPanel
---

## Rule
All `useState`, `useEffect`, `useCallback`, `useMemo` calls must appear BEFORE any conditional `return null` statement in a React component.

**Why:** React tracks hooks by call order per render. If an early return is hit on some renders but not others, the hook count changes → crash.

**How to apply:** Whenever a component has `if (!something) return null` as a guard, scan every hook call below it and move them above the guard. For `useCallback`/`useMemo` that depend on post-guard values (e.g. `quizConstellationId`), make those values nullable and guard inside the callback instead.

**Incident:** Task #14 merge added `const handleQuizCorrect = useCallback(...)` after `if (!body) return null` in InfoPanel.tsx. Fixed by moving the useCallback above the guard.
