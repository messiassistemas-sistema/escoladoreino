import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Video,
  ChevronRight,
  Info,
  Layers,
  Search
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { lessonsService } from "@/services/lessonsService";
import { LessonDetailsDialog } from "@/components/portal/LessonDetailsDialog";

export default function PortalCalendario() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: lessonsService.getLessons
  });

  const { data: student } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const { data: { user } } = await import("@/integrations/supabase/client").then(m => m.supabase.auth.getUser());
      if (!user?.email) return null;
      const { studentsService } = await import("@/services/studentsService");
      return studentsService.getStudentByEmail(user.email);
    }
  });

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const selectedDateStr = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : undefined;
  const aulasNoDia = lessons.filter((a: any) => a.date === selectedDateStr);
  const datasComAula = lessons.map((a: any) => parseLocalDate(a.date));

  const proximasAulas = lessons
    .filter((a: any) => parseLocalDate(a.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a: any, b: any) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
    .slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <PortalLayout title="Calendário de Aulas" description="Carregando cronograma...">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout title="Calendário de Aulas" description="Organize seus estudos e acompanhe o cronograma completo do semestre.">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-8 lg:grid-cols-12"
      >
        {/* Left Column - Calendar & Filter */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-soft overflow-hidden bg-background/60 backdrop-blur-xl">
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-xl font-bold">Seletor de Data</CardTitle>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <CardDescription>Escolha um dia para ver o cronograma.</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-xl w-full"
                  locale={ptBR}
                  modifiers={{
                    hasClass: datasComAula,
                  }}
                  modifiersClassNames={{
                    hasClass: "bg-primary/20 text-primary font-bold shadow-sm ring-1 ring-primary/20 ring-offset-2",
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-primary/10 bg-primary/5 shadow-none overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-primary">Sincronização</h5>
                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                      Você pode exportar este calendário para o seu Google Calendar ou iCal através das configurações do portal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Schedule & List */}
        <div className="lg:col-span-8 space-y-8">
          {/* Focus View - Selected Day */}
          <AnimatePresence mode="wait">
            <motion.div
              key={date?.toDateString() || 'none'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Programação para</p>
                  <h3 className="font-display text-3xl font-black lowercase first-letter:uppercase tracking-tight leading-none">
                    {date?.toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long' }) || 'Selecione uma data'}
                  </h3>
                </div>
                {aulasNoDia.length > 0 && <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-xs h-6">{aulasNoDia.length} Aulas</Badge>}
              </div>

              <div className="grid gap-4">
                {aulasNoDia.length > 0 ? (
                  aulasNoDia.map((aula: any) => (
                    <Card key={aula.id} className="group border-none shadow-soft overflow-hidden transition-all duration-300 hover:shadow-elevated">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          <div className="w-full sm:w-2 bg-primary transition-all group-hover:w-3" />
                          <div className="flex-1 p-6 flex items-center justify-between gap-6">
                            <div className="space-y-3">
                              <div className="space-y-1">
                                {aula.topic && (
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">
                                    {aula.subject?.name || "Disciplina"}
                                  </span>
                                )}
                                <div className="flex items-center gap-2">
                                  <h4 className="font-display text-xl font-bold group-hover:text-primary transition-colors leading-tight">
                                    {aula.topic || aula.subject?.name || "Aula"}
                                  </h4>
                                  <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest px-1.5 h-4 border-primary/20 text-primary shrink-0">{aula.mode}</Badge>
                                </div>
                                {(!aula.topic && aula.class_name && aula.subject?.name?.trim() !== aula.class_name?.replace(/\.$/, "").trim()) && (
                                  <p className="text-xs text-muted-foreground font-medium">{aula.class_name}</p>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                                    <User className="h-3.5 w-3.5" />
                                  </div>
                                  {aula.teacher_name || "A definir"}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                                    <Clock className="h-3.5 w-3.5" />
                                  </div>
                                  {aula.time}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                                    {aula.mode === 'online' ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                                  </div>
                                  {aula.location || "Online"}
                                </div>
                              </div>
                            </div>
                            <Button
                              className={cn(
                                "hidden sm:flex rounded-xl font-bold bg-muted text-foreground hover:bg-primary hover:text-white transition-all",
                                aula.mode === 'online' && "bg-primary text-white shadow-lg shadow-primary/20"
                              )}
                            >
                              {aula.mode === 'online' ? 'Acessar Live' : 'Ver Local'}
                            </Button>
                            {(aula.recording_link && (
                              student?.modality === 'online' ||
                              (student?.modality === 'presencial' && aula.release_for_presencial)
                            )) && (
                                <Button
                                  className="hidden sm:flex rounded-xl font-bold bg-muted text-foreground hover:bg-primary hover:text-white transition-all ml-2"
                                  onClick={() => window.open(aula.recording_link, '_blank')}
                                >
                                  Ver Gravação
                                </Button>
                              )}
                            <Button
                              variant="outline"
                              className="hidden sm:flex rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5 transition-all ml-2"
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
                    </Card>
                  ))
                ) : (
                  <div className="rounded-[2rem] border-2 border-dashed border-border/50 p-12 text-center bg-muted/20">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <Layers className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <h5 className="font-bold text-lg text-muted-foreground/70 tracking-tight">Vazio por enquanto...</h5>
                    <p className="text-sm text-muted-foreground/50 font-medium">Não há aulas programadas para este dia no seu cronograma.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Next Classes List */}
          <motion.div variants={itemVariants} className="space-y-4 pt-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display text-2xl font-bold">Resumo das Próximas Aulas</h3>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-primary gap-1">Ver todas <ChevronRight className="h-3 w-3" /></Button>
            </div>

            <div className="grid gap-3">
              {proximasAulas.map((aula: any, index: number) => {
                const aulaDate = parseLocalDate(aula.date);
                const isToday = aulaDate.toDateString() === new Date().toDateString();

                return (
                  <motion.div
                    key={aula.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + (index * 0.1) }}
                    className={cn(
                      "group flex items-center gap-6 rounded-2xl bg-background/50 border border-border/50 p-4 transition-all hover:bg-white hover:shadow-card hover:border-transparent cursor-pointer",
                      isToday && "ring-2 ring-primary ring-offset-4 ring-offset-background"
                    )}
                    onClick={() => {
                      setSelectedLesson(aula);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="text-sm font-black leading-none">{aulaDate.getDate()}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">{aulaDate.toLocaleDateString("pt-BR", { month: "short" })}</span>
                    </div>

                    <div className="flex-1 overflow-hidden space-y-0.5">
                      {aula.topic && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block truncate">
                          {aula.subject?.name || "Disciplina"}
                        </span>
                      )}
                      <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                        {aula.topic || aula.subject?.name || "Aula"}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {aula.time}</span>
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {aula.teacher_name}</span>
                      </div>
                    </div>

                    {isToday && (
                      <Badge className="bg-primary text-white text-[8px] font-black uppercase tracking-widest animate-pulse">Hoje</Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
      <LessonDetailsDialog
        lesson={selectedLesson}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </PortalLayout >
  );
}
