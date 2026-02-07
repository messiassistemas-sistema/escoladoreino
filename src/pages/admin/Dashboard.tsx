import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";



export default function AdminDashboard() {
  const { data: statsData = [], isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      try {
        const [
          studentsResp,
          teachersResp,
          subjectsResp,
          pendingStudentsResp
        ] = await Promise.all([
          supabase.from("students").select("*", { count: "exact", head: true }),
          supabase.from("teachers").select("*", { count: "exact", head: true }),
          supabase.from("subjects").select("*", { count: "exact", head: true }),
          supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        ]);

        return [
          { label: "Total de Alunos", value: studentsResp.count?.toString() || "0", icon: Users, trend: "Cadastrados" },
          { label: "Professores", value: teachersResp.count?.toString() || "0", icon: GraduationCap, trend: "Ativos" },
          { label: "Disciplinas", value: subjectsResp.count?.toString() || "0", icon: BookOpen, trend: "No currículo" },
          { label: "Matrículas Pendentes", value: pendingStudentsResp.count?.toString() || "0", icon: AlertCircle, trend: "Aguardando" },
        ];
      } catch (err) {
        console.error("Dashboard stats error:", err);
        return [
          { label: "Total de Alunos", value: "0", icon: Users, trend: "Erro ao carregar" },
          { label: "Professores", value: "0", icon: GraduationCap, trend: "Erro ao carregar" },
          { label: "Disciplinas", value: "0", icon: BookOpen, trend: "Erro ao carregar" },
          { label: "Matrículas Pendentes", value: "0", icon: AlertCircle, trend: "Erro ao carregar" },
        ];
      }
    },
  });

  const { data: recentStudents = [] } = useQuery({
    queryKey: ["recent-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  // Dynamic tasks based on real data
  const pendingCount = parseInt(statsData.find(s => s.label === "Matrículas Pendentes")?.value || "0");

  const pendingTasks = [
    ...(pendingCount > 0 ? [{
      title: `Aprovar ${pendingCount} matrícula${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}`,
      priority: "high"
    }] : []),
    { title: "Lançar notas de Teologia Sistemática", priority: "medium" },
    { title: "Publicar aviso sobre recesso", priority: "low" },
  ];


  return (
    <AdminLayout title="Dashboard" description="Visão geral do sistema">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(isLoading ? Array(4).fill(null) : statsData).map((stat, index) => (
            <motion.div
              key={stat?.label || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      {isLoading || !stat ? (
                        <div className="h-6 w-6 animate-pulse rounded bg-primary/20" />
                      ) : (
                        <stat.icon className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isLoading || !stat ? <Skeleton className="h-4 w-24" /> : stat.label}
                      </p>
                      <p className="font-display text-2xl font-bold">
                        {isLoading || !stat ? <Skeleton className="h-8 w-16" /> : stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isLoading || !stat ? <Skeleton className="h-3 w-20" /> : stat.trend}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>



        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Enrollments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="font-display">Matrículas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentStudents.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display font-semibold text-primary">
                          {enrollment.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{enrollment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            enrollment.status === "ativo" ? "default" : "secondary"
                          }
                          className={
                            enrollment.status === "ativo"
                              ? "bg-success text-success-foreground"
                              : ""
                          }
                        >
                          {enrollment.status === "ativo" ? "Ativa" : enrollment.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(enrollment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentStudents.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Nenhuma matrícula recente encontrada.
                    </p>
                  )}
                </div>
              </CardContent>

            </Card>
          </motion.div>

          {/* Pending Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="font-display">Tarefas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-lg border border-border p-4"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${task.priority === "high"
                          ? "bg-destructive/10"
                          : task.priority === "medium"
                            ? "bg-warning/10"
                            : "bg-muted"
                          }`}
                      >
                        <AlertCircle
                          className={`h-5 w-5 ${task.priority === "high"
                            ? "text-destructive"
                            : task.priority === "medium"
                              ? "text-warning"
                              : "text-muted-foreground"
                            }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          task.priority === "high"
                            ? "border-destructive/30 text-destructive"
                            : task.priority === "medium"
                              ? "border-warning/30 text-warning"
                              : ""
                        }
                      >
                        {task.priority === "high"
                          ? "Alta"
                          : task.priority === "medium"
                            ? "Média"
                            : "Baixa"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
