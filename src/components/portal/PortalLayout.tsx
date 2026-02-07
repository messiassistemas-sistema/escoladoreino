import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileText,
  Bell,
  ClipboardList,
  LogOut,
  Menu,
  X,
  User,
  Search,
  Settings,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

const sidebarLinks = [
  { href: "/portal", label: "Início", icon: LayoutDashboard },
  { href: "/portal/notas", label: "Notas e Médias", icon: ClipboardList },
  { href: "/portal/presenca", label: "Frequência", icon: Calendar },
  { href: "/portal/calendario", label: "Calendário letivo", icon: Calendar },
  { href: "/portal/materiais", label: "Materiais de Estudo", icon: FileText },
  { href: "/portal/avisos", label: "Comunicados", icon: Bell },
];

interface PortalLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function PortalLayout({ children, title, description }: PortalLayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch settings dynamically
  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: settingsService.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    document.title = `${settings?.school_name || "Escola do Reino"} - ${title}`;
  }, [title, settings]);

  // Mock user data
  const { user } = useAuth();

  // Dados do usuário real
  const userData = {
    name: user?.user_metadata?.name || user?.email?.split('@')[0] || "Aluno",
    email: user?.email || "",
    avatar: user?.user_metadata?.avatar_url || "",
    matricula: user?.user_metadata?.matricula || "...",
    turma: user?.user_metadata?.turma || "Teologia Sistemática",
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
        <div className="flex h-20 items-center justify-between px-6">
          <Link to="/" className="group flex items-center gap-3">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                className="h-10 w-auto max-w-[140px] object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary shadow-lg shadow-sidebar-primary/20 transition-transform group-hover:scale-105">
                <BookOpen className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight">{settings?.school_name || "Escola do Reino"}</span>
              <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-semibold">Portal do Aluno</span>
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

        {/* User Quick Profile */}
        <div className="px-4 py-6">
          <div className="rounded-2xl bg-sidebar-accent/30 p-4 backdrop-blur-sm border border-sidebar-border/30">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-sidebar-primary/20">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary font-bold">
                  {userData.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-semibold">{userData.name}</div>
                <div className="truncate text-[11px] text-sidebar-foreground/60 font-medium">
                  {userData.turma}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto custom-scrollbar">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Menu Principal
          </p>
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
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
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground"
                  />
                )}
              </Link>
            );
          })}

          <div className="pt-8 opacity-40">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em]">
              Suporte
            </p>
            <div className="space-y-1.5">
              <Link to="/portal/ajuda" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
                <HelpCircle className="h-5 w-5" />
                <span>Central de Ajuda</span>
              </Link>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-sidebar-border/30 p-4 bg-sidebar-accent/10 backdrop-blur-md">
          <Link to="/">
            <Button
              variant="ghost"
              className="group w-full justify-start gap-3 rounded-xl text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/0 group-hover:bg-destructive/10 transition-colors">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="font-semibold">Sair da conta</span>
            </Button>
          </Link>
        </div>
      </aside>

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
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h1>
              {description && (
                <p className="text-xs font-medium text-muted-foreground/80">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block w-72 group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar materiais, aulas..."
                className="h-10 pl-10 pr-4 bg-background/50 border-border/50 focus:bg-background focus:ring-primary/20 transition-all rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 border-l border-border/50 pl-4 ml-2">
              <ThemeToggle />

              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all overflow-hidden lg:hidden">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-border/50 backdrop-blur-xl">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Meu Perfil</DropdownMenuItem>
                  <DropdownMenuItem>Assinatura</DropdownMenuItem>
                  <DropdownMenuItem>Ajuda</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 custom-scrollbar">
          <div className="container mx-auto p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
