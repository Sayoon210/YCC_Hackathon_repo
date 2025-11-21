'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash, Save, X, FileText } from 'lucide-react';
import { Task } from '@/types/task';
import { claimTask, submitActivity } from '@/app/actions';
import { ActivityCard } from '@/components/ActivityCard';
import { AchievementSection } from '@/components/AchievementSection';

interface TaskBlockProps {
    task: Task;
    onUpdate: (updatedTask: Task) => void;
    onDelete: (taskId: number) => void;
    onVote: (taskId: number, score: number) => void;
    defaultEditing?: boolean;
    currentUserId?: string;
}

export function TaskBlock({ task, onUpdate, onDelete, onVote, defaultEditing = false, currentUserId }: TaskBlockProps) {
    const [isEditing, setIsEditing] = useState(defaultEditing);
    const [editedTask, setEditedTask] = useState<Task>(task);
    const [myVoteScore, setMyVoteScore] = useState<number[]>([task.my_vote || 0]);

    // Activity Report State
    const [isWritingReport, setIsWritingReport] = useState(false);
    const [reportTitle, setReportTitle] = useState('');
    const [reportContent, setReportContent] = useState('');
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<typeof activities[0] | null>(null);

    const isAssignee = task.member_id === currentUserId;
    const activities = task.activities || [];

    // Color Interpolation Logic
    const getAchievementColor = (achieved: number, total: number) => {
        if (total === 0) return undefined;
        const ratio = Math.min(Math.max(achieved / total, 0), 1); // Clamp 0-1

        // Gradient Stops: Red -> Orange -> Yellow -> Light Green -> Green
        const stops = [
            { pos: 0.0, color: [220, 40, 40] },   // Red
            { pos: 0.25, color: [255, 140, 0] },  // Orange
            { pos: 0.5, color: [255, 200, 0] },   // Yellow
            { pos: 0.75, color: [130, 220, 0] },  // Light Green
            { pos: 1.0, color: [0, 160, 120] }    // Teal/Green
        ];

        // Find the segment we are in
        let start = stops[0];
        let end = stops[stops.length - 1];

        for (let i = 0; i < stops.length - 1; i++) {
            if (ratio >= stops[i].pos && ratio <= stops[i + 1].pos) {
                start = stops[i];
                end = stops[i + 1];
                break;
            }
        }

        // Interpolate within the segment
        const segmentRatio = (ratio - start.pos) / (end.pos - start.pos);

        const r = Math.round(start.color[0] + (end.color[0] - start.color[0]) * segmentRatio);
        const g = Math.round(start.color[1] + (end.color[1] - start.color[1]) * segmentRatio);
        const b = Math.round(start.color[2] + (end.color[2] - start.color[2]) * segmentRatio);

        return `rgb(${r}, ${g}, ${b})`;
    };

    const achievementColor = task.achieved_score !== null && task.total_score > 0
        ? getAchievementColor(task.achieved_score, task.total_score)
        : undefined;

    const handleSave = () => {
        onUpdate(editedTask);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (!task.title && !task.description) {
            onDelete(task.id);
        } else {
            setEditedTask(task);
            setIsEditing(false);
        }
    };

    const handleVoteChange = (value: number[]) => {
        setMyVoteScore(value);
        onVote(task.id, value[0]);
    };

    const handleSubmitActivity = async () => {
        const formData = new FormData();
        formData.append('title', reportTitle);
        formData.append('content', reportContent);
        if (reportFile) {
            formData.append('file', reportFile);
        }

        await submitActivity(task.id, formData);

        // Reset form
        setIsWritingReport(false);
        setReportTitle('');
        setReportContent('');
        setReportFile(null);
    };

    if (isEditing) {
        return (
            <Card className="mb-4 shadow-md">
                <CardHeader className="pb-2">
                    <Input
                        value={editedTask.title}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        placeholder="Task Title"
                        className="font-bold text-lg"
                    />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={editedTask.description || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                        placeholder="Task Description..."
                        className="min-h-[100px]"
                    />
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="relative mb-16">
            {/* Activity Cards - Stacked to the right */}
            {activities.length > 0 && activities.map((activity, index) => {
                const offsetRight = (index + 1) * 12; // 12px to the right per card

                return (
                    <div
                        key={activity.id}
                        className="absolute top-0 left-0 right-0 cursor-pointer"
                        style={{
                            transform: `translateX(${offsetRight}px)`,
                            zIndex: activities.length - index,
                        }}
                        onClick={() => setSelectedActivity(activity)}
                    >
                        <Card
                            className="shadow-lg border-2 hover:shadow-2xl transition-shadow"
                            style={{
                                backgroundColor: `rgb(${219 - index * 10} ${234 - index * 5} 254)`,
                            }}
                        >
                            <CardContent className="pt-6">
                                <ActivityCard activity={activity} />
                            </CardContent>
                        </Card>
                    </div>
                );
            })}

            {/* Main Task Card */}
            <Card
                className="hover:shadow-xl transition-all relative bg-white"
                style={{
                    zIndex: activities.length + 10,
                    // Reverted to white background as requested
                }}
            >
                <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <CardTitle
                        className="text-3xl font-extrabold transition-colors duration-300"
                        style={{
                            color: achievementColor || 'inherit'
                        }}
                    >
                        {task.title || 'Untitled Task'}
                    </CardTitle>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}>
                            <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
                        {task.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between mt-4 mb-4">
                        <div className="flex items-center gap-2">
                            {!task.member_id ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => { await claimTask(task.id); }}
                                    className="text-xs"
                                >
                                    🙋‍♂️ Claim Task
                                </Button>
                            ) : task.member_id === currentUserId ? (
                                <Badge variant="default" className="bg-green-600">
                                    ✓ My Task
                                </Badge>
                            ) : (
                                <Badge variant="secondary">
                                    Assigned to {task.assignee_name || 'Unknown'}
                                </Badge>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-3 font-medium">
                            <span className="bg-secondary px-2 py-1 rounded-md">Assigned Score: {task.total_score}</span>
                            <span className="bg-secondary px-2 py-1 rounded-md">Achievement: {task.achieved_score || '-'}</span>
                        </div>
                    </div>

                    {/* Voting Section */}
                    {!task.member_id ? (
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-muted-foreground">Score Voting</h4>
                                <Badge variant="outline" className="text-xs">Task must be claimed first</Badge>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg opacity-50">
                                <span className="text-sm font-medium w-24 text-muted-foreground">Your Score: 0</span>
                                <Slider value={[0]} max={10} step={0.5} className="flex-1" disabled />
                            </div>
                        </div>
                    ) : task.member_id === currentUserId ? (
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-muted-foreground">Score Voting</h4>
                                <Badge variant="outline" className="text-xs">Cannot vote on your own task</Badge>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg opacity-50">
                                <span className="text-sm font-medium w-24 text-muted-foreground">Your Score: 0</span>
                                <Slider value={[0]} max={10} step={0.5} className="flex-1" disabled />
                            </div>
                        </div>
                    ) : (
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold">Score Voting</h4>
                                {task.my_vote !== undefined && (
                                    <Badge variant="secondary" className="text-xs">You voted: {task.my_vote}</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-secondary/20 rounded-lg">
                                <span className="text-sm font-medium w-24">Your Score: {myVoteScore[0]}</span>
                                <Slider
                                    value={myVoteScore}
                                    onValueChange={handleVoteChange}
                                    max={10}
                                    step={0.5}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Achievement Evaluation Section */}
                    {task.member_id && (
                        <div className="border-t pt-4 mt-4">
                            <AchievementSection task={task} currentUserId={currentUserId} />
                        </div>
                    )}

                    {/* Activity Reports - Visible to all */}
                    {task.member_id && (
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold">Progress Reports</h4>
                                <Badge variant="outline" className="text-xs">
                                    {activities.length} report{activities.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>

                            {/* Write Report Button - Assignee only */}
                            {isAssignee && !isWritingReport && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsWritingReport(true)}
                                    className="w-full mb-3"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Write Progress Report
                                </Button>
                            )}

                            {/* Write Report Form - Assignee only */}
                            {isAssignee && isWritingReport && (
                                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                                    <Input
                                        placeholder="Report Title"
                                        value={reportTitle}
                                        onChange={(e) => setReportTitle(e.target.value)}
                                    />
                                    <Textarea
                                        placeholder="Describe your progress, challenges, or updates..."
                                        value={reportContent}
                                        onChange={(e) => setReportContent(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                    <Input
                                        type="file"
                                        accept="*/*"
                                        onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                                        className="text-sm"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setIsWritingReport(false);
                                                setReportTitle('');
                                                setReportContent('');
                                                setReportFile(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSubmitActivity}
                                            disabled={!reportTitle.trim() || !reportContent.trim()}
                                        >
                                            Submit Report
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Info message */}
                            {activities.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    No progress reports yet. {isAssignee && "Click 'Write Progress Report' to add one."}
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    📚 {activities.length} report{activities.length !== 1 ? 's' : ''} stacked to the right
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Activity Report Details</DialogTitle>
                    </DialogHeader>
                    {selectedActivity && (
                        <div className="mt-4">
                            <ActivityCard activity={selectedActivity} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
