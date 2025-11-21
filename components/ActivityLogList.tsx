'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Log {
    id: string;
    created_at: string;
    user_id: string;
    action_type: string;
    details: string;
    user: {
        name: string;
    };
}

interface ActivityLogListProps {
    logs: Log[];
}

export function ActivityLogList({ logs }: ActivityLogListProps) {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATE': return 'Task 추가';
            case 'UPDATE': return 'Task 수정';
            case 'DELETE': return 'Task 삭제';
            case 'CLAIM': return 'Task 접수';
            case 'REPORT': return '활동 보고';
            case 'REVIEW': return '평가';
            default: return action;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'UPDATE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'CLAIM': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'REPORT': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
            case 'REVIEW': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-full flex flex-col">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2 border-b">
                <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    실시간 활동 로그
                </h3>
                <Badge variant="outline" className="font-mono text-xs">
                    Live
                </Badge>
            </div>
            <ScrollArea className="flex-1 h-[600px]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">시간</TableHead>
                            <TableHead className="w-[100px]">사용자</TableHead>
                            <TableHead className="w-[120px]">활동 내용</TableHead>
                            <TableHead>서버 응답 (Details)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    아직 기록된 활동이 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {formatTime(log.created_at)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {log.user?.name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${getActionColor(log.action_type)}`}>
                                            {getActionLabel(log.action_type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {log.details}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
}
