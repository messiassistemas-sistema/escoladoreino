import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  School,
  ClipboardList,
  UserCheck,
  CreditCard,
  Layout,
  Search,
  ChevronDown,
  Mail,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const sidebarLinks = [
  {
    group: "Visão Geral", links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/site", label: "Editor do Site", icon: Layout },
      { href: "/admin/mensagens", label: "Mensagens", icon: Mail },
    ]
  },
  {
    group: "Acadêmico", links: [
      { href: "/admin/turmas", label: "Gestão de Turmas", icon: School },
      { href: "/admin/disciplinas", label: "Disciplinas", icon: BookOpen },
      { href: "/admin/aulas", label: "Cronograma de Aulas", icon: Calendar },
      { href: "/admin/avisos", label: "Mural de Avisos", icon: Bell },
      { href: "/admin/comunicados", label: "Disparo WhatsApp", icon: MessageSquare },
    ]
  },
  {
    group: "Pessoas", links: [
      { href: "/admin/alunos", label: "Alunos", icon: Users },
      { href: "/admin/matriculas-pendentes", label: "Matrículas Pendentes", icon: UserCheck },
      { href: "/admin/professores", label: "Professores", icon: GraduationCap },
      { href: "/admin/presenca", label: "Chamada e Frequência", icon: UserCheck },
      { href: "/admin/notas", label: "Lançamento de Notas", icon: ClipboardList },
    ]
  },
  {
    group: "Recursos e Financeiro", links: [
      { href: "/admin/materiais", label: "Materiais Didáticos", icon: FileText },
      { href: "/admin/pagamentos", label: "Pagamentos", icon: CreditCard },
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
      { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
    ]
  },
  {
    group: "Suporte", links: [
      { href: "/admin/ajuda", label: "Central de Ajuda", icon: HelpCircle },
    ]
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

import { ProfileDialog } from "@/components/profile/ProfileDialog";

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: settingsService.getSettings,
  });

  useEffect(() => {
    document.title = `Escola do Reino - ${title}`;
  }, [title]);

  // Auth context
  const { user, signOut } = useAuth();

  const admin = {
    name: user?.user_metadata?.name || "Administrador",
    role: user?.user_metadata?.role || "Admin",
    avatar: user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"
  };

  return (
    <div className="flex min-h-screen bg-background/95 selection:bg-primary/10">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-md lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-sidebar-border/50",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-sidebar-border/30">
          <Link to="/admin" className="group flex items-center gap-3">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                className="h-16 w-auto max-w-[180px] object-contain transition-transform group-hover:scale-105"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary shadow-lg shadow-sidebar-primary/20 transition-transform group-hover:scale-105">
                <BookOpen className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
            )}

            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight">Escola do Reino</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-semibold">Painel Adm</span>
                <Badge variant="outline" className="h-4 px-1 text-[8px] bg-sidebar-primary/10 border-sidebar-primary/20 text-sidebar-primary leading-none">V2.0</Badge>
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground/70 hover:bg-sidebar-accent"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 px-4 py-6 overflow-y-auto custom-scrollbar">
          {sidebarLinks.map((group, i) => (
            <div key={i} className="space-y-2">
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/40">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <link.icon className={cn(
                        "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                      )} />
                      <span className="flex-1">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / User Profile */}
        <div className="mt-auto border-t border-sidebar-border/30 p-4 bg-sidebar-accent/10 backdrop-blur-md">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent/50 text-left">
                <Avatar className="h-9 w-9 border-2 border-sidebar-primary/20">
                  <AvatarImage src={admin.avatar} />
                  <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary font-bold">AD</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-sm font-semibold leading-none mb-1">{admin.name}</div>
                  <div className="truncate text-[10px] text-sidebar-foreground/50 font-bold uppercase tracking-wider">{admin.role}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-sidebar-foreground/30" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl bg-sidebar text-sidebar-foreground border-sidebar-border/30">
              <DropdownMenuItem
                className="gap-2 focus:bg-sidebar-accent focus:text-sidebar-foreground cursor-pointer"
                onClick={() => setProfileOpen(true)}
              >
                <Settings className="h-4 w-4" /> Perfil de Adm
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-sidebar-border/30" />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                onClick={async () => {
                  await signOut();
                  navigate("/login");
                }}
              >
                <LogOut className="h-4 w-4" /> Finalizar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        userName={admin.name}
        userEmail={user?.email}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/40 bg-background/60 px-6 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl border border-border/50 bg-background"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden sm:block">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h1>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary">Painel de Controle</Badge>
              </div>
              {description && (
                <p className="text-xs font-medium text-muted-foreground/80 lowercase first-letter:uppercase">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block w-72 group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Pesquisar por aluno, turma..."
                className="h-10 pl-10 pr-4 bg-background/50 border-border/50 focus:bg-background focus:ring-primary/20 transition-all rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 border-l border-border/50 pl-4 ml-2">
              <ThemeToggle />

              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20 custom-scrollbar">
          <div className="container mx-auto p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
