import { motion } from "framer-motion";
import {
  Calendar,
  BookOpen,
  Bell,
  Star as StarIcon,
  PlayCircle,
  Download,
  Clock,
  TrendingUp,
  ChevronRight,
  Pin,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { studentsService } from "@/services/studentsService";
import { lessonsService } from "@/services/lessonsService";
import { announcementsService } from "@/services/announcementsService";
import { coursesService } from "@/services/coursesService";
import { LessonDetailsDialog } from "@/components/portal/LessonDetailsDialog";
import { EnrollmentPaymentModal } from "@/components/portal/EnrollmentPaymentModal";
import { useState } from "react";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

export default function PortalDashboard() {
  const { user, profile, isAdmin } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Fetch Student Profile
  const { data: student } = useQuery({
    queryKey: ['student-profile', user?.email],
    queryFn: () => user?.email ? studentsService.getStudentByEmail(user.email) : null,
    enabled: !!user?.email
  });

  // Fetch Data Dependent on Student ID
  const { data: grades = [] } = useQuery({
    queryKey: ['student-grades', student?.id],
    queryFn: () => student?.id ? studentsService.getStudentGrades(student.id) : [],
    enabled: !!student?.id
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['student-attendance', student?.id],
    queryFn: () => student?.id ? lessonsService.getStudentAttendance(student.id) : [],
    enabled: !!student?.id
  });

  // Fetch Global Data
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: lessonsService.getLessons
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: announcementsService.getAnnouncements
  });


  // Process Stats
  // 1. GPA
  const uniqueSubjects = new Set(grades.map((g: any) => g.assessment?.subject_id).filter(Boolean));
  const totalGrades = grades.reduce((acc: number, curr: any) => acc + Number(curr.grade), 0);
  const averageGrade = grades.length > 0 ? totalGrades / grades.length : 0;

  // 2. Attendance
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((r: any) => r.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

  // 2.1 Enrolled disciplines (More robust count)
  const subjectsFromLessons = new Set(
    lessons
      .filter((l: any) => l.class_name === student?.class_name)
      .map((l: any) => l.subject_id)
      .filter(Boolean)
  );
  const subjectsFromAttendance = new Set(attendance.map((a: any) => a.lesson?.subject_id).filter(Boolean));

  const allStudentSubjects = new Set([
    ...Array.from(subjectsFromLessons),
    ...Array.from(uniqueSubjects),
    ...Array.from(subjectsFromAttendance)
  ]);

  const discplinesCount = allStudentSubjects.size;

  // 3. Upcoming Lessons
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize 'now' to midnight for fair comparison
  const upcomingLessons = lessons
    .filter((l: any) => parseLocalDate(l.date) >= now)
    .sort((a: any, b: any) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
    .slice(0, 2);

  // 4. Grades Summary (Grouped by Subject)
  const gradesBySubject = new Map();
  grades.forEach((g: any) => {
    const subjectName = g.assessment?.subject?.name || "Desconhecida";
    if (!gradesBySubject.has(subjectName)) {
      gradesBySubject.set(subjectName, { total: 0, count: 0 });
    }
    const entry = gradesBySubject.get(subjectName);
    entry.total += Number(g.grade);
    entry.count += 1;
  });

  const resumoNotas = Array.from(gradesBySubject.entries()).map(([name, data]: any) => ({
    disciplina: name,
    media: data.total / data.count,
    tendencia: "up" // Simplified
  })).slice(0, 3);

  // 5. Announcements
  const recentAnnouncements = announcements.slice(0, 2);
  const urgentAnnouncement = announcements.find((a: any) => a.type === 'urgente');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const { data: availableCourses = [], refetch: refetchCourses } = useQuery({
    queryKey: ['available-courses', user?.id, upcomingLessons[0]?.subject?.name, student?.class_name],
    queryFn: () => user?.id ? coursesService.getAvailableCourses(
      user.id,
      upcomingLessons[0]?.subject?.name || upcomingLessons[0]?.topic || student?.class_name
    ) : [],
    enabled: !!user?.id
  });

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const fullName = user?.user_metadata?.full_name || student?.name || user?.user_metadata?.name || 'Aluno';
  const firstName = fullName.split(' ')[0];

  return (
    <PortalLayout title={`Bem-vindo de volta, ${firstName}!`} description="Aqui está o resumo do seu progresso acadêmico.">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Urgent Announcement Banner */}
        {urgentAnnouncement && (
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-xl border border-destructive/20 bg-background/50 p-4 shadow-sm md:p-6">
              <div className="absolute left-0 top-0 h-full w-1.5 bg-destructive" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-lg text-foreground">Atenção</h3>
                    <Badge variant="destructive" className="bg-destructive hover:bg-destructive/90 font-bold">Urgente</Badge>
                    {urgentAnnouncement.pinned && <Pin className="h-3 w-3 text-muted-foreground rotate-45" />}
                  </div>
                  <p className="text-base font-medium text-foreground/90">{urgentAnnouncement.content}</p>
                  <div className="flex items-center gap-3 pt-2 text-xs font-bold text-muted-foreground">
                    <span>{urgentAnnouncement.author_name || 'Admin'}</span>
                    <span>•</span>
                    <span>{new Date(urgentAnnouncement.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-[10px] h-5 border-muted-foreground/20 text-muted-foreground">
                      {urgentAnnouncement.audience === 'todos' ? 'Toda a escola' : urgentAnnouncement.audience}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Password Warning Banner */}
        {user?.user_metadata?.must_change_password && (
          <motion.div variants={itemVariants}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 text-sm font-bold">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>Sua conta utiliza uma senha temporária. Para sua segurança, recomendamos que altere sua senha.</span>
              </div>
              <Link to="/portal/perfil">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl whitespace-nowrap">
                  Alterar Senha Agora
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Welcome Banner / Hero */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-primary px-6 py-8 md:px-8 md:py-10 text-primary-foreground shadow-2xl shadow-primary/20">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-emerald-500 text-white hover:bg-emerald-600 border-none px-3 py-1 font-bold">
                MATRÍCULA ATIVA
              </Badge>
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">Sua jornada continua hoje.</h2>
              <p className="max-w-md text-primary-foreground/80 font-medium">
                Mantenha o foco e alcance seus objetivos teológicos!
              </p>
              {upcomingLessons.length > 0 && (
                <div className="pt-2 animate-in fade-in slide-in-from-left-4 duration-700">
                  <Badge variant="outline" className="bg-white/10 border-white/20 text-white font-bold px-3 py-1.5 backdrop-blur-md">
                    <BookOpen className="h-3.5 w-3.5 mr-2" />
                    Módulo Atual: <span className="ml-1.5 text-white underline decoration-white/30 underline-offset-4 decoration-2">{upcomingLessons[0]?.subject?.name || upcomingLessons[0]?.topic || "Disciplina"}</span>
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl shadow-xl shadow-black/10">
                <PlayCircle className="mr-2 h-5 w-5" />
                Próxima Aula
              </Button>
            </div>
          </div>
        </motion.div>


        {/* Admin Debug Message */}
        {isAdmin && availableCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-center"
          >
            <p className="text-xs font-bold text-yellow-600/80 uppercase tracking-widest mb-1">Dica de Admin</p>
            <p className="text-sm text-muted-foreground">
              A seção de matrícula não apareceu. Verifique se o curso está com <code className="text-emerald-500 font-bold">Matrículas Abertas</code> ativado no <strong>Editor do Site</strong>.
            </p>
          </motion.div>
        )}

        {/* New Course Enrollment Section - Only if next course is available */}
        {availableCourses.length > 0 && (
          <motion.div
            variants={itemVariants}
            className={cn(
              "group relative overflow-hidden rounded-2xl border-2 p-4 md:p-6 shadow-lg transition-all duration-300",
              availableCourses[0].isLocked
                ? "border-muted bg-muted/5 shadow-none grayscale-[0.5]"
                : "border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/10"
            )}
          >
            <div className={cn(
              "absolute top-[-20%] right-[-5%] w-64 h-64 rounded-full blur-3xl -z-10 transition-all duration-700",
              availableCourses[0].isLocked ? "bg-muted/10" : "bg-emerald-500/10 group-hover:bg-emerald-500/20"
            )} />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex gap-4 md:gap-6 items-center flex-1">
                <div className={cn(
                  "h-16 w-16 md:h-20 md:w-20 shrink-0 rounded-2xl flex items-center justify-center shadow-lg",
                  availableCourses[0].isLocked
                    ? "bg-muted text-muted-foreground shadow-none"
                    : "bg-emerald-500 text-white shadow-emerald-500/30"
                )}>
                  {availableCourses[0].isLocked ? (
                    <Clock className="h-8 w-8 md:h-10 md:w-10 opacity-50" />
                  ) : (
                    <Sparkles className="h-8 w-8 md:h-10 md:w-10 animate-pulse" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {availableCourses[0].isLocked ? (
                      <Badge variant="outline" className="font-black text-[10px] tracking-wider border-muted-foreground/30 text-muted-foreground">AGUARDANDO</Badge>
                    ) : !availableCourses[0].active ? (
                      <Badge variant="outline" className="font-black text-[10px] tracking-wider border-amber-500/30 text-amber-500 bg-amber-500/5">EM BREVE</Badge>
                    ) : (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 font-black text-[10px] tracking-wider">LIBERADO</Badge>
                    )}
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Próxima Etapa</span>
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-black text-foreground leading-tight">
                    {availableCourses[0].title}
                  </h3>
                  <p className="text-sm font-bold text-muted-foreground max-w-lg line-clamp-2 md:line-clamp-none">
                    {availableCourses[0].isLocked
                      ? "Este módulo será liberado para matrícula assim que você concluir sua disciplina atual. Continue firme!"
                      : !availableCourses[0].active
                        ? "Este módulo está em fase de planejamento e as matrículas serão abertas em breve. Fique atento!"
                        : (availableCourses[0].description || "Sua jornada teológica continua aqui. Matricule-se no próximo módulo e não perca o ritmo!")}
                  </p>
                </div>
              </div>

              <div className={cn(
                "flex flex-col items-center gap-3 w-full md:w-auto md:min-w-[200px] p-4 rounded-xl backdrop-blur-sm border shadow-sm",
                (availableCourses[0].isLocked || !availableCourses[0].active)
                  ? "bg-muted/20 border-border/50"
                  : "bg-background/50 border-emerald-500/20"
              )}>
                <div className="text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Investimento</p>
                  <p className={cn(
                    "text-3xl font-black tracking-tight",
                    (availableCourses[0].isLocked || !availableCourses[0].active) ? "text-muted-foreground/50" : "text-emerald-600"
                  )}>
                    R$ {availableCourses[0].price?.toFixed(2) || "35,00"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (!availableCourses[0].isLocked && availableCourses[0].active) {
                      setSelectedCourse(availableCourses[0]);
                      setIsPaymentModalOpen(true);
                    }
                  }}
                  disabled={availableCourses[0].isLocked || !availableCourses[0].active}
                  className={cn(
                    "w-full font-black rounded-xl shadow-lg flex items-center justify-center gap-2 h-12 transition-all",
                    (availableCourses[0].isLocked || !availableCourses[0].active)
                      ? "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed shadow-none"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                  )}
                >
                  {availableCourses[0].isLocked ? (
                    <>MÓDULO BLOQUEADO</>
                  ) : !availableCourses[0].active ? (
                    <>MATRÍCULAS EM BREVE</>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-current" />
                      MATRICULAR AGORA
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                {availableCourses[0].isLocked && (
                  <p className="text-[10px] font-bold text-muted-foreground text-center">
                    Conclua seu módulo atual primeiro
                  </p>
                )}
                {!availableCourses[0].isLocked && !availableCourses[0].active && (
                  <p className="text-[10px] font-bold text-amber-600/70 text-center">
                    Aguardando abertura de turma
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Média Geral", value: averageGrade.toFixed(1), icon: StarIcon, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { label: "Frequência", value: `${attendanceRate.toFixed(1)}%`, icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Disciplinas", value: discplinesCount.toString(), icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Avisos", value: announcements.length.toString(), icon: Bell, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className={cn("overflow-hidden border-none transition-all hover:scale-[1.02] active:scale-[0.98] shadow-soft bg-background/50 backdrop-blur-sm border", stat.border)}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", stat.bg)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                      <p className="font-display text-3xl font-bold tracking-tight">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Próximas Aulas - Left Column (2/3 width) */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h3 className="font-display text-2xl font-bold tracking-tight">Agenda de Aulas</h3>
              <Link to="/portal/calendario">
                <Button variant="ghost" size="sm" className="font-bold text-primary group w-full md:w-auto justify-start md:justify-center">
                  Cronograma Completo <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingLessons.length === 0 ? (
                <Card className="border-dashed border-2 shadow-none bg-muted/20">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground/50 mb-4" />
                    <h4 className="font-bold text-lg text-muted-foreground">Sem aulas agendadas</h4>
                    <p className="text-sm text-muted-foreground/70">Nenhuma aula próxima encontrada.</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingLessons.map((aula: any) => (
                  <Card key={aula.id} className="group overflow-hidden border-none shadow-soft hover:shadow-elevated transition-all duration-300">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative h-48 w-full md:h-auto md:w-48 shrink-0 overflow-hidden bg-muted flex items-center justify-center">
                        {/* Placeholder or subject image if available */}
                        <BookOpen className="h-12 w-12 text-muted-foreground/20" />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-primary/90 text-[10px] font-bold">AGENDADA</Badge>
                        </div>
                      </div>
                      <CardContent className="flex flex-1 min-w-0 flex-col justify-between p-4 md:p-6 overflow-hidden">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              {aula.topic
                                ? (aula.subject?.name || "Disciplina")
                                : (aula.class_name && aula.subject?.name?.trim() !== aula.class_name?.replace(/\.$/, "").trim()
                                  ? aula.class_name
                                  : "")}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
                              <Calendar className="h-3.5 w-3.5" />
                              {parseLocalDate(aula.date).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }).toUpperCase()}
                            </div>
                          </div>
                          <h4 className="font-display text-lg md:text-xl font-bold leading-tight group-hover:text-primary transition-colors break-words">
                            {aula.topic || aula.subject?.name || "Disciplina não definida"}
                          </h4>
                          <p className="text-sm font-medium text-muted-foreground">Horário: {aula.time}</p>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {aula.time}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            {(aula.recording_link && (
                              student?.modality === 'online' ||
                              (student?.modality === 'presencial' && aula.release_for_presencial)
                            )) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold"
                                  onClick={() => window.open(aula.recording_link, '_blank')}
                                >
                                  Ver Gravação
                                </Button>
                              )}
                            <Button
                              size="sm"
                              className="rounded-xl shadow-lg shadow-primary/10"
                              onClick={() => {
                                setSelectedLesson(aula);
                                setIsDetailsOpen(true);
                              }}
                            >
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </motion.div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-8">
            {/* Notas e Progresso */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-soft overflow-hidden">
                <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="font-display text-lg font-bold">Desempenho Acadêmico</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {resumoNotas.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-4">Nenhuma nota registrada.</p>
                  ) : (
                    resumoNotas.map((nota: any, i: number) => (
                      <div key={i} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-muted-foreground">{nota.disciplina}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-primary">{nota.media.toFixed(1)}</span>
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          </div>
                        </div>
                        <Progress value={nota.media * 10} className="h-2 bg-muted transition-all" />
                      </div>
                    ))
                  )}
                  <Link to="/portal/notas" className="block mt-4">
                    <Button variant="outline" className="w-full rounded-xl border-primary/20 font-bold text-primary hover:bg-primary/5">
                      Relatório Completo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Avisos Importantes */}
            <motion.div variants={itemVariants}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <h3 className="font-display text-xl font-bold">Comunicados</h3>
                <Link to="/portal/avisos">
                  <Badge variant="outline" className="cursor-pointer border-primary/20 text-primary hover:bg-primary/5 transition-colors font-bold w-fit">VER TODOS</Badge>
                </Link>
              </div>
              <div className="space-y-3">
                {recentAnnouncements.length === 0 ? (
                  <Card className="border-dashed border shadow-soft bg-muted/20">
                    <CardContent className="p-4 text-center text-sm text-muted-foreground">
                      Nenhum comunicado recente.
                    </CardContent>
                  </Card>
                ) : (
                  recentAnnouncements.map((aviso: any) => (
                    <Card key={aviso.id} className="border-none shadow-soft transition-all hover:translate-x-1 cursor-pointer">
                      <CardContent className="p-4 flex gap-4">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          aviso.pinned ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        )}>
                          <Bell className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="truncate text-sm font-bold leading-none">{aviso.title}</h4>
                            <span className="shrink-0 text-[10px] font-bold text-muted-foreground/60 uppercase">{new Date(aviso.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}</span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground font-medium">{aviso.content}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recursos Rápidos Section */}
        <motion.div variants={itemVariants} className="pt-8 border-t border-border/50">
          <h3 className="font-display text-2xl font-bold mb-6">Recursos para seus Estudos</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Pasta de Materiais", icon: Download, desc: "Acesse slides e apostilas", link: "/portal/materiais" },
              { label: "Gravações", icon: PlayCircle, desc: "Reveja aulas passadas", link: "/portal/materiais" },
              { label: "Bibilioteca Virtual", icon: BookOpen, desc: "Acervo de obras teológicas", link: "/portal/materiais" },
              { label: "Dúvidas Acadêmicas", icon: Bell, desc: "Fale com os tutores", link: "/portal/ajuda" },
            ].map((resource, i) => (
              <Link key={i} to={resource.link}>
                <Card className="group h-full border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer shadow-none">
                  <CardContent className="p-6 h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <resource.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm tracking-tight">{resource.label}</h4>
                        <p className="text-xs text-muted-foreground font-medium">{resource.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <LessonDetailsDialog
        lesson={selectedLesson}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <EnrollmentPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          refetchCourses();
        }}
        course={selectedCourse}
        student={student || null}
      />
    </PortalLayout>
  );
}
