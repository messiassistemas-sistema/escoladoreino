import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Filter,
  CheckCircle,
  Ban,
  MessageCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsService, Student } from "@/services/studentsService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";



export default function AdminAlunos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    registration_number: "",
    class_name: "",
    status: 'ativo' as "ativo" | "pendente" | "formado" | "inativo",
    attendance_rate: 0,
    average_grade: 0,
    modality: 'presencial' as 'presencial' | 'online',
  });

  // Details Dialog State
  const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: studentsService.getStudents,
  });

  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name,
        email: editingStudent.email || "",
        phone: editingStudent.phone || "",
        registration_number: editingStudent.registration_number || "",
        class_name: editingStudent.class_name || "",
        status: editingStudent.status,
        attendance_rate: editingStudent.attendance_rate || 0,
        average_grade: editingStudent.average_grade || 0,
        modality: editingStudent.modality || 'presencial',
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        registration_number: "",
        class_name: "",
        status: 'ativo',
        attendance_rate: 0,
        average_grade: 0,
        modality: 'presencial',
      });
    }
  }, [editingStudent]);

  const createMutation = useMutation({
    mutationFn: studentsService.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsDialogOpen(false);
      toast({ title: "Aluno cadastrado com sucesso!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
      studentsService.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsDialogOpen(false);
      setEditingStudent(null);
      toast({ title: "Aluno atualizado com sucesso!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: studentsService.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Aluno excluído com sucesso!" });
    },
  });

  const handleSave = () => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };


  const filteredAlunos = alunos.filter((aluno) => {
    const matchesSearch =
      aluno.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (aluno.email && aluno.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (aluno.registration_number && aluno.registration_number.includes(searchTerm));
    const matchesStatus =
      statusFilter === "todos"
        ? aluno.status !== "pendente" // Exclude pending by default in "All" view
        : aluno.status === statusFilter;

    // Explicitly allow if user sets filter to "pendente" (optional, but requested to hide from main view usually)
    // Actually, user wants to REMOVE it from here. So let's make "Pending" strictly not show up unless specifically asked?
    // User said "aparecendo alunos pentente ... pode ficar meio confuso". 
    // Best approach: "Todos" = Active + Formado + Inativo. 
    // Remove "Pendente" from the Select options OR redirect user to new page.

    return matchesSearch && matchesStatus && (statusFilter !== "todos" || aluno.status !== "pendente");
  });


  return (
    <AdminLayout title="Alunos" description="Gerencie os alunos matriculados">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-display text-2xl font-bold">{alunos.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="font-display text-2xl font-bold text-success">
                {alunos.filter((a) => a.status === "ativo").length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="font-display text-2xl font-bold text-warning">
                {alunos.filter((a) => a.status === "pendente").length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Formados</p>
              <p className="font-display text-2xl font-bold text-primary">
                {alunos.filter((a) => a.status === "formado").length}
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
                placeholder="Buscar alunos..."
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
                <SelectItem value="todos">Todos (Ativos/Formados)</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="formado">Formados</SelectItem>
                {/* Pending removed from here as it has its own page now */}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingStudent(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingStudent ? "Editar Aluno" : "Novo Aluno"}
                </DialogTitle>
                <DialogDescription>
                  {editingStudent ? "Altere os dados do aluno selecionado." : "Cadastre um novo aluno no sistema."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={formData.registration_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                      placeholder={!editingStudent ? "Gerado automaticamente" : ""}
                      disabled={!editingStudent}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="turma">Turma</Label>
                    <Input
                      id="turma"
                      value={formData.class_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Modalidade</Label>
                    <Select
                      value={formData.modality}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, modality: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="formado">Formado</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingStudent ? "Salvar Alterações" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Student Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {detailsStudent?.name?.charAt(0)}
                </div>
                {detailsStudent?.name}
              </DialogTitle>
              <DialogDescription>
                Detalhes completos do aluno.
              </DialogDescription>
            </DialogHeader>

            {detailsStudent && (
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                    <div>
                      <Badge variant={detailsStudent.status === 'ativo' ? 'default' : 'secondary'} className={detailsStudent.status === 'ativo' ? 'bg-success text-success-foreground' : ''}>
                        {detailsStudent.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="ml-2">
                        {detailsStudent.modality ? detailsStudent.modality.toUpperCase() : 'PRESENCIAL'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Matrícula</Label>
                    <p className="font-semibold text-lg">#{detailsStudent.registration_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">E-mail</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {detailsStudent.email || "Não informado"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Telefone</Label>
                    <p className="font-medium">{detailsStudent.phone || "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Turma</Label>
                    <p className="font-medium">{detailsStudent.class_name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Desempenho</Label>
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground">Frequência</span>
                        <span className={detailsStudent.attendance_rate >= 75 ? "text-success font-bold" : "text-destructive font-bold"}>
                          {detailsStudent.attendance_rate}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground">Média Geral</span>
                        <span className="font-bold">{detailsStudent.average_grade > 0 ? Number(detailsStudent.average_grade).toFixed(1) : "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Reset Section */}
                <div className="border-t pt-4 bg-muted/20 p-4 rounded-xl">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Acesso ao Portal
                  </h4>

                  {!generatedPassword ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Se o aluno esqueceu a senha, você pode gerar uma nova temporária.</p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (!detailsStudent.email) {
                            toast({ title: "Erro", description: "Aluno sem e-mail não pode ter acesso.", variant: "destructive" });
                            return;
                          }
                          if (!window.confirm("Isso irá alterar a senha do aluno imediatamente. Deseja continuar?")) return;

                          try {
                            toast({ title: "Gerando...", description: "Criando nova senha..." });
                            // We need to fetch the User ID linked to this student email first, or pass email to logic.
                            // Wait, students table DOES NOT have auth user_id. We must lookup by email.
                            // The edge function expects userId. I can modify it to accept email OR 
                            // I can fetch user by email here using a client side query? No, I can't query auth.users from client.
                            // I need to update my edge function or service to handle email lookup.
                            // Actually admin-change-password could take email too if I update it.
                            // For now, let's update service to call a function that can handle email loopup on server side.
                            // Or better, let's update studentService logic to handle this.

                            // BUT, I can rely on another method. 
                            // Actually, better path: Update edge function to find user by Email if userId not provided.
                            // Let's assume for a second I did this.
                            // Wait, I can't edit edge function instantly without redeploy.
                            // Let's check if I have a way.
                            // Actually, supabase.auth.admin.listUsers() is not available on client.
                            // I MUST update the edge function to accept email.
                            // Re-deploying edge function...

                            // HOLD ON. I will inject logic to handling this in the button click AFTER I fix the edge function.
                            // For now I will put placeholder logic and let the next tool call fix the function.

                            // Actually, I'll update the component expecting the service to work, 
                            // and I will update the service/edge function in next steps if needed.
                            // BUT to be safe, I will pass the student EMAIL to the service, and let the service/edge function handle the lookup.
                            // The current `resetStudentPassword` takes `userId`. I need to change it to `email`.

                            const pwd = await studentsService.resetStudentPassword(detailsStudent.email);
                            setGeneratedPassword(pwd);
                            toast({ title: "Senha gerada!", description: "Copie a senha abaixo." });
                          } catch (e: any) {
                            toast({ title: "Erro", description: e.message, variant: "destructive" });
                          }
                        }}
                      >
                        Gerar Nova Senha
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-green-600 font-bold">Nova Senha Gerada:</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={generatedPassword} className="font-mono text-lg bg-background" />
                        <Button variant="outline" onClick={() => {
                          navigator.clipboard.writeText(generatedPassword);
                          toast({ title: "Copiado!" });
                        }}>
                          Copiar
                        </Button>
                      </div>

                      <Button
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2"
                        onClick={() => {
                          const message = `Olá *${detailsStudent.name}*! 👋\n\nAqui estão seus dados de acesso ao Portal do Aluno da Escola do Reino:\n\n📧 *Login:* ${detailsStudent.email}\n🔑 *Senha:* ${generatedPassword}\n\n🔗 *Acesse em:* ${window.location.origin}/login\n\nQualquer dúvida, estamos à disposição!`;
                          const whatsappUrl = `https://wa.me/55${detailsStudent.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Enviar Login e Senha no WhatsApp
                      </Button>


                      <p className="text-xs text-muted-foreground bg-yellow-500/10 p-2 rounded text-yellow-600 border border-yellow-500/20">
                        ⚠️ Envie esta senha para o aluno. Ela não será mostrada novamente.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-soft">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead className="text-center">Presença</TableHead>
                    <TableHead className="text-center">Média</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display font-semibold text-primary">
                            {aluno.name?.charAt(0) || "A"}
                          </div>
                          <div>
                            <p className="font-medium">{aluno.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {aluno.email}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {aluno.modality === 'online' && (
                                <Badge variant="secondary" className="text-[10px] h-5 bg-blue-100 text-blue-700 hover:bg-blue-200">
                                  ONLINE
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>#{aluno.registration_number}</TableCell>
                      <TableCell>{aluno.class_name}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            aluno.attendance_rate >= 75 ? "text-success" : "text-destructive"
                          }
                        >
                          {aluno.attendance_rate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {aluno.average_grade > 0 ? Number(aluno.average_grade).toFixed(1) : "—"}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={
                            aluno.status === "ativo"
                              ? "default"
                              : aluno.status === "pendente"
                                ? "secondary"
                                : aluno.status === "inativo"
                                  ? "destructive"
                                  : "outline"
                          }
                          className={
                            aluno.status === "ativo"
                              ? "bg-success text-success-foreground"
                              : aluno.status === "pendente"
                                ? "bg-warning text-warning-foreground"
                                : aluno.status === "inativo"
                                  ? "bg-muted text-muted-foreground" // Use gray for inactive instead of destructive
                                  : ""
                          }
                        >
                          {aluno.status === "ativo"
                            ? "Ativo"
                            : aluno.status === "pendente"
                              ? "Pendente"
                              : aluno.status === "inativo"
                                ? "Inativo"
                                : "Formado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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
                              setGeneratedPassword(null); // Reset prev password
                            }}>
                              <Eye className="h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(aluno)}>
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={async () => {
                              if (!aluno.email) {
                                toast({ title: "Erro", description: "Aluno sem e-mail cadastrado.", variant: "destructive" });
                                return;
                              }

                              // Check if there is a generated password for this student currently displayed
                              const passwordToSend = (detailsStudent?.id === aluno.id && generatedPassword) ? generatedPassword : null;

                              let emailBody = `
                                    <h1>Olá, ${aluno.name}!</h1>
                                    <p>Sua matrícula na <strong>Escola do Reino</strong> foi confirmada com sucesso.</p>
                                    <p>Para acessar o portal do aluno, utilize as credenciais abaixo:</p>
                                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                      <p><strong>E-mail:</strong> ${aluno.email}</p>
                                      ${passwordToSend ? `<p><strong>Senha:</strong> ${passwordToSend}</p>` : `<p><strong>Senha:</strong> <em>(Sua senha definida anteriormente)</em></p>`}
                                    </div>
                                    <p>Acesse o portal em: <a href="${window.location.origin}/login">${window.location.origin}/login</a></p>
                                    <br/>
                                    <p>Se tiver dúvidas, entre em contato com a secretaria.</p>
                                    <br/>
                                    <p>Atenciosamente,</p>
                                    <p>Equipe Escola do Reino</p>
                                  `;

                              if (!window.confirm(`Enviar e-mail de boas-vindas para ${aluno.name}?${passwordToSend ? ' (Incluindo senha gerada)' : ''}`)) return;

                              toast({ title: "Enviando...", description: "Aguarde..." });
                              try {
                                // Import dynamically to avoid circular dependencies if any
                                const { settingsService } = await import("@/services/settingsService");
                                await settingsService.sendEmail(
                                  aluno.email,
                                  "Acesso ao Portal - Escola do Reino 🎓",
                                  emailBody
                                );
                                toast({ title: "Sucesso!", description: "E-mail de acesso enviado.", variant: "default" });
                              } catch (e: any) {
                                toast({ title: "Erro", description: e.message || "Falha ao enviar e-mail.", variant: "destructive" });
                              }
                            }}>
                              <Mail className="h-4 w-4" />
                              Enviar E-mail
                            </DropdownMenuItem>
                            {aluno.status === 'ativo' ? (
                              <DropdownMenuItem className="gap-2 text-orange-600" onClick={() => {
                                if (window.confirm(`Deseja desativar o aluno ${aluno.name}?`)) {
                                  updateMutation.mutate({ id: aluno.id, data: { status: 'inativo' } });
                                }
                              }}>
                                <Ban className="h-4 w-4" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="gap-2 text-green-600" onClick={() => {
                                updateMutation.mutate({ id: aluno.id, data: { status: 'ativo' } });
                              }}>
                                <CheckCircle className="h-4 w-4" />
                                Ativar
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => {
                                if (window.confirm("Deseja excluir permanentemente este aluno?")) {
                                  deleteMutation.mutate(aluno.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
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
    </AdminLayout >
  );
}
