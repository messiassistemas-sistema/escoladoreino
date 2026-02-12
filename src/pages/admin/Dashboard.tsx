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
  PieChart as PieChartIcon,
  Activity,
  UserMinus,
  UserCheck
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardQuickActions } from "@/components/admin/dashboard/DashboardQuickActions";
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
  AreaChart,
  Area
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"];
const RETENTION_COLORS = ["#3b82f6", "#10b981", "#ef4444"];

export default function AdminDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["admin-stats-v3"],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        studentsResp,
        teachersResp,
        subjectsResp,
        pendingStudentsResp,
        paymentsResp,
        attendanceRateResp, // Individual student rates
        monthlyGrowthResp,
        attendanceTrendgResp, // Records for the 7-day trend
        settingsResp,
        lessonsResp,
        attendanceCountResp,
        currentMonthNewStudentsResp
      ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("payments").select("amount, status, created_at").gte("created_at", firstDayOfMonth),
        supabase.from("students").select("attendance_rate"),
        supabase.from("students").select("created_at"),
        supabase.from("attendance_records")
          .select("created_at, status")
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("system_settings").select("enrollment_value").single(),
        supabase.from("lessons").select("*", { count: "exact", head: true }).gte("date", thirtyDaysAgo.toISOString().split('T')[0]),
        supabase.from("attendance_records").select("*", { count: "exact", head: true }).eq("status", "present").gte("created_at", thirtyDaysAgo.toISOString()),
        supabase.from("students").select("*", { count: "exact", head: true }).gte("created_at", firstDayOfMonth)
      ]);

      const totalLessonsCount = lessonsResp.count || 0;
      const totalPresenceCount = attendanceCountResp.count || 0;

      // --- Financials ---
      const monthlyRevenue = (paymentsResp.data || [])
        .filter(p => p.status === "pago" || p.status === "approved" || p.status === "paid" || p.status === "completed")
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const pendingRevenue = (paymentsResp.data || [])
        .filter(p => p.status === "pendente" || p.status === "pending" || p.status === "waiting")
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const allStudents = studentsResp.count || 0;
      const { data: allStudentStatuses } = await supabase.from("students").select("status");

      const activeStudentsCount = (allStudentStatuses || []).filter(s => s.status === 'ativo').length;
      const inactiveStudentsCount = (allStudentStatuses || []).filter(s => s.status === 'inativo' || s.status === 'cancelado').length;
      const pendingCount = (allStudentStatuses || []).filter(s => s.status === 'pendente').length;

      const estTuition = settingsResp.data?.enrollment_value || 100;
      const expectedRevenue = activeStudentsCount * estTuition;

      const defaultRate = expectedRevenue > 0
        ? Math.max(0, ((expectedRevenue - monthlyRevenue) / expectedRevenue) * 100).toFixed(1)
        : "0";

      // --- Attendance (Last 30 Days) ---
      // We calculate global attendance as: (Present Records) / (Active Students * Lessons Created) in the last 30 days
      const academicPotential = activeStudentsCount * totalLessonsCount;
      const avgAttendance = academicPotential > 0
        ? Math.min(100, (totalPresenceCount / academicPotential) * 100).toFixed(1)
        : "0";

      // Attendance Trend (Daily Present Count)
      const trendMap: Record<string, number> = {};
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        dates.push(key);
        trendMap[key] = 0; // init
      }

      (attendanceTrendgResp.data || []).forEach(record => {
        if (record.status === 'present') {
          const d = new Date(record.created_at || new Date());
          const key = d.toLocaleDateString('pt-BR', { weekday: 'short' });
          if (trendMap[key] !== undefined) trendMap[key]++;
        }
      });
      const attendanceTrendData = dates.map(d => ({ name: d, present: trendMap[d] }));


      // --- Retention Funnel Data ---
      const retentionData = [
        { name: "Total", value: allStudents, fill: "#3b82f6" }, // Blue
        { name: "Ativos", value: activeStudentsCount, fill: "#10b981" }, // Green
        { name: "Inativos", value: inactiveStudentsCount, fill: "#ef4444" }, // Red
      ];

      // --- Payment Distribution ---
      const paymentStatusMap: Record<string, number> = {};
      (paymentsResp.data || []).forEach(p => {
        const status = p.status === "approved" || p.status === "paid" ? "pago" : (p.status || "pendente");
        paymentStatusMap[status] = (paymentStatusMap[status] || 0) + 1;
      });
      const paymentDistribution = Object.entries(paymentStatusMap).map(([name, value]) => ({ name, value }));

      // --- Growth Fix: Rolling 6 months ---
      const monthsLong = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const growthData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${monthsLong[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;

        const count = (monthlyGrowthResp.data || []).filter(s => {
          const sDate = new Date(s.created_at!);
          return sDate.getMonth() === d.getMonth() && sDate.getFullYear() === d.getFullYear();
        }).length;

        growthData.push({ name: label, total: count });
      }

      return {
        stats: [
          { label: "Total de Alunos", value: studentsResp.count?.toString() || "0", icon: Users, trend: "Cadastrados", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
          { label: "Receita (Mês)", value: `R$ ${monthlyRevenue.toLocaleString('pt-BR')}`, icon: DollarSign, trend: "Realizado", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
          { label: "Novas Matrículas", value: currentMonthNewStudentsResp.count?.toString() || "0", icon: TrendingUp, trend: "Este mês", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/20" },
          { label: "Frequência Real", value: `${avgAttendance}%`, icon: Activity, trend: "Últimos 30 dias", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" },
        ],
        growthData,
        paymentDistribution,
        financials: {
          expected: expectedRevenue,
          realized: monthlyRevenue,
          pending: pendingRevenue,
          activeCount: activeStudentsCount,
          gap: Math.max(0, expectedRevenue - monthlyRevenue)
        },
        academic: {
          trend: attendanceTrendData,
          retention: retentionData
        }
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

        {/* Charts Row 1: Financials & Payments */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Financial Breakdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="col-span-1 md:col-span-2"
          >
            <Card className="border-none shadow-sm h-full min-h-[300px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Saúde Financeira (Estimada)
                </CardTitle>
                <CardDescription>Receita Realizada vs. Potencial Esperado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full mt-4">
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-center">
                      {/* Visual Bar */}
                      <div className="col-span-2 space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Progresso de Recebimento</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {((dashboardData?.financials?.realized / dashboardData?.financials?.expected) * 100 || 0).toFixed(1)}% Realizado
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                              style={{ width: `${Math.min(100, (dashboardData?.financials?.realized / dashboardData?.financials?.expected) * 100 || 0)}%` }}
                              title="Realizado"
                            />
                            <div
                              className="h-full bg-blue-400 transition-all duration-1000 ease-out"
                              style={{ width: `${Math.min(100, (dashboardData?.financials?.pending / dashboardData?.financials?.expected) * 100 || 0)}%` }}
                              title="Pendente"
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                            <span>0</span>
                            <span>Meta: R$ {dashboardData?.financials?.expected?.toLocaleString('pt-BR') || '0,00'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold uppercase">Pago</p>
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              R$ {dashboardData?.financials?.realized.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                            <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-bold uppercase">Pendente</p>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              R$ {dashboardData?.financials?.pending.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50">
                            <p className="text-[10px] text-red-600/80 dark:text-red-400/80 font-bold uppercase">Gap</p>
                            <p className="text-sm font-bold text-red-600 dark:text-red-400">
                              R$ {dashboardData?.financials?.gap.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Insight Card */}
                      <div className="hidden md:flex flex-col justify-center items-center text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <DollarSign className="h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          Receita potencial de <span className="text-primary font-bold">R$ {dashboardData?.financials?.expected.toLocaleString('pt-BR')}</span> baseada em {dashboardData?.financials?.activeCount} alunos ativos.
                        </p>
                        <Button variant="link" size="sm" className="mt-2 text-primary h-auto p-0 text-xs">Acessar Financeiro</Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Status Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-none shadow-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Status de Pagamentos
                </CardTitle>
                <CardDescription>Distribuição de transações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full flex items-center justify-center">
                  {isLoading ? (
                    <Skeleton className="h-48 w-48 rounded-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData?.paymentDistribution}
                          innerRadius={50}
                          outerRadius={70}
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

        {/* Charts Row 2: Business Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Enrollment Growth */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-none shadow-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Crescimento
                </CardTitle>
                <CardDescription>Novos alunos (6 meses)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData?.growthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} width={20} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* New Academic Pulse - Attendance Trend */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-none shadow-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Frequência (7 Dias)
                </CardTitle>
                <CardDescription>Alunos presentes por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardData?.academic?.trend}>
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} width={20} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="present" stroke="#8884d8" fillOpacity={1} fill="url(#colorPresent)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* New Academic Pulse - Retention Funnel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-none shadow-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Retenção de Alunos
                </CardTitle>
                <CardDescription>Panorama de Ativos vs. Inativos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={dashboardData?.academic?.retention}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" fontSize={10} hide />
                        <YAxis dataKey="name" type="category" width={60} fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                          {dashboardData?.academic?.retention.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row - Recent & Quick Facts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Enrollments moved to bottom 2-col layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-none shadow-sm h-full">
              <CardHeader>
                <CardTitle className="font-display">Matrículas Recentes</CardTitle>
                <CardDescription>Últimos 5 alunos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentStudents.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-display font-semibold text-primary text-xs">
                          {enrollment.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[100px]">{enrollment.name.split(' ')[0]}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                            {enrollment.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={enrollment.status === "ativo" ? "default" : "secondary"}
                        className="text-[10px] h-5"
                      >
                        {enrollment.status === "ativo" ? "Ativa" : enrollment.status}
                      </Badge>
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
                  Painel Pedagógico ativado. Monitore a frequência semanal para evitar evasão.
                </p>
                <div className="pt-4 border-t border-white/10 uppercase tracking-widest text-[10px] font-bold opacity-60">Ações Sugeridas</div>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Cobrar inadimplentes ({dashboardData?.stats[2]?.value || '0%'})
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    Verificar baixas frequências (Heatmap)
                  </li>
                  <li className="flex items-center gap-2">
                    <UserMinus className="h-3 w-3" />
                    Contatar inativos ({dashboardData?.academic?.retention[2]?.value || 0})
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
      <DashboardQuickActions />
    </AdminLayout>
  );
}
