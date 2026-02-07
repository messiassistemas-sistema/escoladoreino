import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Award,
  TrendingUp,
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  Info,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { studentsService } from "@/services/studentsService";

export default function PortalNotas() {
  const { user } = useAuth();

  // Fetch Student
  const { data: student } = useQuery({
    queryKey: ['student-profile', user?.email],
    queryFn: () => user?.email ? studentsService.getStudentByEmail(user.email) : null,
    enabled: !!user?.email
  });

  // Fetch Grades
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['student-grades', student?.id],
    queryFn: () => student?.id ? studentsService.getStudentGrades(student.id) : [],
    enabled: !!student?.id
  });

  // Process data for UI
  const subjectsMap = new Map();

  grades.forEach((grade: any) => {
    const subjectName = grade.assessment?.subject?.name || "Disciplina Desconhecida";
    const subjectId = grade.assessment?.subject_id;

    if (!subjectsMap.has(subjectId)) {
      subjectsMap.set(subjectId, {
        id: subjectId,
        nome: subjectName,
        professor: grade.assessment?.subject?.teacher_name || "Não informado",
        status: "cursando",
        avaliacoes: []
      });
    }

    const subject = subjectsMap.get(subjectId);
    subject.avaliacoes.push({
      nome: grade.assessment?.name,
      peso: grade.assessment?.weight,
      nota: Number(grade.grade),
      data: grade.assessment?.date
    });
  });

  const disciplinas = Array.from(subjectsMap.values()).map(d => {
    const totalWeight = d.avaliacoes.reduce((acc: number, curr: any) => acc + curr.peso, 0);
    // Simple weighted average or sum depending on business logic. Assuming sum for now as per previous mock structure implies accumulation or average.
    // Let's calculate a simple average of grades for now.
    const sumGrades = d.avaliacoes.reduce((acc: number, curr: any) => acc + curr.nota, 0);
    const avg = d.avaliacoes.length > 0 ? sumGrades / d.avaliacoes.length : 0;

    return {
      ...d,
      media: avg,
      status: avg >= 7 ? "aprovado" : "cursando"
    };
  });

  const mediaGeral =
    disciplinas.length > 0
      ? disciplinas.reduce((acc, d) => acc + (d.media || 0), 0) / disciplinas.length
      : 0;

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
      <PortalLayout title="Desempenho Acadêmico" description="Carregando suas informações...">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout title="Desempenho Acadêmico" description="Confira suas notas, médias e situação em cada disciplina.">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Summary Info - Top Banner */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 py-10 text-primary-foreground shadow-2xl">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-[-20deg] translate-x-20" />
            <div className="relative z-10 grid gap-8 md:grid-cols-3 md:items-center">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60">Índice Acadêmico</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="font-display text-5xl font-black">{mediaGeral.toFixed(1)}</h2>
                  <span className="text-sm font-semibold text-primary-foreground/70">/ 10.0</span>
                </div>
                <p className="text-sm font-medium text-primary-foreground/80">Média geral calculada</p>
              </div>

              <div className="flex items-center gap-6 border-l border-white/10 md:pl-12">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{disciplinas.filter((d) => d.media >= 7).length}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/60">Aprovadas</p>
                </div>
              </div>

              <div className="flex items-center gap-6 border-l border-white/10 md:pl-12">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{disciplinas.filter((d) => d.media < 7).length}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/60">Cursando</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Legend / Info */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-6 rounded-2xl bg-background/50 p-4 border border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            <Info className="h-3.5 w-3.5 text-primary" />
            Critérios:
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="h-2 w-2 rounded-full bg-success" /> Média Inicial ≥ 7.0
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="h-2 w-2 rounded-full bg-warning" /> Recuperação &lt; 7.0
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="h-2 w-2 rounded-full bg-destructive" /> Reprovado &lt; 5.0
          </div>
        </motion.div>

        {/* Disciplinas List */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="font-display text-2xl font-bold px-1">Detalhamento por Disciplina</h3>

          {disciplinas.length === 0 ? (
            <Card className="border-dashed border-2 shadow-none bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-4" />
                <h4 className="font-bold text-lg text-muted-foreground">Nenhuma nota lançada</h4>
                <p className="text-sm text-muted-foreground/70">As notas aparecerão aqui assim que forem lançadas pela secretaria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {disciplinas.map((disciplina, i) => (
                <Card key={disciplina.id} className="group overflow-hidden border-none shadow-soft transition-all duration-300 hover:shadow-elevated">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={`item-${disciplina.id}`} className="border-none">
                      <AccordionTrigger className="w-full px-6 py-6 hover:no-underline transition-colors group-hover:bg-muted/30">
                        <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-lg font-bold group-hover:text-primary transition-colors">{disciplina.nome}</h4>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] uppercase font-bold px-1.5 h-5 leading-none",
                                  disciplina.status === "aprovado" ? "border-emerald-500/20 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" : "border-amber-500/20 text-amber-600 bg-amber-50 dark:bg-amber-950/20"
                                )}
                              >
                                {disciplina.status}
                              </Badge>
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">Professor {disciplina.professor}</p>
                          </div>

                          <div className="flex items-center gap-8 pr-4">
                            <div className="hidden lg:block w-40 space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <span>Aproveitamento</span>
                                <span>{disciplina.media ? (disciplina.media * 10).toFixed(0) : 0}%</span>
                              </div>
                              <Progress value={disciplina.media ? disciplina.media * 10 : 0} className="h-1.5" />
                            </div>

                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Média Atual</span>
                              <span className={cn(
                                "font-display text-2xl font-black tabular-nums",
                                disciplina.media && disciplina.media >= 7 ? "text-primary" : "text-muted-foreground/40"
                              )}>
                                {disciplina.media !== null ? disciplina.media.toFixed(1) : "—"}
                              </span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground/30 transition-transform group-data-[state=open]:rotate-90 group-data-[state=open]:text-primary" />
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-6 pb-6 pt-2 border-t border-border/50">
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="overflow-hidden rounded-xl border border-border/50 bg-background/50">
                            <Table>
                              <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent">
                                  <TableHead className="text-[10px] font-bold uppercase tracking-widest h-10">Atividade</TableHead>
                                  <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest h-10">Peso</TableHead>
                                  <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest h-10 px-4">Data</TableHead>
                                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest h-10 pr-6">Resultado</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {disciplina.avaliacoes.map((avaliacao: any, index: number) => (
                                  <TableRow key={index} className="last:border-none group/row transition-colors hover:bg-primary/[0.02]">
                                    <TableCell className="font-semibold py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover/row:bg-primary/10 transition-colors">
                                          <FileText className="h-4 w-4 text-muted-foreground group-hover/row:text-primary transition-colors" />
                                        </div>
                                        {avaliacao.nome}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold tabular-nums">
                                      <Badge variant="secondary" className="bg-muted text-[10px]">{avaliacao.peso}%</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(avaliacao.data).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                      <span className={cn(
                                        "font-display text-lg font-black tabular-nums",
                                        avaliacao.nota >= 7 ? "text-emerald-500" : "text-amber-500"
                                      )}>
                                        {avaliacao.nota.toFixed(1)}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </PortalLayout>
  );
}
