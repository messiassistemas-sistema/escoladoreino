import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Smartphone,
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  Info,
  ShieldCheck,
  AlertCircle,
  ShieldAlert,
  Search,
  Check
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { studentsService } from "@/services/studentsService";
import { lessonsService } from "@/services/lessonsService";
import { useStudentData } from "@/hooks/useStudentData";
import { Scanner } from '@yudiel/react-qr-scanner';
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function PortalPresenca() {
  const { user } = useAuth();
  const { student } = useStudentData();
  const queryClient = useQueryClient();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'loading';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: ''
  });

  const handleScan = async (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const rawValue = detectedCodes[0].rawValue;
      if (rawValue) {
        setIsScannerOpen(false); // Close immediately to prevent double scan

        try {
          // Parse potential JSON QR code
          let lessonId = rawValue.trim();
          try {
            const data = JSON.parse(rawValue);
            if (data && data.lessonId) lessonId = data.lessonId.trim();
          } catch (e) { /* Not JSON */ }

          // Validate UUID simply
          if (lessonId.length < 20) {
            setStatusModal({
              open: true,
              type: 'error',
              title: 'QR Code Inválido',
              message: 'O código escaneado não parece ser uma aula válida.'
            });
            return;
          }
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(lessonId)) {
            setStatusModal({
              open: true,
              type: 'error',
              title: 'Código Não Reconhecido',
              message: 'Certifique-se de escanear o QR Code projetado pelo professor.'
            });
            return;
          }

          // Verificar se a chamada está aberta
          const lesson = await lessonsService.getLessonById(lessonId);
          if (!lesson || !lesson.attendance_open) {
            setStatusModal({
              open: true,
              type: 'error',
              title: 'Chamada Fechada',
              message: 'O professor ainda não abriu a chamada para esta aula ou ela já foi encerrada.'
            });
            return;
          }

          if (!student?.id) {
            setStatusModal({
              open: true,
              type: 'error',
              title: 'Aluno Não Identificado',
              message: `Não encontramos seu perfil para ${user?.email}. Sua matrícula está aprovada?`
            });
            return;
          }

          setStatusModal({
            open: true,
            type: 'loading',
            title: 'Registrando...',
            message: 'Aguarde um momento enquanto confirmamos sua presença.'
          });

          await lessonsService.markAttendance([{
            student_id: student.id,
            lesson_id: lessonId.trim(),
            status: 'present'
          }]);

          await queryClient.invalidateQueries({ queryKey: ['student-attendance'] });

          setStatusModal({
            open: true,
            type: 'success',
            title: 'Presença Confirmada!',
            message: `Sua presença na aula de ${lesson.subject?.name || "hoje"} foi registrada com sucesso. 🎉`
          });
        } catch (error: any) {
          console.error(error);
          setStatusModal({
            open: true,
            type: 'error',
            title: 'Falha no Registro',
            message: error.message || "Ocorreu um erro inesperado ao processar sua presença."
          });
        }
      }
    }
  };

  // Attendance query moved to next block

  // Fetch Attendance Records
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['student-attendance', student?.id],
    queryFn: () => student?.id ? lessonsService.getStudentAttendance(student.id) : [],
    enabled: !!student?.id
  });

  // Stats Logic
  const totalRecords = attendanceRecords.length;
  const presencas = attendanceRecords.filter((r: any) => r.status === 'present').length;
  const faltas = attendanceRecords.filter((r: any) => r.status === 'absent').length;
  const attendanceRate = totalRecords > 0 ? (presencas / totalRecords) * 100 : 0;

  // Recent History
  const historicoPresenca = attendanceRecords
    .slice()
    .sort((a: any, b: any) => new Date(b.lesson?.date).getTime() - new Date(a.lesson?.date).getTime())
    .slice(0, 5)
    .map((record: any) => ({
      data: record?.lesson?.date,
      disciplina: record?.lesson?.subject?.name || "Aula",
      status: record?.status,
      metodo: "manual" // Backend doesn't store 'method' yet but usually it's manual/qr
    }));

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
      <PortalLayout title="Frequência e Chamada" description="Carregando...">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout title="Frequência e Chamada" description="Acompanhe sua assiduidade e registre sua presença em aula.">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Main Banner / Quick Action */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-1 px-8 py-10 text-white shadow-2xl border border-white/5">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-80 h-80 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-white/70">Aula em andamento</span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-4xl font-black tracking-tight leading-none">Registrar Presença</h2>
                  <p className="text-white/60 text-sm font-medium max-w-md">
                    Mantenha sua frequência acima de 75% para garantir sua aprovação. Escaneie o código da aula agora.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                        <Smartphone className="h-5 w-5" />
                        Escanear QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40 rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="font-display text-2xl font-bold">Leitor de Presença</DialogTitle>
                        <DialogDescription className="font-medium text-muted-foreground">
                          Aponte a câmera para o código projetado pelo professor.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-6 py-4">
                        <div className="relative w-full aspect-square max-w-[300px] overflow-hidden rounded-[2rem] border-4 border-primary/20 bg-black">
                          <Scanner
                            onScan={handleScan}
                            styles={{ container: { width: '100%', height: '100%' } }}
                            components={{ torch: true }}
                          />
                          {/* Overlay Scan Line Animation */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/60 animate-scan shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
                            <div className="absolute inset-8 border-2 border-white/30 rounded-xl" />
                          </div>
                        </div>

                        <div className="w-full space-y-3 px-4">
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border/50">
                            <Info className="h-4 w-4 text-primary" />
                            <p className="text-[11px] font-medium leading-tight text-muted-foreground">
                              Aponte para o QR Code da aula. A presença será confirmada automaticamente.
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex items-center gap-3 px-4 border-l border-white/10">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Sua Frequência</p>
                      <p className="font-display text-2xl font-black text-white tabular-nums">{attendanceRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Circle/Card */}
              <div className="flex gap-4 sm:gap-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                    <TrendingUp className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white tabular-nums">{presencas}</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Presenças</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                    <XCircle className="h-8 w-8 text-rose-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white tabular-nums">{faltas}</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Faltas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Detailed Progress */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display text-2xl font-bold">Frequência por Disciplina</h3>
              <Badge variant="outline" className="border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest h-6">Geral</Badge>
            </div>

            {attendanceRecords.length === 0 ? (
              <Card className="border-dashed border-2 shadow-none bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-4" />
                  <h4 className="font-bold text-lg text-muted-foreground">Sem registros</h4>
                  <p className="text-sm text-muted-foreground/70">Nenhuma frequência registrada até o momento.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {/* For now, just show a general card since we don't have per-subject stats easily */}
                <Card className="group border-none shadow-soft overflow-hidden transition-all duration-300 hover:shadow-elevated">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-display text-lg font-bold group-hover:text-primary transition-colors">Visão Geral</h4>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{presencas} de {totalRecords} aulas</p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "font-display text-2xl font-black tabular-nums leading-none",
                            attendanceRate >= 75 ? "text-emerald-500" : "text-rose-500"
                          )}>{attendanceRate.toFixed(0)}%</span>
                          <div className="mt-1">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-bold uppercase px-1.5 h-4 border-none",
                              attendanceRate >= 75 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            )}>{attendanceRate >= 75 ? "Regular" : "Alerta"}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${attendanceRate}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={cn(
                            "absolute h-full rounded-full transition-all duration-500",
                            attendanceRate >= 75 ? "bg-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>

          {/* Recent History Table Style Sidebar */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="font-display text-2xl font-bold px-1">Últimos Registros</h3>
            <Card className="border-none shadow-soft h-fit overflow-hidden">
              {historicoPresenca.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Sem histórico recente.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {historicoPresenca.map((item: any, index: number) => (
                    <div key={index} className="p-5 flex items-start gap-4 hover:bg-muted/30 transition-colors group">
                      <div className={cn(
                        "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                        item.status === "present" ? "bg-emerald-500/10" : "bg-rose-500/10"
                      )}>
                        {item.status === "present" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest tabular-nums">
                            {new Date(item.data).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                          </p>
                          {item.metodo && (
                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter px-1 h-3.5 border-primary/20 text-primary/60">
                              {item.metodo}
                            </Badge>
                          )}
                        </div>
                        <h5 className="font-bold text-sm truncate leading-tight group-hover:text-primary transition-colors">{item.disciplina}</h5>
                        <p className={cn(
                          "text-[10px] font-bold uppercase",
                          item.status === "present" ? "text-emerald-600/70" : "text-rose-600/70"
                        )}>
                          {item.status === "present" ? "Presença Confirmada" : "Falta Registrada"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-4 bg-muted/20 border-t border-border/50 text-center">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-primary gap-1 hover:bg-primary/5">
                  Ver histórico completo <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </Card>

            {/* Security Hint */}
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[10px] font-semibold text-primary/70 leading-relaxed">
                Seu registro é protegido por geolocalização. Certifique-se de estar conectado ao Wi-Fi da escola.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* High-Visibility Status Modal */}
      <Dialog
        open={statusModal.open}
        onOpenChange={(open) => !open && setStatusModal(prev => ({ ...prev, open: false }))}
      >
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-none shadow-2xl rounded-3xl overflow-hidden p-0">
          <div className={cn(
            "p-10 flex flex-col items-center text-center space-y-6",
            statusModal.type === 'success' ? "bg-emerald-500/5" :
              statusModal.type === 'error' ? "bg-rose-500/5" : "bg-primary/5"
          )}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1
              }}
              className={cn(
                "h-24 w-24 rounded-full flex items-center justify-center shadow-lg",
                statusModal.type === 'success' ? "bg-emerald-500 text-white shadow-emerald-500/30" :
                  statusModal.type === 'error' ? "bg-rose-500 text-white shadow-rose-500/30" :
                    "bg-primary text-white shadow-primary/30"
              )}
            >
              {statusModal.type === 'success' && <Check className="h-12 w-12 stroke-[3px]" />}
              {statusModal.type === 'error' && <ShieldAlert className="h-12 w-12 stroke-[2px]" />}
              {statusModal.type === 'loading' && <Clock className="h-12 w-12 animate-pulse" />}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h3 className={cn(
                "font-display text-3xl font-black tracking-tight",
                statusModal.type === 'success' ? "text-emerald-600" :
                  statusModal.type === 'error' ? "text-rose-600" : "text-primary"
              )}>
                {statusModal.title}
              </h3>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-[280px] mx-auto">
                {statusModal.message}
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full pt-4"
            >
              <Button
                onClick={() => setStatusModal(prev => ({ ...prev, open: false }))}
                className={cn(
                  "w-full h-14 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]",
                  statusModal.type === 'success' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" :
                    statusModal.type === 'error' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" :
                      "bg-primary hover:bg-primary/90 shadow-primary/20"
                )}
              >
                {statusModal.type === 'loading' ? "Aguardando..." : "Entendido"}
              </Button>
            </motion.div>
          </div>

          {/* Success Decoration */}
          {statusModal.type === 'success' && (
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          )}
          {statusModal.type === 'error' && (
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
