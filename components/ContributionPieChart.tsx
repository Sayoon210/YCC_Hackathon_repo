'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContributionPieChartProps {
    tasks: Task[];
}

interface ChartSegment {
    name: string;
    value: number;
    fill: string;
    isAchieved: boolean;
    totalForUser: number;
    percentage: number;
    [key: string]: any;
}

// Base colors for different users
const USER_COLORS = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
];

export function ContributionPieChart({ tasks }: ContributionPieChartProps) {
    const { chartData, totalProjectScore } = useMemo(() => {
        const userStats: { [key: string]: { total: number; achieved: number; name: string } } = {};
        let grandTotal = 0;

        // 1. Process Data
        tasks.forEach(task => {
            if (!task.assignee_name) return;

            const name = task.assignee_name;
            if (!userStats[name]) {
                userStats[name] = { total: 0, achieved: 0, name };
            }

            const taskTotal = task.total_score || 0;
            const taskAchieved = task.achieved_score || 0;

            userStats[name].total += taskTotal;
            userStats[name].achieved += taskAchieved;
            grandTotal += taskTotal;
        });

        // 2. Transform for Recharts
        const data: ChartSegment[] = [];
        Object.values(userStats).forEach((stat) => {
            // Deterministic color assignment based on name hash
            let hash = 0;
            for (let i = 0; i < stat.name.length; i++) {
                hash = stat.name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % USER_COLORS.length;
            const baseColor = USER_COLORS[index];

            const remaining = stat.total - stat.achieved;
            const percentage = stat.total > 0 ? Math.round((stat.achieved / stat.total) * 100) : 0;

            // Segment 1: Achieved (Vivid)
            if (stat.achieved > 0) {
                data.push({
                    name: stat.name,
                    value: stat.achieved,
                    fill: baseColor,
                    isAchieved: true,
                    totalForUser: stat.total,
                    percentage
                });
            }

            // Segment 2: Remaining (Pale/Transparent)
            if (remaining > 0) {
                data.push({
                    name: stat.name,
                    value: remaining,
                    fill: `${baseColor}4D`, // ~30% opacity (Hex 4D is approx 30%)
                    isAchieved: false,
                    totalForUser: stat.total,
                    percentage
                });
            }
        });

        return { chartData: data, totalProjectScore: grandTotal };
    }, [tasks]);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as ChartSegment;
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg text-sm">
                    <p className="font-bold mb-1">{data.name}</p>
                    <p className="text-muted-foreground">
                        Progress: <span className="font-medium text-foreground">{Math.round(payload[0].value)}</span> / {data.totalForUser} pts
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        ({data.percentage}% Completed)
                    </p>
                    <div className="mt-2 text-xs flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }}></span>
                        <span>{data.isAchieved ? 'Achieved' : 'Remaining'}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (totalProjectScore === 0) {
        return null;
    }

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Project Contribution & Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                stroke="none"
                                paddingAngle={2}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                <Label
                                    value={totalProjectScore}
                                    position="center"
                                    className="fill-foreground text-4xl font-bold"
                                />
                                <Label
                                    value="Total Points"
                                    position="center"
                                    dy={25}
                                    className="fill-muted-foreground text-sm"
                                />
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
