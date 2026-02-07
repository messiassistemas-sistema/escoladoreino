import { Link } from "react-router-dom";
import { BookOpen, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { landingService } from "@/services/landingService";
import { settingsService } from "@/services/settingsService";

export function Footer() {
  const { data: landingContent } = useQuery({
    queryKey: ["landing-content"],
    queryFn: landingService.getContent,
  });

  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: settingsService.getSettings,
  });

  const socialLinks = landingContent || {
    social_facebook: "#",
    social_instagram: "#",
    social_youtube: "#"
  };

  const contactInfo = {
    contact_email: settings?.contact_email || "contato@escoladoreino.com.br",
    contact_phone: settings?.contact_phone || "(11) 99999-9999",
    address: settings?.address || "Rua da Esperança, 123, Centro, Cidade - UF"
  };
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-semibold">Escola do Reino</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Formação teológica de excelência para edificação do Corpo de Cristo.
            </p>
            <div className="flex gap-3">
              <a
                href={socialLinks.social_facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={socialLinks.social_instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={socialLinks.social_youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>

          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-muted-foreground transition-colors hover:text-foreground">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/cursos" className="text-muted-foreground transition-colors hover:text-foreground">
                  Cursos
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Portal */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold">Portal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/portal" className="text-muted-foreground transition-colors hover:text-foreground">
                  Área do Aluno
                </Link>
              </li>
              <li>
                <Link to="/matricula" className="text-muted-foreground transition-colors hover:text-foreground">
                  Matricular-se
                </Link>
              </li>
              <li>
                <Link to="/status-matricula" className="text-muted-foreground transition-colors hover:text-foreground">
                  Status da Matrícula
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{contactInfo.address}</span>
              </li>
              <li>
                <a
                  href={`tel:${contactInfo.contact_phone}`}
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="h-4 w-4" />
                  {contactInfo.contact_phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contactInfo.contact_email}`}
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  {contactInfo.contact_email}
                </a>
              </li>

            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-center text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Escola do Reino. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link to="/privacidade" className="hover:text-foreground">
              Política de Privacidade
            </Link>
            <Link to="/termos" className="hover:text-foreground">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
