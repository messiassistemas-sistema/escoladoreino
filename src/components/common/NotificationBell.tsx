import { useState, useEffect } from "react";
import { Bell, Check, ExternalLink, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Notification Type Definition
type Notification = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    type: 'info' | 'warning' | 'success' | 'error';
    link?: string | null;
    created_at: string;
};

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch Notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            // For MVP, we fetch all non-archived notifications. 
            // Assuming we have a 'notifications' table.
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) {
                console.error("Error fetching notifications", error);
                return [];
            }
            return data as Notification[];
        },
        refetchInterval: 30000, // Poll every 30s
    });

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    // Refetch if global (user_id is null) or specific to this user
                    // Note: Supabase Realtime filters by RLS if enabled, 
                    // but for global notifications (user_id is null), we just want to know ANY insert happened
                    // that we are allowed to see.
                    queryClient.invalidateQueries({ queryKey: ["notifications"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Mark as Read Mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    // Mark All as Read Mutation
    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length > 0) {
                const { error } = await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const getIconColor = (type: string) => {
        switch (type) {
            case 'warning': return "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400";
            case 'success': return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
            case 'error': return "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400";
            default: return "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
                >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0 rounded-xl border-border shadow-2xl mr-4" align="end">
                <div className="flex items-center justify-between border-b p-4 bg-muted/30">
                    <div>
                        <h4 className="font-semibold text-sm">Notificações</h4>
                        <p className="text-xs text-muted-foreground">
                            Você tem {unreadCount} mensagens não lidas
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/5"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            Marcar lidas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] p-4 text-center text-muted-foreground">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Inbox className="h-6 w-6 opacity-40" />
                            </div>
                            <p className="text-sm font-medium">Tudo limpo!</p>
                            <p className="text-xs max-w-[180px]">Nenhuma nova notificação por enquanto.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 transition-colors hover:bg-muted/40 group",
                                        !notification.read ? "bg-muted/20" : ""
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn("mt-1 min-w-[32px] h-8 w-8 rounded-full flex items-center justify-center shrink-0", getIconColor(notification.type))}>
                                            <Bell className="h-4 w-4" />
                                        </div>

                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={cn("text-sm leading-tight pr-2", !notification.read ? "font-semibold text-foreground" : "text-foreground/80")}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                                </span>
                                            </div>

                                            <p className="text-xs text-muted-foreground leading-snug break-words">
                                                {notification.message}
                                            </p>

                                            {notification.link && (
                                                <Link
                                                    to={notification.link}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2"
                                                    onClick={() => {
                                                        if (!notification.read) markAsReadMutation.mutate(notification.id);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    Ver detalhes <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            )}
                                        </div>

                                        {!notification.read && (
                                            <div className="shrink-0 -mr-2 -mt-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-background/80 z-50 relative"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log("Marking as read clicked:", notification.id);
                                                        markAsReadMutation.mutate(notification.id);
                                                    }}
                                                    title="Marcar como lida"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
