import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Clock, Ban } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectsService, Subject } from "@/services/subjectsService";
import { useEffect } from "react";



export default function AdminDisciplinas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    workload: 60,
    teacher_name: "",
  });

  const { data: disciplinas = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsService.getSubjects,
  });

  useEffect(() => {
    if (editingSubject) {
      setFormData({
        name: editingSubject.name,
        description: editingSubject.description || "",
        workload: editingSubject.workload,
        teacher_name: editingSubject.teacher_name || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        workload: 60,
        teacher_name: "",
      });
    }
  }, [editingSubject]);

  const createMutation = useMutation({
    mutationFn: subjectsService.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setIsDialogOpen(false);
      toast({ title: "Disciplina criada com sucesso!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subject> }) =>
      subjectsService.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setIsDialogOpen(false);
      setEditingSubject(null);
      toast({ title: "Disciplina atualizada com sucesso!" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: subjectsService.deactivateSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast({ title: "Disciplina desativada com sucesso!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subjectsService.deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast({ title: "Disciplina excluída permanentemente!" });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Verifique se a disciplina não possui módulos ou aulas vinculadas.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setIsDialogOpen(true);
  };


  const filteredDisciplinas = disciplinas.filter((disc) =>
    disc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCargaHoraria = disciplinas
    .filter((d) => d.status === "ativa")
    .reduce((acc, d) => acc + d.workload, 0);


  return (
    <AdminLayout title="Disciplinas" description="Gerencie a grade curricular">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total de Disciplinas</p>
              <p className="font-display text-2xl font-bold">{disciplinas.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Carga Horária Total</p>
              <p className="font-display text-2xl font-bold">{totalCargaHoraria}h</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Ativas</p>
              <p className="font-display text-2xl font-bold text-success">
                {disciplinas.filter((d) => d.status === "ativa").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar disciplinas..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingSubject(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Disciplina
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingSubject ? "Editar Disciplina" : "Nova Disciplina"}
                </DialogTitle>
                <DialogDescription>
                  {editingSubject
                    ? "Altere os dados da disciplina selecionada."
                    : "Adicione uma nova disciplina à grade curricular."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Disciplina</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Introdução à Teologia"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Breve descrição da disciplina..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="carga">Carga Horária (horas)</Label>
                    <Input
                      id="carga"
                      type="number"
                      placeholder="60"
                      value={formData.workload}
                      onChange={(e) => setFormData(prev => ({ ...prev, workload: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="professor">Professor</Label>
                    <Input
                      id="professor"
                      placeholder="Nome do Professor"
                      value={formData.teacher_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, teacher_name: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingSubject ? "Salvar Alterações" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>

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
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead className="text-center">Carga Horária</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisciplinas.map((disc) => (
                    <TableRow key={disc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{disc.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {disc.description}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>{disc.teacher_name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {disc.workload}h
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={disc.status === "ativa" ? "default" : "secondary"}
                          className={
                            disc.status === "ativa"
                              ? "bg-success text-success-foreground"
                              : ""
                          }
                        >
                          {disc.status === "ativa" ? "Ativa" : "Inativa"}
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
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(disc)}>
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => deactivateMutation.mutate(disc.id)}
                              disabled={disc.status === 'inativa' || deactivateMutation.isPending}
                            >
                              <Ban className="h-4 w-4" />
                              Desativar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => {
                                if (window.confirm("Tem certeza que deseja excluir permanentemente esta disciplina? Esta ação não pode ser desfeita.")) {
                                  deleteMutation.mutate(disc.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir Permanentemente
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
    </AdminLayout>
  );
}
