import TaskList from '@/components/TaskList';
import { getTasks, getCurrentUser } from '@/app/actions';
import { redirect } from 'next/navigation';

import { ContributionPieChart } from '@/components/ContributionPieChart';

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
            <div className="max-w-4xl mx-auto">
                <ContributionPieChart tasks={tasks} />
                <TaskList initialTasks={tasks} currentUserId={currentUser.id} />
            </div>
        </main>
    );
}
