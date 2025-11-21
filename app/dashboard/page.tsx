import { getTasks, getSystemLogs, getCurrentUser } from '@/app/actions';
import { redirect } from 'next/navigation';
import { ContributionPieChart } from '@/components/ContributionPieChart';
import { ActivityLogList } from '@/components/ActivityLogList';

export default async function DashboardPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    const tasks = await getTasks();
    const logs = await getSystemLogs();

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview of team performance and system activity.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Charts (Takes up 2 columns on large screens) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4">Project Contribution</h2>
                            <ContributionPieChart tasks={tasks} />
                        </div>
                    </div>

                    {/* Right Column: Activity Log */}
                    <div className="lg:col-span-1">
                        <ActivityLogList logs={logs} />
                    </div>
                </div>
            </div>
        </main>
    );
}
