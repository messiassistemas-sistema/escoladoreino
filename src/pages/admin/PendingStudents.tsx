import { useState } from "react";
import { motion } from "framer-motion";
import {
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Mail,
    CheckCircle,
    UserCheck,
    Loader2,
    Square,
    CheckSquare,
    ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsService, Student } from "@/services/studentsService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function PendingStudents() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkApproving, setIsBulkApproving] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);

    // Details Dialog State
    const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const { data: alunos = [], isLoading } = useQuery({
        queryKey: ["students"],
        queryFn: studentsService.getStudents,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
            studentsService.updateStudent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast({ title: "Aluno aprovado com sucesso!" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: studentsService.deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast({ title: "Solicitação recusada e excluída com sucesso!" });
        },
    });

    // Filter only PENDING students
    const pendingStudents = alunos.filter((aluno) => {
        const isPending = aluno.status === "pendente";
        const matchesSearch =
            aluno.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (aluno.email && aluno.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (aluno.registration_number && aluno.registration_number.includes(searchTerm));
        return isPending && matchesSearch;
    });

    const [approvingId, setApprovingId] = useState<string | null>(null);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === pendingStudents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingStudents.map(s => s.id));
        }
    };

    const handleApprove = async (student: Student) => {
        if (!window.confirm(`Deseja aprovar a matrícula de ${student.name}? Isso enviará as credenciais de acesso para o aluno.`)) {
            return;
        }

        setApprovingId(student.id);
        try {
            await studentsService.approveStudent(student.id);
            toast({
                title: "Aluno aprovado!",
                description: "Credenciais de acesso enviadas por E-mail e WhatsApp."
            });
            queryClient.invalidateQueries({ queryKey: ["students"] });
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao aprovar",
                description: "Não foi possível aprovar o aluno. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setApprovingId(null);
        }
    };

    const handleBulkApprove = async () => {
        if (!window.confirm(`Deseja aprovar ${selectedIds.length} matrículas selecionadas?`)) {
            return;
        }

        setIsBulkApproving(true);
        setBulkProgress(0);
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < selectedIds.length; i++) {
            try {
                await studentsService.approveStudent(selectedIds[i]);
                successCount++;
            } catch (error) {
                console.error(`Erro ao aprovar aluno ${selectedIds[i]}:`, error);
                errorCount++;
            }
            setBulkProgress(Math.round(((i + 1) / selectedIds.length) * 100));
        }

        toast({
            title: "Processamento concluído",
            description: `${successCount} aprovados, ${errorCount} erros.`,
        });

        setSelectedIds([]);
        setIsBulkApproving(false);
        queryClient.invalidateQueries({ queryKey: ["students"] });
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Tem certeza que deseja recusar e excluir ${selectedIds.length} matrículas selecionadas? Esta ação não pode ser desfeita.`)) {
            return;
        }

        setIsBulkApproving(true); // Reusing isBulkApproving for locking UI
        setBulkProgress(0);
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < selectedIds.length; i++) {
            try {
                await studentsService.deleteStudent(selectedIds[i]);
                successCount++;
            } catch (error) {
                console.error(`Erro ao recusar aluno ${selectedIds[i]}:`, error);
                errorCount++;
            }
            setBulkProgress(Math.round(((i + 1) / selectedIds.length) * 100));
        }

        toast({
            title: "Processamento concluído",
            description: `${successCount} recusados, ${errorCount} erros.`,
        });

        setSelectedIds([]);
        setIsBulkApproving(false);
        queryClient.invalidateQueries({ queryKey: ["students"] });
    };

    return (
        <AdminLayout title="Matrículas Pendentes" description="Analise e aprove novas solicitações de matrícula">
            <div className="space-y-6">
                {/* Intro / Stats */}
                <div className="grid gap-4 md:grid-cols-1">
                    <Card className="bg-orange-50 border-orange-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-orange-800 flex items-center gap-2">
                                <UserCheck className="h-5 w-5" />
                                Aprovação Necessária
                            </CardTitle>
                            <CardDescription className="text-orange-700/80">
                                Estes alunos realizaram o cadastro mas aguardam sua confirmação para acessar a plataforma.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-900">
                                {pendingStudents.length} <span className="text-base font-normal text-orange-700/60">solicitações pendentes</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Bulk Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 gap-4 items-center">
                        <div className="relative flex-1 sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome, email..."
                                className="pl-10 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {selectedIds.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg"
                            >
                                <span className="text-sm font-medium text-primary">
                                    {selectedIds.length} selecionados
                                </span>
                                <Button
                                    size="sm"
                                    className="h-8 bg-primary hover:bg-primary/90 gap-2"
                                    onClick={handleBulkApprove}
                                    disabled={isBulkApproving}
                                >
                                    {isBulkApproving ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Processando ({bulkProgress}%)
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="h-4 w-4" />
                                            Aprovar
                                        </>
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
                                    onClick={handleBulkDelete}
                                    disabled={isBulkApproving}
                                >
                                    {!isBulkApproving && <Trash2 className="h-4 w-4" />}
                                    Recusar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-muted-foreground"
                                    onClick={() => setSelectedIds([])}
                                    disabled={isBulkApproving}
                                >
                                    Cancelar
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="shadow-soft">
                        <CardContent className="p-0">
                            {pendingStudents.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                                    <p className="text-lg font-medium">Nenhuma matrícula pendente</p>
                                    <p className="text-sm">Tudo certo! Não há novos alunos aguardando aprovação.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={selectedIds.length === pendingStudents.length && pendingStudents.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead>Aluno</TableHead>
                                            <TableHead>Contato</TableHead>
                                            <TableHead>Turma Solicitada</TableHead>
                                            <TableHead>Data Cadastro</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingStudents.map((aluno) => (
                                            <TableRow
                                                key={aluno.id}
                                                className={cn(selectedIds.includes(aluno.id) && "bg-primary/5")}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(aluno.id)}
                                                        onCheckedChange={() => toggleSelect(aluno.id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-display font-semibold text-orange-700">
                                                            {aluno.name?.charAt(0) || "A"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{aluno.name}</p>
                                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                                                                #{aluno.registration_number || "NOVO"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        <span>{aluno.email}</span>
                                                        <span className="text-muted-foreground">{aluno.phone || "—"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{aluno.class_name || "Não definida"}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm uppercase font-semibold">
                                                    {aluno.created_at ? format(new Date(aluno.created_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                                            onClick={() => handleApprove(aluno)}
                                                            disabled={approvingId === aluno.id}
                                                        >
                                                            {approvingId === aluno.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4" />
                                                            )}
                                                            Aprovar
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem className="gap-2" onClick={() => {
                                                                    setDetailsStudent(aluno);
                                                                    setIsDetailsOpen(true);
                                                                }}>
                                                                    <Eye className="h-4 w-4" />
                                                                    Ver Detalhes
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-destructive focus:text-destructive"
                                                                    onClick={() => {
                                                                        if (window.confirm(`Tem certeza que deseja recusar e remover ${aluno.name}?`)) {
                                                                            deleteMutation.mutate(aluno.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Recusar / Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Student Details Dialog (Simplified for Review) */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Detalhes da Solicitação</DialogTitle>
                        </DialogHeader>
                        {detailsStudent && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Nome</Label>
                                        <p className="font-medium">{detailsStudent.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Status</Label>
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">Pendente</Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">E-mail</Label>
                                    <p className="font-medium">{detailsStudent.email}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                                    <p className="font-medium">{detailsStudent.phone || "—"}</p>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
                            {detailsStudent && (
                                <Button
                                    className="bg-green-600 hover:bg-green-700 gap-2"
                                    onClick={() => {
                                        handleApprove(detailsStudent);
                                        setIsDetailsOpen(false);
                                    }}
                                    disabled={approvingId === detailsStudent.id}
                                >
                                    {approvingId === detailsStudent.id && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Aprovar Matrícula
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
