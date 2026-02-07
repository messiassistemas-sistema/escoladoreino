import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teachersService, Teacher } from "@/services/teachersService";
import { subjectsService } from "@/services/subjectsService";
import { useEffect } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";



export default function AdminProfessores() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });

  const { data: professores = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: teachersService.getTeachers,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsService.getSubjects,
  });

  useEffect(() => {
    if (editingTeacher) {
      setFormData({
        name: editingTeacher.name,
        email: editingTeacher.email || "",
        phone: editingTeacher.phone || "",
        bio: editingTeacher.bio || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        bio: "",
      });
    }
  }, [editingTeacher]);

  const createMutation = useMutation({
    mutationFn: teachersService.createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setIsDialogOpen(false);
      toast({ title: "Professor cadastrado com sucesso!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Teacher> }) =>
      teachersService.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      toast({ title: "Professor atualizado com sucesso!" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: teachersService.deactivateTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast({ title: "Professor desativado com sucesso!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teachersService.deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast({ title: "Professor excluído permanentemente!" });
    },
  });

  const handleSave = () => {
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsDialogOpen(true);
  };

  const getTeacherDisciplines = (teacherName: string) => {
    return subjects
      .filter((s) => s.teacher_name === teacherName)
      .map((s) => s.name);
  };


  const filteredProfessores = professores.filter(
    (prof) =>
      prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prof.email && prof.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
    <AdminLayout title="Professores" description="Gerencie o corpo docente">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar professores..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingTeacher(null);
          }}>

            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Professor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingTeacher ? "Editar Professor" : "Novo Professor"}
                </DialogTitle>
                <DialogDescription>
                  {editingTeacher
                    ? "Altere os dados do professor selecionado."
                    : "Cadastre um novo professor no sistema."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Pr. João Silva"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@escola.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    placeholder="Breve descrição sobre o professor..."
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingTeacher ? "Salvar Alterações" : "Salvar"}
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
                    <TableHead>Professor</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Disciplinas</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessores.map((prof) => (
                    <TableRow key={prof.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 font-display font-semibold text-secondary">
                            {prof.name?.charAt(0) || "P"}
                          </div>
                          <span className="font-medium">{prof.name}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm">{prof.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {prof.phone}
                          </p>

                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getTeacherDisciplines(prof.name).map((disc) => (
                            <Badge key={disc} variant="outline" className="text-xs">
                              {disc}
                            </Badge>
                          ))}
                        </div>

                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={prof.status === "ativo" ? "bg-success text-success-foreground" : ""}
                          variant={prof.status === "ativo" ? "default" : "secondary"}
                        >
                          {prof.status === "ativo" ? "Ativo" : "Inativo"}
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
                            <DropdownMenuItem className="gap-2">
                              <Eye className="h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(prof)}>
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => deactivateMutation.mutate(prof.id)}
                              disabled={prof.status === 'inativo'}
                            >
                              <Ban className="h-4 w-4" />
                              Desativar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => {
                                if (window.confirm("Deseja excluir permanentemente este professor?")) {
                                  deleteMutation.mutate(prof.id);
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
    </AdminLayout>
  );
}
