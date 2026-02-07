import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BookOpen, GraduationCap, Shield, ChevronDown, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre a Escola" },
  { href: "/cursos", label: "Nossos Cursos" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isAdmin, user, signOut } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: settingsService.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border/40 bg-background/70 backdrop-blur-xl py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3 transition-all">
          <div className="relative">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                className="h-12 w-auto max-w-[120px] object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-primary to-primary/50 opacity-0 blur transition group-hover:opacity-30" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold leading-tight tracking-tight text-foreground">
              {settings?.school_name || "Escola do Reino"}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
              Formação Teológica
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-semibold transition-all hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <ThemeToggle />
          </div>

          <div className="hidden items-center gap-3 md:flex border-l border-border/50 pl-4">
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="gap-2 font-semibold hover:bg-primary/5 hover:text-primary transition-all">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
            <Link to="/portal">
              <Button variant="ghost" size="sm" className="gap-2 font-semibold hover:bg-primary/5 hover:text-primary transition-all">
                <GraduationCap className="h-4 w-4" />
                Portal
              </Button>
            </Link>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-2 font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="gap-2 font-semibold hover:bg-primary/5 hover:text-primary transition-all">
                  <User className="h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            )}

            <Link to="/cursos">
              <Button size="sm" className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95">
                Matricular-se
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl bg-muted/50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 right-0 top-full border-b border-border bg-background/95 p-4 backdrop-blur-xl md:hidden shadow-2xl"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-4 text-sm font-bold transition-all active:scale-[0.98]",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                  <ChevronDown className="-rotate-90 h-4 w-4 opacity-50" />
                </Link>
              ))}

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-6">
                <Link to="/portal" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-border/50 font-bold gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Portal
                  </Button>
                </Link>
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-border/50 font-bold gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
                <Link to="/cursos" onClick={() => setIsMobileMenuOpen(false)} className="col-span-2">
                  <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                    Matricular-se Agora
                  </Button>
                </Link>
                {user && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="col-span-2 h-12 rounded-xl font-bold text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair da Conta
                  </Button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
