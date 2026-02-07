import { motion } from "framer-motion";
import { Bell, Pin, CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { announcementsService } from "@/services/announcementsService";

const getBadgeByTipo = (tipo: string) => {
  switch (tipo) {
    case "urgente":
      return <Badge variant="destructive">Urgente</Badge>;
    case "evento":
      return <Badge className="bg-secondary text-secondary-foreground">Evento</Badge>;
    default:
      return <Badge variant="secondary">Informativo</Badge>;
  }
};

export default function PortalAvisos() {
  const { data: avisos = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: announcementsService.getAnnouncements
  });

  // Note: 'lido' status requires a separate user_announcements table which is not implemented yet.
  // For now, simpler implementation without 'lido' state persistence per user.
  const naoLidos = 0; // Placeholder

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  if (isLoading) {
    return (
      <PortalLayout title="Avisos (Atualizado)" description="Carregando novidades...">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout title="Avisos (Atualizado)" description="Fique por dentro das novidades">
      <div className="space-y-6">
        {/* Summary */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
              Total: {avisos.length}
            </Badge>
          </div>
        </motion.div>

        {/* Avisos List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {avisos.length === 0 ? (
            <Card className="border-dashed border-2 shadow-none bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/50 mb-4" />
                <h4 className="font-bold text-lg text-muted-foreground">Nenhum aviso encontrado</h4>
              </CardContent>
            </Card>
          ) : (
            avisos.map((aviso: any) => (
              <motion.div
                key={aviso.id}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { y: 0, opacity: 1 }
                }}
              >
                <Card
                  className={cn(
                    "shadow-soft transition-all hover:shadow-card",
                    aviso.pinned && "border-l-4 border-l-secondary bg-secondary/5"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            aviso.type === "urgente"
                              ? "bg-destructive/10"
                              : aviso.type === "evento"
                                ? "bg-secondary/20"
                                : "bg-primary/10"
                          )}
                        >
                          <Bell
                            className={cn(
                              "h-5 w-5",
                              aviso.type === "urgente"
                                ? "text-destructive"
                                : aviso.type === "evento"
                                  ? "text-secondary"
                                  : "text-primary"
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h3 className="font-display font-semibold text-primary">
                              {aviso.title}
                            </h3>
                            {getBadgeByTipo(aviso.type)}
                            {aviso.pinned && (
                              <Pin className="h-4 w-4 text-secondary" />
                            )}
                          </div>
                          <p className="mb-3 text-sm text-muted-foreground">
                            {aviso.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{aviso.author_name}</span>
                            <span>•</span>
                            <span>
                              {new Date(aviso.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {aviso.audience}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )))}
        </motion.div>
      </div>
    </PortalLayout>
  );
}
