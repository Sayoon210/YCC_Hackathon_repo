'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/types/task';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, LayoutDashboard, ListTodo } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
    user: User | null;
}

export function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    if (!user) return null;

    return (
        <nav className="glass sticky top-0 z-50 border-b-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white hover:text-cyan-400 transition-colors">
                            <div className="relative h-8 w-8">
                                <Image
                                    src="/fairload-logo.png"
                                    alt="Fairload Logo"
                                    fill
                                    className="object-contain invert"
                                />
                            </div>
                            <span>Fairload</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-6">
                            <Link
                                href="/dashboard"
                                className={`text-sm font-medium transition-colors hover:text-cyan-400 ${pathname === '/dashboard' ? 'text-cyan-400' : 'text-muted-foreground'
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/tasks"
                                className={`text-sm font-medium transition-colors hover:text-cyan-400 ${pathname === '/tasks' ? 'text-cyan-400' : 'text-muted-foreground'
                                    }`}
                            >
                                Tasks
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {user.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.role}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </nav>
    );
}
