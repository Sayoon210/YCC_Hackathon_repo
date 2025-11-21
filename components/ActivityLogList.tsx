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
            case 'CREATE': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
            case 'UPDATE': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
            case 'DELETE': return 'bg-red-500/20 text-red-200 border-red-500/30';
            case 'CLAIM': return 'bg-green-500/20 text-green-200 border-green-500/30';
            case 'REPORT': return 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30';
            case 'REVIEW': return 'bg-pink-500/20 text-pink-200 border-pink-500/30';
            default: return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
        }
    };

    return (
        <div className="glass-card h-full flex flex-col border-white/10">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/10">
                <h3 className="tracking-tight text-sm font-medium flex items-center gap-2 text-white">
                    <Activity className="h-4 w-4 text-primary" />
                    실시간 활동 로그
                </h3>
                <Badge variant="outline" className="font-mono text-xs border-white/20 text-white/70">
                    Live
                </Badge>
            </div>
            <ScrollArea className="flex-1 h-[600px]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="w-[100px] text-white/60">시간</TableHead>
                            <TableHead className="w-[100px] text-white/60">사용자</TableHead>
                            <TableHead className="w-[120px] text-white/60">활동 내용</TableHead>
                            <TableHead className="text-white/60">서버 응답 (Details)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableCell colSpan={4} className="text-center text-white/50 h-24">
                                    아직 기록된 활동이 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} className="border-white/10 hover:bg-white/5">
                                    <TableCell className="font-mono text-xs text-white/50">
                                        {formatTime(log.created_at)}
                                    </TableCell>
                                    <TableCell className="font-medium text-white/90">
                                        {log.user?.name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 border ${getActionColor(log.action_type)}`}>
                                            {getActionLabel(log.action_type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-white/60">
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
