import { motion } from "framer-motion";
import {
    Search,
    HelpCircle,
    Video,
    FileText,
    ChevronRight,
    ExternalLink,
    PlayCircle
} from "lucide-react";
import { useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { helpCenterService } from "@/services/helpCenterService";
import { cn } from "@/lib/utils";

export default function PortalHelpCenter() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: items = [], isLoading } = useQuery({
        queryKey: ["help-center-items"],
        queryFn: helpCenterService.getItems,
    });

    const filteredItems = items.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper to extract YouTube ID
    const getYoutubeEmbedUrl = (url: string) => {
        try {
            if (!url) return null;
            let videoId = "";

            // Handle various YouTube URL formats
            if (url.includes("youtube.com/shorts/")) {
                videoId = url.split("youtube.com/shorts/")[1].split("?")[0];
            } else if (url.includes("youtube.com/watch?v=")) {
                videoId = url.split("v=")[1].split("&")[0];
            } else if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1].split("?")[0];
            }

            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        } catch (e) {
            console.error("Error parsing YouTube URL:", e);
            return null;
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <PortalLayout title="Central de Ajuda" description="Tutoriais e suporte para seus estudos">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
            >
                {/* Search Header */}
                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-primary px-8 py-12 text-primary-foreground shadow-2xl shadow-primary/20 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-violet-800 opacity-90" />
                    <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                        <div className="space-y-2">
                            <Badge variant="secondary" className="bg-white/20 text-white border-none mb-2">SUPORTE AO ALUNO</Badge>
                            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Como podemos ajudar?</h2>
                            <p className="text-primary-foreground/80 font-medium text-lg">
                                Encontre respostas, tutoriais e vídeos explicativos.
                            </p>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar por dúvidas, tutoriais..."
                                className="h-14 pl-12 rounded-2xl bg-white/95 text-foreground shadow-xl border-0 text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Content Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h3 className="font-display text-2xl font-bold">Base de Conhecimento</h3>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 w-full rounded-xl bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <Card className="border-dashed border-2 bg-muted/30">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <HelpCircle className="h-12 w-12 mb-4 opacity-20" />
                                    <p>Nenhum artigo encontrado para sua busca.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredItems.map((item) => {
                                    const embedUrl = getYoutubeEmbedUrl(item.video_url || "");

                                    return (
                                        <Card key={item.id} className="overflow-hidden border-none shadow-soft hover:shadow-elevated transition-all duration-300">
                                            <CardHeader className="pb-3 bg-muted/20">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "flex h-10 w-10 items-center justify-center rounded-xl",
                                                            item.video_url ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                                        )}>
                                                            {item.video_url ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                                                            <CardDescription>
                                                                {item.video_url ? 'Vídeo Tutorial' : 'Artigo de Ajuda'}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                {item.video_url ? (
                                                    <div className="space-y-4 p-6">
                                                        {embedUrl ? (
                                                            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner">
                                                                <iframe
                                                                    width="100%"
                                                                    height="100%"
                                                                    src={embedUrl}
                                                                    title={item.title}
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                    className="border-0"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-muted p-8 rounded-xl flex flex-col items-center justify-center text-center gap-2">
                                                                <Video className="h-10 w-10 text-muted-foreground opacity-50" />
                                                                <p className="text-sm text-muted-foreground font-medium">Visualização prévia indisponível</p>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col gap-3">
                                                            {item.content && (
                                                                <div className="bg-muted/30 p-4 rounded-xl text-sm text-muted-foreground border border-border/50 whitespace-pre-wrap">
                                                                    {item.content}
                                                                </div>
                                                            )}

                                                            <Button asChild variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                                                                <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink className="h-4 w-4" />
                                                                    Assistir no YouTube
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-6 pt-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                        {item.content}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* Sidebar Info */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <Card className="border-none shadow-soft bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <HelpCircle className="h-5 w-5 text-primary" />
                                    Precisa de mais ajuda?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Se não encontrou o que procurava, entre em contato com nossa equipe de suporte ou fale com seu tutor.
                                </p>
                                <Button className="w-full gap-2 font-bold shadow-lg shadow-primary/20" size="lg">
                                    Falar com Suporte
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-soft">
                            <CardHeader>
                                <CardTitle className="text-lg">Dicas Rápidas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    "Mantenha seu navegador atualizado para melhor experiência.",
                                    "Verifique sua conexão se os vídeos não carregarem.",
                                    "Limpe o cache se encontrar erros de login."
                                ].map((tip, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-muted-foreground">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <p>{tip}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </PortalLayout>
    );
}
