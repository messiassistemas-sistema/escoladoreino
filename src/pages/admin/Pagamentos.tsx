import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  Filter,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Eye,
  Edit,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { paymentsService } from "@/services/paymentsService";
import { Skeleton } from "@/components/ui/skeleton";



export default function AdminPagamentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pagamentos = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: paymentsService.getPayments,
  });

  const filteredPagamentos = pagamentos.filter((pag) => {
    const matchesSearch =
      pag.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pag.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pag.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "todos" || pag.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalApproved: pagamentos
      .filter((p) => p.status === "approved")
      .reduce((acc, p) => acc + (p.amount || 0), 0),
    totalPending: pagamentos
      .filter((p) => p.status === "pending")
      .reduce((acc, p) => acc + (p.amount || 0), 0),
    countApproved: pagamentos.filter((p) => p.status === "approved").length,
    countRejected: pagamentos.filter((p) => p.status === "rejected").length,
  };



  const toggleSelectAll = () => {
    if (selectedPayments.size === filteredPagamentos.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filteredPagamentos.map(p => p.id)));
    }
  };

  const toggleSelectPayment = (id: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPayments(newSelected);
  };

  const deleteMutation = paymentsService.deletePayment; // we will use this directly in onClick for simplicity or wrap in useMutation if preferred. 
  // Actually typically recommended to useMutation but for brevity I will call service directly in handler

  const handleBulkDelete = async () => {
    if (!window.confirm(`Deseja excluir ${selectedPayments.size} pagamentos?`)) return;
    try {
      await paymentsService.deletePayments(Array.from(selectedPayments));
      toast({ title: "Pagamentos excluídos!", description: "Os registros foram removidos com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setSelectedPayments(new Set());
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir pagamentos.", variant: "destructive" });
    }
  };
  return (
    <AdminLayout title="Pagamentos" description="Gestão financeira e pagamentos">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Recebido</p>
              <p className="font-display text-2xl font-bold text-success">
                {isLoading ? <Skeleton className="mx-auto h-8 w-24" /> : `R$ ${stats.totalApproved.toLocaleString("pt-BR")}`}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Pendente</p>
              <p className="font-display text-2xl font-bold text-warning">
                {isLoading ? <Skeleton className="mx-auto h-8 w-24" /> : `R$ ${stats.totalPending.toLocaleString("pt-BR")}`}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Aprovados</p>
              <p className="font-display text-2xl font-bold text-success">
                {isLoading ? <Skeleton className="mx-auto h-8 w-12" /> : stats.countApproved}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Recusados</p>
              <p className="font-display text-2xl font-bold text-destructive">
                {isLoading ? <Skeleton className="mx-auto h-8 w-12" /> : stats.countRejected}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar pagamentos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="rejected">Recusados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedPayments.size > 0 && (
          <div className="bg-muted/50 p-2 rounded-lg flex items-center justify-between px-4 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium">{selectedPayments.size} selecionado(s)</span>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4" />
              Excluir Selecionados
            </Button>
          </div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-soft">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={filteredPagamentos.length > 0 && selectedPayments.size === filteredPagamentos.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-center">Data</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Carregando pagamentos...
                      </TableCell>
                    </TableRow>
                  ) : filteredPagamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Nenhum pagamento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : filteredPagamentos.map((pag) => (
                    <TableRow key={pag.id} data-state={selectedPayments.has(pag.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPayments.has(pag.id)}
                          onCheckedChange={() => toggleSelectPayment(pag.id)}
                          aria-label={`Select payment ${pag.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {pag.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pag.student_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pag.student_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{pag.class_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            R$ {(pag.amount || 0).toLocaleString("pt-BR")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pag.installments}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(pag.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-center">
                        {pag.status === "approved" ? (
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Aprovado
                          </Badge>
                        ) : pag.status === "pending" ? (
                          <Badge
                            variant="secondary"
                            className="bg-warning text-warning-foreground"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Pendente
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Recusado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {pag.status === 'pending' && (
                              <DropdownMenuItem
                                className="gap-2 text-success focus:text-success"
                                onClick={async () => {
                                  if (!window.confirm(`Confirmar o recebimento de R$ ${(pag.amount || 0).toLocaleString("pt-BR")} de ${pag.student_name}?`)) return;

                                  try {
                                    await paymentsService.approvePayment(pag.id, pag.student_email, pag.student_name);
                                    toast({ title: "Pagamento Aprovado!", description: "Credenciais de acesso enviadas por e-mail." });
                                    // Invalidate queries to refresh list
                                    queryClient.invalidateQueries({ queryKey: ["payments"] });
                                    queryClient.invalidateQueries({ queryKey: ["students"] });
                                  } catch (e: any) {
                                    console.error(e);
                                    toast({ title: "Erro", description: e.message || "Falha ao aprovar pagamento.", variant: "destructive" });
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Dar Baixa (Aprovar)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
