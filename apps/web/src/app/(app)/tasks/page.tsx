import { AppHeader } from "@/components/app-header";
import { TasksWorkspace } from "@/components/tasks-workspace";

export default function TasksPage() {
  return (
    <>
      <AppHeader />
      <TasksWorkspace title="Tasks" />
    </>
  );
}
