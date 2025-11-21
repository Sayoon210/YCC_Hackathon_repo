import TaskList from '@/components/TaskList';
import SupabaseTest from '@/components/SupabaseTest';
import { getTasks, getUsers } from '@/app/actions';

// This is a Server Component
export default async function TaskPage() {
  const tasks = await getTasks();
  const users = await getUsers();

  return (
    <main className="min-h-screen bg-background p-8">
      <SupabaseTest />
      <TaskList initialTasks={tasks} users={users} />
    </main>
  );
}
