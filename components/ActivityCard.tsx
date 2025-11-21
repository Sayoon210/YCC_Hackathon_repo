'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from '@/types/task';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityCardProps {
    activity: Activity;
    className?: string;
}

export function ActivityCard({ activity, className }: ActivityCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                        <Badge variant="secondary" className="mr-2">Report #{activity.sequence}</Badge>
                        {activity.title}
                    </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleDateString()}
                </p>
            </CardHeader>
            <CardContent>
                <p className="text-sm whitespace-pre-wrap mb-2">{activity.content}</p>

                {activity.file_url && (
                    <a
                        href={activity.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                        <FileText className="h-3 w-3" />
                        <Download className="h-3 w-3" />
                        View attached file
                    </a>
                )}
            </CardContent>
        </Card>
    );
}
