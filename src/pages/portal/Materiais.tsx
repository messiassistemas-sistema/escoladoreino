import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  FileText,
  Video,
  Presentation,
  Search,
  Filter,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { materialsService } from "@/services/materialsService";
import { subjectsService } from "@/services/subjectsService";

const getIconByType = (tipo: string) => {
  switch (tipo) {
    case "pdf":
      return <FileText className="h-5 w-5" />;
    case "pptx":
      return <Presentation className="h-5 w-5" />;
    case "video":
      return <Video className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const getBadgeByType = (tipo: string) => {
  switch (tipo) {
    case "pdf":
      return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] uppercase font-bold px-1.5 h-4">PDF</Badge>;
    case "pptx":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase font-bold px-1.5 h-4">Slides</Badge>;
    case "video":
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold px-1.5 h-4">Vídeo</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 h-4">Arquivo</Badge>;
  }
};

export default function PortalMateriais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDisciplina, setSelectedDisciplina] = useState("Todas");

  const { data: materiais = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: ["materials"],
    queryFn: materialsService.getMaterials,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsService.getSubjects,
  });

  const filteredMateriais = materiais.filter((material: any) => {
    const matchesSearch = material.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDisciplina =
      selectedDisciplina === "Todas" || material.subject_name === selectedDisciplina;
    return matchesSearch && matchesDisciplina;
  });

  const handleDownload = async (material: any) => {
    try {
      await materialsService.incrementDownloads(material.id);
      window.open(material.file_url, '_blank');
    } catch (error) {
      console.error("Erro ao incrementar downloads:", error);
      // Fallback: abre o arquivo mesmo em caso de erro no contador
      window.open(material.file_url, '_blank');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <PortalLayout title="Repositório de Materiais" description="Acesse todo o conteúdo didático, bibliografias e gravações do seu curso.">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Search and Filters Banner */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-soft bg-background/60 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Pesquisar por apostila, slide ou tema..."
                    className="h-12 pl-12 pr-4 bg-muted/30 border-none rounded-2xl focus:bg-muted/50 focus:ring-primary/20 transition-all font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Select
                    value={selectedDisciplina}
                    onValueChange={setSelectedDisciplina}
                  >
                    <SelectTrigger className="w-full sm:w-72 h-12 bg-muted/30 border-none rounded-2xl font-bold text-xs ring-offset-background focus:ring-primary/20">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-primary" />
                        <SelectValue placeholder="Filtrar disciplina" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl">
                      <SelectItem value="Todas" className="rounded-xl focus:bg-primary/10 font-bold">Todas as Disciplinas</SelectItem>
                      {subjects.map((disc: any) => (
                        <SelectItem key={disc.id} value={disc.name} className="rounded-xl focus:bg-primary/10">
                          {disc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                    Filtrar Recursos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Featured / Info Section */}
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 p-8 text-white shadow-xl relative overflow-hidden group">
            <BookOpen className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            <h3 className="font-display text-2xl font-black mb-2 leading-tight">Biblioteca Virtual</h3>
            <p className="text-white/70 text-sm font-medium mb-6 max-w-sm">Acesse mais de 5.000 títulos selecionados para aprofundar seu conhecimento teológico.</p>
            <Button size="sm" className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl gap-2 h-10 px-6">
              Acessar Plataforma <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-[2rem] bg-background border border-border/50 p-8 shadow-soft flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-12 bg-primary rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Dica de Estudo</span>
            </div>
            <h4 className="font-display text-xl font-bold mb-2">Organize seu Semestre</h4>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">Baixe as apostilas base no início de cada módulo para acompanhar as referências citadas em aula.</p>
          </div>
        </motion.div>

        {/* Materials Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display text-2xl font-bold">Arquivos Disponíveis</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Exibindo {filteredMateriais.length} materiais</p>
          </div>

          {isLoadingMaterials ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredMateriais.map((material: any) => (
                  <motion.div
                    key={material.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="group h-full border-none shadow-soft transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 overflow-hidden">
                      <CardContent className="flex h-full flex-col p-6">
                        <div className="mb-6 flex items-start justify-between">
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 transition-colors group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20",
                            material.type === 'video' && "text-primary bg-primary/10"
                          )}>
                            {getIconByType(material.type)}
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {getBadgeByType(material.type)}
                          </div>
                        </div>

                        <div className="mb-4 flex-1 space-y-2">
                          <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors">{material.title}</h3>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{material.subject_name}</p>
                            <p className="text-[10px] font-medium text-muted-foreground/70">
                              Por: {material.author_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/50 pt-5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{material.file_size || "Link"}</span>
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                              {new Date(material.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 px-5 rounded-xl border-border/50 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all gap-2 font-bold text-xs"
                            onClick={() => handleDownload(material)}
                          >
                            <Download className="h-4 w-4" /> {material.type === 'video' ? 'Ver' : 'Baixar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!isLoadingMaterials && filteredMateriais.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center rounded-[2.5rem] border-2 border-dashed border-border/50 bg-muted/20"
            >
              <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="mb-2 font-display text-2xl font-bold tracking-tight">Recurso não localizado</h3>
              <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto">
                Não encontramos arquivos que correspondam à sua busca ou filtro atual.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </PortalLayout>
  );
}
