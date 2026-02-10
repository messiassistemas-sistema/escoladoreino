import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Check,
  X,
  Download,
  Share2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lessonsService, Lesson } from "@/services/lessonsService";
import { subjectsService } from "@/services/subjectsService";
import { classesService } from "@/services/classesService";
import { studentsService } from "@/services/studentsService";
import { useToast } from "@/hooks/use-toast";

export default function AdminAulas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [selectedLessonForQR, setSelectedLessonForQR] = useState<Lesson | null>(null);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] = useState<Lesson | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent'>>({});
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    subject_id: "",
    teacher_name: "",
    class_name: "",
    date: "",
    time: "",
    location: "",
    mode: 'presencial' as 'presencial' | 'online',
    status: 'agendada' as 'agendada' | 'realizada' | 'cancelada',
    recording_link: "",
    release_for_presencial: false,
    topic: "",
    description: ""
  });

  const { data: aulas = [], isLoading } = useQuery({
    queryKey: ["lessons"],
    queryFn: lessonsService.getLessons,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsService.getSubjects,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: classesService.getClasses,
  });

  useEffect(() => {
    if (editingLesson) {
      setFormData({
        subject_id: editingLesson.subject_id,
        teacher_name: editingLesson.teacher_name || "",
        class_name: editingLesson.class_name || "",
        date: editingLesson.date,
        time: editingLesson.time,
        location: editingLesson.location || "",
        mode: editingLesson.mode,
        status: editingLesson.status,
        recording_link: editingLesson.recording_link || "",
        release_for_presencial: editingLesson.release_for_presencial || false,
        topic: editingLesson.topic || "",
        description: editingLesson.description || ""
      });
    } else {
      setFormData({
        subject_id: "",
        teacher_name: "",
        class_name: "",
        date: "",
        time: "",
        location: "",
        mode: 'presencial',
        status: 'agendada',
        recording_link: "",
        release_for_presencial: false,
        topic: "",
        description: ""
      });
    }
  }, [editingLesson]);

  const createMutation = useMutation({
    mutationFn: lessonsService.createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      setIsDialogOpen(false);
      toast({ title: "Aula agendada com sucesso!" });
    },
    onError: (error: any) => {
      console.error("Erro ao criar aula:", error);
      toast({
        title: "Erro ao agendar aula",
        description: error.message || "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lesson> }) =>
      lessonsService.updateLesson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      setIsDialogOpen(false);
      setEditingLesson(null);
      toast({ title: "Aula atualizada com sucesso!" });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar aula:", error);
      toast({
        title: "Erro ao atualizar aula",
        description: error.message || "Ocorreu um problema ao salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: lessonsService.deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Aula excluída com sucesso!" });
    },
  });

  // Students query for attendance
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsService.getStudents,
  });

  const attendanceMutation = useMutation({
    mutationFn: lessonsService.markAttendance,
    onSuccess: () => {
      toast({ title: "Chamada realizada com sucesso!" });
      setIsAttendanceDialogOpen(false);
      setAttendanceData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar chamada",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleOpenAttendance = (lesson: Lesson) => {
    setSelectedLessonForAttendance(lesson);
    // Filter students by lesson's class_name (assuming simple matching for MVP)
    const classStudents = students.filter(s => s.class_name === lesson.class_name);

    // Initialize all as present by default
    const initialData: Record<string, 'present' | 'absent'> = {};
    classStudents.forEach(s => {
      initialData[s.id] = 'present';
    });
    setAttendanceData(initialData);
    setIsAttendanceDialogOpen(true);
  };

  const handleSaveAttendance = () => {
    if (!selectedLessonForAttendance) return;

    const records = Object.entries(attendanceData).map(([studentId, status]) => ({
      student_id: studentId,
      lesson_id: selectedLessonForAttendance.id,
      status,
      date: selectedLessonForAttendance.date
    }));

    attendanceMutation.mutate(records);
  };

  const toggleAttendance = (studentId: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleSave = () => {
    if (!formData.subject_id) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione uma disciplina.",
        variant: "destructive",
      });
      return;
    }

    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      const fileName = selectedLessonForQR
        ? `qrcode-${subjects.find(s => s.id === selectedLessonForQR.subject_id)?.name}-${selectedLessonForQR.class_name}.png`
        : 'qrcode.png';
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast({ title: "QR Code baixado com sucesso!" });
    }
  };

  const shareQRCode = async () => {
    const canvas = document.querySelector('canvas');
    if (canvas && navigator.share) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const fileName = selectedLessonForQR
              ? `qrcode-${subjects.find(s => s.id === selectedLessonForQR.subject_id)?.name}.png`
              : 'qrcode.png';
            const file = new File([blob], fileName, { type: 'image/png' });
            await navigator.share({
              title: 'QR Code de Presença',
              text: 'Escaneie para registrar presença na aula.',
              files: [file],
            });
            toast({ title: "Compartilhado com sucesso!" });
          } catch (error) {
            console.error('Erro ao compartilhar:', error);
            // Fallback for when share is cancelled or fails
          }
        }
      });
    } else {
      toast({
        title: "Compartilhamento não suportado",
        description: "Seu navegador não suporta compartilhamento direto de imagens. Use a opção de baixar.",
      });
    }
  };


  const filteredAulas = aulas.filter(
    (aula) => {
      const subject = subjects.find(s => s.id === aula.subject_id);
      return (
        subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aula.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  );


  return (
    <AdminLayout title="Aulas" description="Gerencie o calendário de aulas">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar aulas..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Aula
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingLesson ? "Editar Aula" : "Nova Aula"}
                </DialogTitle>
                <DialogDescription>
                  {editingLesson ? "Altere os dados da aula selecionada." : "Agende uma nova aula no calendário."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Tema da Aula / Conteúdo</Label>
                  <Input
                    placeholder="Ex: A Trindade, Cristologia, etc."
                    value={formData.topic}
                    onChange={(e) => setFormData(p => ({ ...p, topic: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição / Resumo da Aula</Label>
                  <Textarea
                    placeholder="Resumo do que será abordado, leituras, etc."
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="h-24"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Turma</Label>
                  <Select
                    value={formData.class_name}
                    onValueChange={(val) => setFormData(p => ({ ...p, class_name: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Disciplina</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(val) => {
                      const subject = subjects.find(s => s.id === val);
                      setFormData(p => ({
                        ...p,
                        subject_id: val,
                        teacher_name: subject?.teacher_name || ""
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="horario">Horário</Label>
                    <Input
                      id="horario"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(p => ({ ...p, time: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    placeholder="Ex: Sala 101"
                    value={formData.location}
                    onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Modalidade</Label>
                    <Select
                      value={formData.mode}
                      onValueChange={(val: any) => setFormData(p => ({ ...p, mode: val }))}
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
                      onValueChange={(val: any) => setFormData(p => ({ ...p, status: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agendada">Agendada</SelectItem>
                        <SelectItem value="realizada">Realizada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recording_link">Link da Gravação (Opcional)</Label>
                  <Input
                    id="recording_link"
                    placeholder="https://youtube.com/..."
                    value={formData.recording_link}
                    onChange={(e) => setFormData(p => ({ ...p, recording_link: e.target.value }))}
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="release_for_presencial"
                      checked={formData.release_for_presencial}
                      onCheckedChange={(checked) => setFormData(p => ({ ...p, release_for_presencial: checked === true }))}
                    />
                    <Label htmlFor="release_for_presencial" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Liberar gravação para alunos presenciais
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingLesson ? "Salvar" : "Agendar"}
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
                    <TableHead>Aula</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Data/Horário</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAulas.map((aula) => (
                    <TableRow key={aula.id}>
                      <TableCell>
                        <div>
                          {aula.topic ? (
                            <>
                              <p className="font-bold text-base text-primary">
                                {aula.topic}
                              </p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {subjects.find(s => s.id === aula.subject_id)?.name || "Disciplina não definida"}
                              </p>
                            </>
                          ) : (
                            <p className="font-medium text-base">
                              {subjects.find(s => s.id === aula.subject_id)?.name || "Disciplina não definida"}
                            </p>
                          )}

                          {aula.class_name &&
                            subjects.find(s => s.id === aula.subject_id)?.name?.trim() !== aula.class_name?.replace(/\.$/, "").trim() && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {aula.class_name}
                              </p>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>{aula.teacher_name}</TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {aula.date ? new Date(aula.date + "T00:00:00").toLocaleDateString("pt-BR") : "Data não definida"}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {aula.time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {aula.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={aula.status === "realizada" ? "default" : "secondary"}
                          className={
                            aula.status === "realizada"
                              ? "bg-success text-success-foreground"
                              : ""
                          }
                        >
                          {aula.status === "realizada" ? "Realizada" : "Agendada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedLessonForQR(aula);
                              setIsQRDialogOpen(true);
                            }}
                            title="Ver QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleOpenAttendance(aula)}
                              >
                                <UserCheck className="h-4 w-4" />
                                Fazer Chamada
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onClick={() => {
                                setEditingLesson(aula);
                                setIsDialogOpen(true);
                              }}>
                                <Edit className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => {
                                  if (window.confirm("Deseja realmente cancelar esta aula?")) {
                                    deleteMutation.mutate(aula.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>

                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Dialog */}
        <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">Realizar Chamada</DialogTitle>
              <DialogDescription>
                {selectedLessonForAttendance && (
                  <span>
                    {selectedLessonForAttendance.subject?.name} - {new Date(selectedLessonForAttendance.date + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLessonForAttendance && students
                    .filter(s => s.class_name === selectedLessonForAttendance.class_name)
                    .map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={attendanceData[student.id] === 'present' ? 'default' : 'destructive'}
                            className={attendanceData[student.id] === 'present' ? 'bg-success text-success-foreground' : ''}
                          >
                            {attendanceData[student.id] === 'present' ? 'Presente' : 'Ausente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleAttendance(student.id)}
                          >
                            {attendanceData[student.id] === 'present' ? <X className="h-4 w-4 text-destructive" /> : <Check className="h-4 w-4 text-success" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  {selectedLessonForAttendance && students.filter(s => s.class_name === selectedLessonForAttendance.class_name).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground p-8">
                        Nenhum aluno encontrado nesta turma ({selectedLessonForAttendance.class_name}).
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveAttendance} disabled={attendanceMutation.isPending}>
                {attendanceMutation.isPending ? "Salvando..." : "Salvar Chamada"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-center">QR Code de Presença</DialogTitle>
              <DialogDescription className="text-center">
                Exiba, baixe ou compartilhe o código para os alunos.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="flex h-64 w-64 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-white p-4 shadow-sm">
                {selectedLessonForQR ? (
                  <QRCodeCanvas
                    value={JSON.stringify({
                      lessonId: selectedLessonForQR.id,
                      subjectName: subjects.find(s => s.id === selectedLessonForQR.subject_id)?.name,
                      date: selectedLessonForQR.date,
                      timestamp: Date.now()
                    })}
                    size={220}
                    level="H" // High error correction level for better scanning
                  />
                ) : (
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                )}
              </div>

              {selectedLessonForQR && (
                <div className="text-center space-y-1">
                  <p className="font-semibold text-lg">
                    {subjects.find(s => s.id === selectedLessonForQR.subject_id)?.name}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedLessonForQR.class_name} • {new Date(selectedLessonForQR.date + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button className="w-full gap-2" variant="secondary" onClick={downloadQRCode}>
                <Download className="h-4 w-4" />
                Baixar
              </Button>
              <Button className="w-full gap-2" variant="default" onClick={shareQRCode}>
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </AdminLayout >
  );
}
