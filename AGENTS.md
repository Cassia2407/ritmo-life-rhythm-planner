<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Tasks and calendar activities share one `tasks` table; a task with `due_date` shows on the calendar. Why: one reusable form and one source of truth.
- All signed-in pages live under `src/routes/_authenticated/_shell/`; `_shell/route.tsx` renders the app shell and the global task dialog provider. Why: shell and dialogs persist across navigation.
- Data reads/writes go through `src/lib/data.ts` (browser client + RLS, react-query keys = table names). Why: single place for queries and cache invalidation.
- Pure business rules (overdue, goal progress, habit schedule/streak, time validation) live in `src/lib/ritmo.ts` with tests in `src/test/ritmo.test.ts`. Why: rules stay testable without the UI.
- Every user table has `user_id default auth.uid()` and an owner-only RLS policy. Why: each user sees only their own records.
