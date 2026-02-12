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
import { LessonDetailsDialog } from "@/components/portal/LessonDetailsDialog";
import { useState } from "react";

export default function PortalDashboard() {
  const { user } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
  const uniqueSubjects = new Set(grades.map((g: any) => g.assessment?.subject_id));
  const totalGrades = grades.reduce((acc: number, curr: any) => acc + Number(curr.grade), 0);
  const averageGrade = grades.length > 0 ? totalGrades / grades.length : 0;

  // 2. Attendance
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((r: any) => r.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

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
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-primary px-8 py-10 text-primary-foreground shadow-2xl shadow-primary/20">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-emerald-500 text-white hover:bg-emerald-600 border-none px-3 py-1 font-bold">
                MATRÍCULA ATIVA
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Sua jornada continua hoje.</h2>
              <p className="max-w-md text-primary-foreground/80 font-medium">
                Mantenha o foco e alcance seus objetivos teológicos!
              </p>
            </div>
            <div className="flex gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl shadow-xl shadow-black/10">
                <PlayCircle className="mr-2 h-5 w-5" />
                Próxima Aula
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" id="tour-stats">
          {[
            { label: "Média Geral", value: averageGrade.toFixed(1), icon: StarIcon, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { label: "Frequência", value: `${attendanceRate.toFixed(1)}%`, icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Disciplinas", value: uniqueSubjects.size.toString(), icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
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
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Próximas Aulas - Left Column (2/3 width) */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6" id="tour-agenda">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-display text-2xl font-bold tracking-tight">Agenda de Aulas</h3>
              <Link to="/portal/calendario">
                <Button variant="ghost" size="sm" className="font-bold text-primary group w-full sm:w-auto justify-start sm:justify-center">
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
                      <CardContent className="flex flex-1 flex-col justify-between p-4 md:p-6">
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
                          <h4 className="font-display text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                            {aula.topic || aula.subject?.name || "Disciplina não definida"}
                          </h4>
                          <p className="text-sm font-medium text-muted-foreground">Horário: {aula.time}</p>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {aula.time}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
            <motion.div variants={itemVariants} id="tour-performance">
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
            <motion.div variants={itemVariants} id="tour-announcements">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
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
        <motion.div variants={itemVariants} className="pt-8 border-t border-border/50" id="tour-resources">
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
    </PortalLayout>
  );
}
