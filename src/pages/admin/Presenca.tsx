import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  CalendarDays,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { studentsService } from "@/services/studentsService";
import { subjectsService } from "@/services/subjectsService";
import { lessonsService } from "@/services/lessonsService";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";



export default function AdminPresenca() {
  const [searchTerm, setSearchTerm] = useState("");
  const [disciplinaFilter, setDisciplinaFilter] = useState("todas");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: studentsService.getStudents,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsService.getSubjects,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons"],
    queryFn: lessonsService.getLessons,
  });

  const { data: allAttendance = [] } = useQuery({
    queryKey: ["all-attendance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*, lesson:lessons(subject_id, date, time, topic, subject:subjects(name))");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredLessons = disciplinaFilter === "todas"
    ? lessons
    : lessons.filter(l => l.subject_id === disciplinaFilter);

  const filteredLessonIds = new Set(filteredLessons.map(l => l.id));
  const totalAulas = filteredLessons.length;

  const getStudentAttendanceCount = (studentId: string) => {
    return allAttendance.filter(
      (a: any) => a.student_id === studentId
        && a.status === 'present'
        && filteredLessonIds.has(a.lesson_id)
    ).length;
  };

  const getStudentLessonDetails = (studentId: string) => {
    return filteredLessons.map(lesson => {
      const record = allAttendance.find(
        (a: any) => a.student_id === studentId && a.lesson_id === lesson.id
      );
      return {
        lessonId: lesson.id,
        topic: lesson.topic || lesson.subject?.name || 'Sem título',
        scheduledDate: lesson.date,
        scheduledTime: lesson.time,
        subjectName: lesson.subject?.name,
        status: record?.status === 'present' ? 'present' as const : 'absent' as const,
        checkInTime: record?.date || record?.created_at || null,
      };
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const activeStudents = students.filter(s => s.status !== 'pendente');

  const filteredData = activeStudents.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentRate = (studentId: string) => {
    if (totalAulas === 0) return 0;
    return (getStudentAttendanceCount(studentId) / totalAulas) * 100;
  };

  const mediaPresenca = activeStudents.length > 0
    ? activeStudents.reduce((acc, item) => acc + getStudentRate(item.id), 0) / activeStudents.length
    : 0;

  const alunosAbaixo = activeStudents.filter((item) => getStudentRate(item.id) < 75).length;


  return (
    <AdminLayout title="Presença" description="Relatórios de frequência dos alunos">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Média de Presença</p>
              <p className="font-display text-2xl font-bold text-primary">
                {mediaPresenca.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">100% Presença</p>
              <p className="font-display text-2xl font-bold text-success">
                {activeStudents.filter((a) => getStudentRate(a.id) === 100).length}
              </p>
            </CardContent>

          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Abaixo de 75%</p>
              <p className="font-display text-2xl font-bold text-destructive">
                {alunosAbaixo}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total de Aulas</p>
              <p className="font-display text-2xl font-bold">{totalAulas}</p>
            </CardContent>
          </Card>
        </div>

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
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
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
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
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
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Presenças</TableHead>
                    <TableHead className="text-center">Faltas</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => {
                    const isExpanded = expandedStudent === item.id;
                    const details = isExpanded ? getStudentLessonDetails(item.id) : [];
                    return (
                      <>
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedStudent(isExpanded ? null : item.id)}
                        >
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
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {totalAulas}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-success">
                              {getStudentAttendanceCount(item.id)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-destructive">
                              {totalAulas - getStudentAttendanceCount(item.id)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Progress
                                value={getStudentRate(item.id)}
                                className="h-2 w-24"
                              />
                              <span className="text-sm font-medium">
                                {getStudentRate(item.id).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStudentRate(item.id) >= 75 ? (
                              <Badge className="bg-success text-success-foreground">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Regular
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="mr-1 h-3 w-3" />
                                Irregular
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${item.id}-details`}>
                            <TableCell colSpan={6} className="p-0">
                              <div className="bg-muted/30 border-t border-b px-6 py-4">
                                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4" />
                                  Detalhes de Presença — {item.name}
                                </p>
                                <div className="rounded-lg border bg-background overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="text-xs">
                                        <TableHead>Aula</TableHead>
                                        <TableHead className="text-center">Data Agendada</TableHead>
                                        <TableHead className="text-center">Horário Agendado</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Check-in</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {details.map((d) => (
                                        <TableRow key={d.lessonId} className="text-sm">
                                          <TableCell className="font-medium">
                                            {d.topic}
                                            {d.subjectName && (
                                              <span className="block text-xs text-muted-foreground">{d.subjectName}</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {formatDate(d.scheduledDate)}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {d.scheduledTime || '—'}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {d.status === 'present' ? (
                                              <Badge className="bg-success/10 text-success border-success/20 text-xs">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Presente
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                                                <XCircle className="mr-1 h-3 w-3" />
                                                Falta
                                              </Badge>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {d.status === 'present' && d.checkInTime ? (
                                              <span className="text-xs">
                                                <span className="font-medium">{formatDate(d.checkInTime)}</span>
                                                {' '}
                                                <span className="text-muted-foreground">às {formatTime(d.checkInTime)}</span>
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      {details.length === 0 && (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                            Nenhuma aula encontrada para esta disciplina.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}

                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
