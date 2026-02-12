
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Loader2,
    Shield,
    LayoutDashboard,
    Layout,
    Mail,
    School,
    BookOpen,
    Calendar,
    Bell,
    MessageSquare,
    Users,
    UserCheck,
    GraduationCap,
    ClipboardList,
    FileText,
    CreditCard,
    Settings,
    HelpCircle,
    Lock,
    ArrowLeft,
    CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ROLES = [
    { key: 'secretary', label: 'Secretaria', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { key: 'treasurer', label: 'Tesouraria', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { key: 'teacher', label: 'Professor', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' }
];

interface PermissionDef {
    key: string;
    label: string;
    description: string;
    icon: any;
}

const PERMISSIONS: Record<string, { label: string, icon: any, items: PermissionDef[] }> = {
    'Visão Geral': {
        label: "Visão Geral",
        icon: LayoutDashboard,
        items: [
            { key: 'dashboard.view', label: 'Visualizar Dashboard', description: 'Acesso aos indicadores principais', icon: LayoutDashboard },
            { key: 'site.edit', label: 'Editor do Site', description: 'Alterar conteúdo do site público', icon: Layout },
            { key: 'messages.view', label: 'Mensagens', description: 'Ler mensagens de contato', icon: Mail },
        ]
    },
    'Acadêmico': {
        label: "Gestão Acadêmica",
        icon: School,
        items: [
            { key: 'classes.manage', label: 'Turmas', description: 'Criar e editar turmas', icon: School },
            { key: 'subjects.manage', label: 'Disciplinas', description: 'Gerenciar grade curricular', icon: BookOpen },
            { key: 'schedule.view', label: 'Cronograma', description: 'Visualizar horários de aula', icon: Calendar },
            { key: 'notices.manage', label: 'Mural de Avisos', description: 'Postar avisos para alunos', icon: Bell },
            { key: 'whatsapp.send', label: 'Disparo WhatsApp', description: 'Enviar mensagens em massa', icon: MessageSquare },
        ]
    },
    'Pessoas': {
        label: "Pessoas & Alunos",
        icon: Users,
        items: [
            { key: 'students.view', label: 'Alunos', description: 'Acesso à lista e perfil de alunos', icon: Users },
            { key: 'enrollments.view', label: 'Matrículas Pendentes', description: 'Aprovar novos alunos', icon: UserCheck },
            { key: 'teachers.view', label: 'Professores', description: 'Visualizar lista de docentes', icon: GraduationCap },
            { key: 'attendance.manage', label: 'Chamada', description: 'Realizar registro de presença', icon: UserCheck },
            { key: 'grades.manage', label: 'Notas', description: 'Lançar e corrigir notas', icon: ClipboardList },
        ]
    },
    'Financeiro': {
        label: "Financeiro",
        icon: CreditCard,
        items: [
            { key: 'financial.view', label: 'Pagamentos', description: 'Gerenciar mensalidades e caixa', icon: CreditCard },
        ]
    },
    'Recursos': {
        label: "Recursos",
        icon: FileText,
        items: [
            { key: 'materials.manage', label: 'Materiais Didáticos', description: 'Upload de arquivos e apostilas', icon: FileText },
        ]
    },
    'Administração': {
        label: "Sistema",
        icon: Settings,
        items: [
            { key: 'users.manage', label: 'Usuários', description: 'Criar contas de acesso', icon: Users },
            { key: 'settings.manage', label: 'Configurações', description: 'Ajustes globais do sistema', icon: Settings },
            { key: 'permissions.manage', label: 'Permissões', description: 'Gerenciar este painel de acesso', icon: Shield },
            { key: 'help.view', label: 'Ajuda', description: 'Acesso à Central de Ajuda', icon: HelpCircle },
        ]
    }
};

export default function PermissionsManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch all current permissions
    const { data: rolePermissions, isLoading } = useQuery({
        queryKey: ['role_permissions_all'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('role_permissions')
                .select('*');
            if (error) throw error;
            return data;
        }
    });

    // Mutation to toggle permission
    const togglePermissionMutation = useMutation({
        mutationFn: async ({ role, permission, hasPermission }: { role: string, permission: string, hasPermission: boolean }) => {
            if (hasPermission) {
                const { error } = await supabase
                    .from('role_permissions')
                    .delete()
                    .match({ role, permission });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('role_permissions')
                    .insert({ role, permission });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['role_permissions_all'] });
            toast({
                title: "Permissão atualizada",
                description: "As alterações já estão em vigor.",
                duration: 1500
            });
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Erro ao atualizar", variant: "destructive" });
        }
    });

    const handleToggle = (role: string, permission: string) => {
        const hasPermission = rolePermissions?.some(rp => rp.role === role && rp.permission === permission) || false;
        togglePermissionMutation.mutate({ role, permission, hasPermission });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 animate-spin border-t-primary"></div>
                    <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground animate-pulse">Carregando permissões...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-muted">
                        <Link to="/admin">
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            Controle de Acesso
                            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[10px] tracking-wider font-bold">
                                V2.1
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie as permissões e níveis de acesso do sistema
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50">
                    <div className="flex -space-x-2">
                        {ROLES.map(role => (
                            <div key={role.key} className={cn("h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold ring-2 ring-transparent transition-all hover:scale-110 z-10 hover:z-20 cursor-help", role.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 '))} title={role.label}>
                                {role.label.substring(0, 2).toUpperCase()}
                            </div>
                        ))}
                    </div>
                    <div className="h-4 w-px bg-border/50 mx-1"></div>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Sistema Ativo
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden rounded-xl">
                <CardHeader className="bg-muted/10 border-b border-border/50 py-4 px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Matriz de Segurança</span>
                        </div>
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-border/50 text-[10px] font-mono">
                            Auto-Save: ON
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-none">
                        <Table>
                            <TableHeader className="sticky top-0 z-20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
                                <TableRow className="hover:bg-transparent border-b border-border/50 shadow-sm">
                                    <TableHead className="w-[40%] py-5 pl-8 text-xs font-bold tracking-wider uppercase text-muted-foreground">Recurso</TableHead>
                                    {ROLES.map(role => (
                                        <TableHead key={role.key} className="text-center w-[20%] py-4">
                                            <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
                                                <Badge variant="outline" className={cn("py-1.5 px-4 text-xs font-bold uppercase tracking-wider transition-all group-hover:scale-105 group-hover:shadow-md", role.color)}>
                                                    {role.label}
                                                </Badge>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(PERMISSIONS).map(([groupName, groupData]) => (
                                    <>
                                        <TableRow key={groupName} className="bg-muted/30 hover:bg-muted/40 border-y border-border/40">
                                            <TableCell colSpan={ROLES.length + 1} className="py-3 pl-8">
                                                <div className="flex items-center gap-2.5 font-bold text-sm text-foreground/80">
                                                    <div className="p-1.5 rounded-md bg-background border border-border/50 shadow-sm text-primary">
                                                        <groupData.icon className="h-4 w-4" />
                                                    </div>
                                                    {groupData.label}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {groupData.items.map((perm, idx) => (
                                            <TableRow key={perm.key} className="group hover:bg-muted/10 transition-colors border-b border-border/10 last:border-0 relative">
                                                <TableCell className="pl-8 py-5 align-top">
                                                    <div className="flex flex-col gap-1.5 pr-4 relative">
                                                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                                            {perm.label}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-medium leading-relaxed max-w-md">
                                                            {perm.description}
                                                        </span>
                                                        {/* Hover indicator line */}
                                                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary/50 group-hover:h-full transition-all duration-300 rounded-r-full"></div>
                                                    </div>
                                                </TableCell>
                                                {ROLES.map(role => {
                                                    const isGranted = rolePermissions?.some(rp => rp.role === role.key && rp.permission === perm.key);
                                                    const isPending = togglePermissionMutation.isPending && togglePermissionMutation.variables?.role === role.key && togglePermissionMutation.variables?.permission === perm.key;

                                                    return (
                                                        <TableCell key={`${role.key}-${perm.key}`} className="text-center p-0 align-middle">
                                                            <div className="flex items-center justify-center w-full h-full min-h-[80px]">
                                                                <div
                                                                    className={cn(
                                                                        "relative flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-300 cursor-pointer group/check",
                                                                        isGranted ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30",
                                                                    )}
                                                                    onClick={() => handleToggle(role.key, perm.key)}
                                                                >
                                                                    {isPending ? (
                                                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                                    ) : (
                                                                        <Checkbox
                                                                            checked={isGranted}
                                                                            onCheckedChange={() => handleToggle(role.key, perm.key)}
                                                                            className={cn(
                                                                                "h-5 w-5 border-2 transition-all data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary shadow-sm",
                                                                                !isGranted && "opacity-40 group-hover/check:opacity-100 border-muted-foreground/40"
                                                                            )}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
