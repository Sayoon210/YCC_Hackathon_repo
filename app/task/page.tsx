import TaskList from '@/components/TaskList';
import { getTasks, getCurrentUser } from '@/app/actions';
import { redirect } from 'next/navigation';

// This is a Server Component
export default async function TaskPage() {
    const currentUser = await getCurrentUser();

    // Protect the route - although middleware might handle this, double check is good
    if (!currentUser) {
        redirect('/login');
    }

    const tasks = await getTasks();

    return (
        <main className="min-h-screen bg-background p-8">
            <TaskList initialTasks={tasks} currentUserId={currentUser.id} />
        </main>
    );
}
