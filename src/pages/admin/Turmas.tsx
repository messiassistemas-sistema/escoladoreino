import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesService, Class } from "@/services/classesService";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";




export default function AdminTurmas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const { data: turmas = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: classesService.getClasses,
  });

  useEffect(() => {
    if (editingClass) {
      setFormData({
        name: editingClass.name,
        start_date: editingClass.start_date || "",
        end_date: editingClass.end_date || "",
        is_active: editingClass.is_active,
      });
    } else {
      setFormData({
        name: "",
        start_date: "",
        end_date: "",
        is_active: true,
      });
    }
  }, [editingClass]);

  const createMutation = useMutation({
    mutationFn: classesService.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsDialogOpen(false);
      toast({ title: "Turma criada com sucesso!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Class> }) =>
      classesService.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsDialogOpen(false);
      setEditingClass(null);
      toast({ title: "Turma atualizada com sucesso!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classesService.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Turma excluída com sucesso!" });
    },
  });

  const handleSave = () => {
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setIsDialogOpen(true);
  };


  const filteredTurmas = turmas.filter((turma) =>
    turma.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <AdminLayout title="Turmas" description="Gerencie as turmas da escola">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar turmas..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingClass(null);
          }}>

            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingClass ? "Editar Turma" : "Nova Turma"}
                </DialogTitle>
                <DialogDescription>
                  {editingClass
                    ? "Altere os dados da turma selecionada."
                    : "Crie uma nova turma para o período letivo."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Turma</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Turma 2025.2"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="inicio">Data de Início</Label>
                    <Input
                      id="inicio"
                      type="date"
                      value={formData.start_date || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fim">Data de Término</Label>
                    <Input
                      id="fim"
                      type="date"
                      value={formData.end_date || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label>Turma Vigente</Label>
                    <p className="text-sm text-muted-foreground">
                      Novas matrículas serão direcionadas para esta turma.
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingClass ? "Salvar Alterações" : "Criar Turma"}
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
                    <TableHead>Turma</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-center">Alunos</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Vigente</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurmas.map((turma) => (
                    <TableRow key={turma.id}>
                      <TableCell className="font-medium">{turma.name}</TableCell>
                      <TableCell>
                        {turma.start_date ? new Date(turma.start_date).toLocaleDateString("pt-BR") : "-"} -{" "}
                        {turma.end_date ? new Date(turma.end_date).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {turma.student_count}
                        </div>

                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={turma.status === "ativa" ? "default" : "secondary"}
                          className={
                            turma.status === "ativa"
                              ? "bg-success text-success-foreground"
                              : ""
                          }
                        >
                          {turma.status === "ativa" ? "Ativa" : "Concluída"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {turma.is_active && (
                          <CheckCircle2 className="mx-auto h-5 w-5 text-success" />
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
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(turma)}>
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Users className="h-4 w-4" />
                              Ver Alunos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => {
                                if (window.confirm("Deseja excluir permanentemente esta turma?")) {
                                  deleteMutation.mutate(turma.id);
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
