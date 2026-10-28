import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/ritmo/app-shell";
import { TaskDialogProvider } from "@/components/ritmo/task-dialog";
import { categoriesQuery, goalsQuery, tasksQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_shell")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(tasksQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(goalsQuery),
    ]),
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <TaskDialogProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </TaskDialogProvider>
  );
}
