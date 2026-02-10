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
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

export default function AdminDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["admin-stats-v2"],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        studentsResp,
        teachersResp,
        subjectsResp,
        pendingStudentsResp,
        paymentsResp,
        attendanceResp,
        monthlyGrowthResp
      ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("payments").select("amount, status, created_at").gte("created_at", firstDayOfMonth),
        supabase.from("students").select("attendance_rate"),
        supabase.from("students").select("created_at")
      ]);

      // Calculate Revenue
      const monthlyRevenue = (paymentsResp.data || [])
        .filter(p => p.status === "pago" || p.status === "approved" || p.status === "paid")
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      // Calculate Average Attendance
      const validAttendance = (attendanceResp.data || [])
        .filter(s => s.attendance_rate !== null)
        .map(s => Number(s.attendance_rate));
      const avgAttendance = validAttendance.length > 0
        ? (validAttendance.reduce((a, b) => a + b, 0) / validAttendance.length).toFixed(1)
        : "0";

      // Payment Status Distribution
      const paymentStatusMap: Record<string, number> = {};
      (paymentsResp.data || []).forEach(p => {
        const status = p.status === "approved" || p.status === "paid" ? "pago" : (p.status || "pendente");
        paymentStatusMap[status] = (paymentStatusMap[status] || 0) + 1;
      });
      const paymentDistribution = Object.entries(paymentStatusMap).map(([name, value]) => ({ name, value }));

      // Monthly Growth (last 6 months)
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const growthMap: Record<string, number> = {};
      (monthlyGrowthResp.data || []).forEach(s => {
        const date = new Date(s.created_at!);
        const monthHeader = months[date.getMonth()];
        growthMap[monthHeader] = (growthMap[monthHeader] || 0) + 1;
      });
      const growthData = months
        .map(m => ({ name: m, total: growthMap[m] || 0 }))
        .filter((_, i) => i <= now.getMonth() && i > now.getMonth() - 6);

      return {
        stats: [
          { label: "Total de Alunos", value: studentsResp.count?.toString() || "0", icon: Users, trend: "Cadastrados", color: "text-blue-600" },
          { label: "Receita (Mês)", value: `R$ ${monthlyRevenue.toLocaleString('pt-BR')}`, icon: DollarSign, trend: "Este mês", color: "text-green-600" },
          { label: "Presença Média", value: `${avgAttendance}%`, icon: CheckCircle2, trend: "Global", color: "text-purple-600" },
          { label: "Pendentes", value: pendingStudentsResp.count?.toString() || "0", icon: AlertCircle, trend: "Aguardando", color: "text-orange-600" },
        ],
        growthData,
        paymentDistribution
      };
    },
  });

  const { data: recentStudents = [] } = useQuery({
    queryKey: ["recent-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return (
    <AdminLayout title="Dashboard" description="Visão estratégica da escola">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(isLoading ? Array(4).fill(null) : dashboardData?.stats).map((stat, index) => (
            <motion.div
              key={stat?.label || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {isLoading || !stat ? <Skeleton className="h-4 w-24" /> : stat.label}
                      </p>
                      <h3 className="text-2xl font-bold mt-1">
                        {isLoading || !stat ? <Skeleton className="h-8 w-16" /> : stat.value}
                      </h3 >
                      <p className="text-xs text-muted-foreground mt-1">
                        {isLoading || !stat ? <Skeleton className="h-3 w-20" /> : stat.trend}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl bg-muted/50 ${stat?.color || 'text-primary'}`}>
                      {isLoading || !stat ? (
                        <div className="h-6 w-6 animate-pulse rounded bg-muted" />
                      ) : (
                        <stat.icon className="h-6 w-6" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Enrollment Growth */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-none shadow-sm h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Crescimento de Matrículas
                </CardTitle>
                <CardDescription>Novos alunos por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData?.growthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-none shadow-sm h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Status de Pagamentos
                </CardTitle>
                <CardDescription>Distribuição de transações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full flex items-center justify-center">
                  {isLoading ? (
                    <Skeleton className="h-48 w-48 rounded-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData?.paymentDistribution}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {dashboardData?.paymentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {dashboardData?.paymentDistribution.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs capitalize">{d.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Enrollments */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-display">Matrículas Recentes</CardTitle>
                <CardDescription>Últimos 5 alunos que se cadastraram</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentStudents.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display font-semibold text-primary">
                          {enrollment.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{enrollment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {enrollment.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            enrollment.status === "ativo" ? "default" : "secondary"
                          }
                          className={
                            enrollment.status === "ativo"
                              ? "bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20"
                              : "border-none"
                          }
                        >
                          {enrollment.status === "ativo" ? "Ativa" : enrollment.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(enrollment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Metrics / Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-none shadow-sm bg-primary text-primary-foreground h-full relative overflow-hidden">
              <CardHeader>
                <CardTitle>Informativo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-90 leading-relaxed">
                  Seu dashboard estratégico está configurado para mostrar indicadores de performance em tempo real.
                </p>
                <div className="pt-4 border-t border-white/10 uppercase tracking-widest text-[10px] font-bold opacity-60">Próximos Passos</div>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Monitorar inadimplência
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Gerenciar matrículas pendentes
                  </li>
                </ul>
              </CardContent>
              <div className="absolute -bottom-6 -right-6 opacity-10">
                <TrendingUp className="h-32 w-32" />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout >
  );
}
