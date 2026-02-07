import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, Filter, Plus, Edit, Save } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsService } from "@/services/studentsService";
import { subjectsService } from "@/services/subjectsService";
import { assessmentsService } from "@/services/assessmentsService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";



export default function AdminNotas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [disciplinaFilter, setDisciplinaFilter] = useState("todas");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    weight: 0,
    date: ""
  });

  const createMutation = useMutation({
    mutationFn: assessmentsService.createAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] }); // We might need to fetch assessments separately to list them or just for the side effects
      toast({ title: "Avaliação criada com sucesso!" });
      setIsDialogOpen(false);
      setNewAssessment({ title: "", weight: 0, date: "" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar avaliação",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const handleCreateAssessment = () => {
    if (disciplinaFilter === "todas") {
      toast({ title: "Selecione uma disciplina", description: "Você precisa selecionar uma disciplina para criar uma avaliação.", variant: "destructive" });
      return;
    }
    if (!newAssessment.title || !newAssessment.date) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      subject_id: disciplinaFilter,
      title: newAssessment.title,
      weight: newAssessment.weight,
      date: newAssessment.date
    });
  };

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: studentsService.getStudents,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsService.getSubjects,
  });

  const filteredData = students.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSubject = subjects.find(s => s.id === disciplinaFilter) || subjects[0];


  return (
    <AdminLayout title="Notas" description="Lançamento e gestão de notas">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={disciplinaFilter} onValueChange={setDisciplinaFilter}>
              <SelectTrigger className="w-56">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Selecione a disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as disciplinas</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>


          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Avaliação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Nova Avaliação</DialogTitle>
                  <DialogDescription>
                    Crie uma nova avaliação para esta disciplina.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome da Avaliação</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: Prova Final"
                      value={newAssessment.title}
                      onChange={(e) => setNewAssessment(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="peso">Peso (%)</Label>
                      <Input
                        id="peso"
                        type="number"
                        placeholder="30"
                        value={newAssessment.weight}
                        onChange={(e) => setNewAssessment(p => ({ ...p, weight: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="data">Data</Label>
                      <Input
                        id="data"
                        type="date"
                        value={newAssessment.date}
                        onChange={(e) => setNewAssessment(p => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAssessment} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Info */}
        <Card className="border-secondary/30 bg-secondary/10 shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-medium">{selectedSubject?.name || "Selecione uma disciplina"}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{selectedSubject?.teacher_name || "Sem professor vinculado"}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Turma Vigente</span>

              <span className="text-muted-foreground">•</span>
              <Badge variant="outline">Prova 1: 30% | Trabalho: 30% | Prova 2: 40%</Badge>
            </div>
          </CardContent>
        </Card>

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
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Prova 1 (30%)</TableHead>
                    <TableHead className="text-center">Trabalho (30%)</TableHead>
                    <TableHead className="text-center">Prova 2 (40%)</TableHead>
                    <TableHead className="text-center">Média</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display font-semibold text-primary">
                            {item.name?.charAt(0) || "A"}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              #{item.registration_number}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">—</TableCell>
                      <TableCell className="text-center">—</TableCell>
                      <TableCell className="text-center">—</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-display text-lg font-bold ${Number(item.average_grade) > 0
                            ? Number(item.average_grade) >= 7
                              ? "text-success"
                              : "text-destructive"
                            : ""
                            }`}
                        >
                          {Number(item.average_grade) > 0 ? Number(item.average_grade).toFixed(1) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            Number(item.average_grade) >= 7
                              ? "default"
                              : Number(item.average_grade) > 0
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            Number(item.average_grade) >= 7
                              ? "bg-success text-success-foreground"
                              : ""
                          }
                        >
                          {Number(item.average_grade) >= 7
                            ? "Aprovado"
                            : Number(item.average_grade) > 0
                              ? "Reprovado"
                              : item.status === "formado" ? "Formado" : "Cursando"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
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
