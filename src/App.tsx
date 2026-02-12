import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

// Public Pages
import Index from "./pages/Index";
import Sobre from "./pages/Sobre";
import Cursos from "./pages/Cursos";
import Contato from "./pages/Contato";
import Matricula from "./pages/Matricula";
import StatusMatricula from "./pages/StatusMatricula";
import NotFound from "./pages/NotFound";

// Portal Pages
import PortalDashboard from "./pages/portal/Dashboard";
import PortalNotas from "./pages/portal/Notas";
import PortalPresenca from "./pages/portal/Presenca";
import PortalCalendario from "./pages/portal/Calendario";
import PortalMateriais from "./pages/portal/Materiais";
import PortalAvisos from "./pages/portal/Avisos";
import PortalHelpCenter from "./pages/portal/HelpCenter";
import PortalPerfil from "./pages/portal/Perfil";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTurmas from "./pages/admin/Turmas";
import AdminAlunos from "./pages/admin/Alunos";
import AdminPendingStudents from "./pages/admin/PendingStudents";
import AdminProfessores from "./pages/admin/Professores";
import AdminDisciplinas from "./pages/admin/Disciplinas";
import AdminAulas from "./pages/admin/Aulas";
import AdminPresenca from "./pages/admin/Presenca";
import AdminNotas from "./pages/admin/Notas";
import AdminMateriais from "./pages/admin/Materiais";
import AdminAvisos from "./pages/admin/Avisos";
import AdminPagamentos from "./pages/admin/Pagamentos";
import AdminConfiguracoes from "./pages/admin/Configuracoes";
import AdminMensagens from "./pages/admin/AdminMensagens";
import AdminEditorSite from "./pages/admin/EditorSite";
import AdminUsuarios from "./pages/admin/Usuarios";
import AdminHelpCenter from "./pages/admin/HelpCenter";
import AdminComunicados from "./pages/admin/AdminComunicados";

// Login Page
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        // Global error handler for mutations
        console.error("Mutation error:", error);
        sonnerToast.error("Ocorreu um erro", {
          description: error.message || "Falha ao realizar operação. Tente novamente.",
        });
      },
    },
  },
});

// Theme initialization
function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return <>{children}</>;
}

import { FaviconUpdater } from "@/components/layout/FaviconUpdater";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <FaviconUpdater />
          <Toaster />
          <SonnerToaster />
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/cursos" element={<Cursos />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/matricula" element={<Matricula />} />
                <Route path="/status-matricula" element={<StatusMatricula />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected Portal Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/portal" element={<PortalDashboard />} />
                  <Route path="/portal/notas" element={<PortalNotas />} />
                  <Route path="/portal/presenca" element={<PortalPresenca />} />
                  <Route path="/portal/calendario" element={<PortalCalendario />} />
                  <Route path="/portal/materiais" element={<PortalMateriais />} />
                  <Route path="/portal/avisos" element={<PortalAvisos />} />
                  <Route path="/portal/ajuda" element={<PortalHelpCenter />} />
                  <Route path="/portal/perfil" element={<PortalPerfil />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'secretary', 'treasurer', 'teacher']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/turmas" element={<AdminTurmas />} />
                  <Route path="/admin/alunos" element={<AdminAlunos />} />
                  <Route path="/admin/matriculas-pendentes" element={<AdminPendingStudents />} />
                  <Route path="/admin/professores" element={<AdminProfessores />} />
                  <Route path="/admin/disciplinas" element={<AdminDisciplinas />} />
                  <Route path="/admin/aulas" element={<AdminAulas />} />
                  <Route path="/admin/presenca" element={<AdminPresenca />} />
                  <Route path="/admin/notas" element={<AdminNotas />} />
                  <Route path="/admin/materiais" element={<AdminMateriais />} />
                  <Route path="/admin/avisos" element={<AdminAvisos />} />
                  <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
                  <Route path="/admin/ajuda" element={<AdminHelpCenter />} />
                  {/* STRICT ADMIN ONLY ROUTES */}
                  <Route element={<ProtectedRoute adminOnly />}>
                    <Route path="/admin/site" element={<AdminEditorSite />} />
                    <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                    <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
                  </Route>

                  <Route path="/admin/mensagens" element={<AdminMensagens />} />
                  <Route path="/admin/comunicados" element={<AdminComunicados />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
