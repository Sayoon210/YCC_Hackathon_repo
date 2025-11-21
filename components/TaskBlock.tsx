'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
            <div className="glass-card mb-4 p-6">
                <div className="pb-4">
                    <Input
                        value={editedTask.title}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        placeholder="Task Title"
                        className="font-bold text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                </div>
                <div className="space-y-4">
                    <Textarea
                        value={editedTask.description || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                        placeholder="Task Description..."
                        className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" size="sm" onClick={handleCancel} className="text-white/70 hover:text-white hover:bg-white/10">
                        <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-primary/90">
                        <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                </div>
            </div>
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
                        className="absolute top-0 left-0 right-0 bottom-0 cursor-pointer" // Added bottom-0 to match height
                        style={{
                            transform: `translateX(${offsetRight}px)`,
                            zIndex: activities.length - index,
                        }}
                        onClick={() => setSelectedActivity(activity)}
                    >
                        <div
                            className="h-full w-full rounded-xl border border-white/10 shadow-lg transition-all hover:brightness-110"
                            style={{
                                backgroundColor: `rgba(30, 41, 59, ${0.8 - index * 0.1})`, // Plain slate color, fading out slightly
                            }}
                        >
                            {/* Content removed for plain box look */}
                        </div>
                    </div>
                );
            })}

            {/* Main Task Card */}
            <div
                className="glass-card p-6 hover:shadow-2xl transition-all relative"
                style={{
                    zIndex: activities.length + 10,
                }}
            >
                <div className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <h3
                        className="text-3xl font-extrabold transition-colors duration-300"
                        style={{
                            color: achievementColor || '#ffffff'
                        }}
                    >
                        {task.title || 'Untitled Task'}
                    </h3>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="text-white/70 hover:text-white hover:bg-white/10">
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div>
                    <p className="text-sm text-white/70 whitespace-pre-wrap mb-4">
                        {task.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between mt-4 mb-4">
                        <div className="flex items-center gap-2">
                            {!task.member_id ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => { await claimTask(task.id); }}
                                    className="text-xs border-white/20 bg-white/5 text-white hover:bg-white/10"
                                >
                                    🙋‍♂️ Claim Task
                                </Button>
                            ) : task.member_id === currentUserId ? (
                                <Badge variant="default" className="bg-green-600/80 text-white border-0">
                                    ✓ My Task
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                                    Assigned to {task.assignee_name || 'Unknown'}
                                </Badge>
                            )}
                        </div>
                        <div className="text-xs text-white/60 flex gap-3 font-medium">
                            <span className="bg-white/10 px-2 py-1 rounded-md">Assigned Score: {task.total_score}</span>
                            <span className="bg-white/10 px-2 py-1 rounded-md">Achievement: {task.achieved_score || '-'}</span>
                        </div>
                    </div>

                    {/* Voting Section */}
                    {!task.member_id ? (
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white/80">Score Voting</h4>
                                <Badge variant="outline" className="text-xs text-white/50 border-white/20">Task must be claimed first</Badge>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg opacity-50">
                                <span className="text-sm font-medium w-24 text-white/50">Your Score: 0</span>
                                <Slider value={[0]} max={10} step={0.5} className="flex-1" disabled />
                            </div>
                        </div>
                    ) : task.member_id === currentUserId ? (
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white/80">Score Voting</h4>
                                <Badge variant="outline" className="text-xs text-white/50 border-white/20">Cannot vote on your own task</Badge>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg opacity-50">
                                <span className="text-sm font-medium w-24 text-white/50">Your Score: 0</span>
                                <Slider value={[0]} max={10} step={0.5} className="flex-1" disabled />
                            </div>
                        </div>
                    ) : (
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white/80">Score Voting</h4>
                                {task.my_vote !== undefined && (
                                    <Badge variant="secondary" className="text-xs bg-white/10 text-white border-white/20">You voted: {task.my_vote}</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                                <span className="text-sm font-medium w-24 text-white">Your Score: {myVoteScore[0]}</span>
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
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <AchievementSection task={task} currentUserId={currentUserId} />
                        </div>
                    )}

                    {/* Activity Reports - Visible to all */}
                    {task.member_id && (
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white/80">Progress Reports</h4>
                                <Badge variant="outline" className="text-xs text-white/50 border-white/20">
                                    {activities.length} report{activities.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>

                            {/* Write Report Button - Assignee only */}
                            {isAssignee && !isWritingReport && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsWritingReport(true)}
                                    className="w-full mb-3 border-white/20 bg-white/5 text-white hover:bg-white/10"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Write Progress Report
                                </Button>
                            )}

                            {/* Write Report Form - Assignee only */}
                            {isAssignee && isWritingReport && (
                                <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10 mb-3">
                                    <Input
                                        placeholder="Report Title"
                                        value={reportTitle}
                                        onChange={(e) => setReportTitle(e.target.value)}
                                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                    />
                                    <Textarea
                                        placeholder="Describe your progress, challenges, or updates..."
                                        value={reportContent}
                                        onChange={(e) => setReportContent(e.target.value)}
                                        className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                    />
                                    <Input
                                        type="file"
                                        accept="*/*"
                                        onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                                        className="text-sm text-white/70 file:bg-white/10 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-full hover:file:bg-white/20"
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
                                            className="text-white/70 hover:text-white hover:bg-white/10"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSubmitActivity}
                                            disabled={!reportTitle.trim() || !reportContent.trim()}
                                            className="bg-primary hover:bg-primary/90"
                                        >
                                            Submit Report
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Info message */}
                            {activities.length === 0 ? (
                                <p className="text-xs text-white/50 text-center py-2">
                                    No progress reports yet. {isAssignee && "Click 'Write Progress Report' to add one."}
                                </p>
                            ) : (
                                <p className="text-xs text-white/50 text-center py-2">
                                    📚 {activities.length} report{activities.length !== 1 ? 's' : ''} stacked to the right
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
                <DialogContent className="max-w-2xl glass-card border-white/10 text-white !bg-black/80">
                    <DialogHeader>
                        <DialogTitle>Activity Report Details</DialogTitle>
                    </DialogHeader>
                    {selectedActivity && (
                        <div className="mt-4">
                            <ActivityCard
                                activity={selectedActivity}
                                className="bg-transparent border-0 shadow-none text-white"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
