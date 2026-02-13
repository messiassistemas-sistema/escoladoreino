import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Layout, MessageSquare, CreditCard, CheckCircle2, Plus, Trash2, Share2, Info, BookOpen, ArrowUp, ArrowDown } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { landingService, LandingPageContent } from "@/services/landingService";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, Zap, Target, ChefHat, Eye, X, GripVertical, ChevronRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function AdminEditorSite() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<LandingPageContent>>({});
    const [selectedCourseIndex, setSelectedCourseIndex] = useState<number | null>(null);

    const { data: content, isLoading } = useQuery({
        queryKey: ["landing-content"],
        queryFn: landingService.getContent,
    });

    useEffect(() => {
        if (content) {
            setFormData(content);
        }
    }, [content]);

    const mutation = useMutation({
        mutationFn: (newContent: Partial<LandingPageContent>) =>
            landingService.updateContent(newContent),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["landing-content"] });
            toast({
                title: "Site atualizado!",
                description: "As alterações foram publicadas com sucesso.",
            });
        },
        onError: (error) => {
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível atualizar o conteúdo.",
                variant: "destructive",
            });
            console.error(error);
        },
    });

    const handleSave = () => {
        mutation.mutate(formData);
    };

    const handleChange = (field: keyof LandingPageContent, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleBenefitChange = (index: number, value: string) => {
        const newBenefits = [...(formData.benefits || [])];
        newBenefits[index] = value;
        handleChange("benefits", newBenefits);
    };

    const addBenefit = () => {
        handleChange("benefits", [...(formData.benefits || []), ""]);
    };

    const removeBenefit = (index: number) => {
        const newBenefits = (formData.benefits || []).filter((_, i) => i !== index);
        handleChange("benefits", newBenefits);
    };

    if (isLoading) {
        return (
            <AdminLayout title="Editar Site" description="Carregando editor...">
                <div className="space-y-6">
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Editar Site" description="Personalize o conteúdo da página inicial">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Tabs defaultValue="hero" className="w-full">
                        <div className="flex items-center justify-between border-b pb-4">
                            <TabsList>
                                <TabsTrigger value="hero" className="gap-2">
                                    <Layout className="h-4 w-4" />
                                    Hero (Início)
                                </TabsTrigger>
                                <TabsTrigger value="cta" className="gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Chamada (CTA)
                                </TabsTrigger>
                                <TabsTrigger value="courses_list" className="gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Lista de Cursos
                                </TabsTrigger>
                                <TabsTrigger value="pricing" className="gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Preços
                                </TabsTrigger>
                                <TabsTrigger value="course" className="gap-2">
                                    <Info className="h-4 w-4" />
                                    Detalhes & Redes
                                </TabsTrigger>
                            </TabsList>
                            <Button onClick={handleSave} disabled={mutation.isPending} className="gap-2">
                                <Save className="h-4 w-4" />
                                {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </div>

                        {/* Courses List Section */}
                        <TabsContent value="courses_list" className="mt-6">
                            <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
                                {/* Master Panel: Course Selection List */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="w-full lg:w-80 shrink-0 space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg">Cursos</h3>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                const newCourse = {
                                                    title: "Novo Curso",
                                                    description: "Descrição do curso...",
                                                    duration: "1 ano",
                                                    level: "Básico",
                                                    features: ["Matéria 1"]
                                                };
                                                const newCourses = [...(formData.courses_data || []), newCourse];
                                                handleChange("courses_data", newCourses);
                                                setSelectedCourseIndex(newCourses.length - 1);
                                            }}
                                            className="h-8 gap-1 text-xs"
                                        >
                                            <Plus className="h-3 w-3" /> Novo
                                        </Button>
                                    </div>

                                    <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {(formData.courses_data || []).length === 0 ? (
                                            <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground text-sm">
                                                Nenhum curso cadastrado.
                                            </div>
                                        ) : (
                                            formData.courses_data?.map((course, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => setSelectedCourseIndex(index)}
                                                    className={cn(
                                                        "group relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                                                        selectedCourseIndex === index
                                                            ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                                                            : "border-transparent hover:border-border hover:bg-muted/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-xs",
                                                        selectedCourseIndex === index ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={cn(
                                                            "text-sm font-bold truncate",
                                                            selectedCourseIndex === index ? "text-primary" : "text-foreground"
                                                        )}>
                                                            {course.title || "Sem título"}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className={cn(
                                                                "h-1.5 w-1.5 rounded-full",
                                                                course.available !== false ? "bg-emerald-500" : "bg-muted-foreground/30"
                                                            )} />
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                                                {course.available !== false ? "Matrículas Abertas" : "Fechado"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={cn(
                                                        "h-4 w-4 transition-transform",
                                                        selectedCourseIndex === index ? "text-primary translate-x-1" : "text-muted-foreground/0 group-hover:text-muted-foreground/50"
                                                    )} />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>

                                {/* Detail Panel: Course Editor */}
                                <div className="flex-1 min-w-0">
                                    <AnimatePresence mode="wait">
                                        {selectedCourseIndex !== null && formData.courses_data?.[selectedCourseIndex] ? (
                                            <motion.div
                                                key={selectedCourseIndex}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="space-y-6"
                                            >
                                                <Card className="border-none shadow-elevated overflow-hidden">
                                                    <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between space-y-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-primary/10 text-primary h-10 w-10 rounded-xl flex items-center justify-center font-black">
                                                                {(selectedCourseIndex + 1).toString().padStart(2, '0')}
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-xl font-black">Editar Curso</CardTitle>
                                                                <CardDescription className="text-xs">Configurações detalhadas do módulo</CardDescription>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1 border rounded-lg p-1 bg-background/50">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    disabled={selectedCourseIndex === 0}
                                                                    onClick={() => {
                                                                        const newCourses = [...(formData.courses_data || [])];
                                                                        const temp = newCourses[selectedCourseIndex - 1];
                                                                        newCourses[selectedCourseIndex - 1] = newCourses[selectedCourseIndex];
                                                                        newCourses[selectedCourseIndex] = temp;
                                                                        handleChange("courses_data", newCourses);
                                                                        setSelectedCourseIndex(selectedCourseIndex - 1);
                                                                    }}
                                                                >
                                                                    <ArrowUp className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    disabled={selectedCourseIndex === (formData.courses_data?.length || 0) - 1}
                                                                    onClick={() => {
                                                                        const newCourses = [...(formData.courses_data || [])];
                                                                        const temp = newCourses[selectedCourseIndex + 1];
                                                                        newCourses[selectedCourseIndex + 1] = newCourses[selectedCourseIndex];
                                                                        newCourses[selectedCourseIndex] = temp;
                                                                        handleChange("courses_data", newCourses);
                                                                        setSelectedCourseIndex(selectedCourseIndex + 1);
                                                                    }}
                                                                >
                                                                    <ArrowDown className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    const newCourses = (formData.courses_data || []).filter((_, i) => i !== selectedCourseIndex);
                                                                    handleChange("courses_data", newCourses);
                                                                    setSelectedCourseIndex(null);
                                                                }}
                                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setSelectedCourseIndex(null)}
                                                                className="h-8 w-8"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-6 space-y-8">
                                                        <div className="grid gap-6 md:grid-cols-2">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Nome do Curso</Label>
                                                                <Input
                                                                    value={formData.courses_data[selectedCourseIndex].title}
                                                                    className="font-bold border-2 focus-visible:ring-primary/20"
                                                                    onChange={(e) => {
                                                                        const newCourses = [...(formData.courses_data || [])];
                                                                        newCourses[selectedCourseIndex].title = e.target.value;
                                                                        handleChange("courses_data", newCourses);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Nível</Label>
                                                                <Input
                                                                    value={formData.courses_data[selectedCourseIndex].level}
                                                                    className="font-bold border-2 focus-visible:ring-primary/20"
                                                                    onChange={(e) => {
                                                                        const newCourses = [...(formData.courses_data || [])];
                                                                        newCourses[selectedCourseIndex].level = e.target.value;
                                                                        handleChange("courses_data", newCourses);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Descrição Curta</Label>
                                                            <Textarea
                                                                rows={3}
                                                                value={formData.courses_data[selectedCourseIndex].description}
                                                                className="font-medium border-2 focus-visible:ring-primary/20 resize-none"
                                                                onChange={(e) => {
                                                                    const newCourses = [...(formData.courses_data || [])];
                                                                    newCourses[selectedCourseIndex].description = e.target.value;
                                                                    handleChange("courses_data", newCourses);
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="grid gap-6 md:grid-cols-3">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Duração</Label>
                                                                <Input
                                                                    value={formData.courses_data[selectedCourseIndex].duration}
                                                                    className="font-bold border-2 focus-visible:ring-primary/20"
                                                                    onChange={(e) => {
                                                                        const newCourses = [...(formData.courses_data || [])];
                                                                        newCourses[selectedCourseIndex].duration = e.target.value;
                                                                        handleChange("courses_data", newCourses);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Investimento (R$)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={formData.courses_data[selectedCourseIndex].price || ""}
                                                                    className="font-bold border-2 focus-visible:ring-primary/20"
                                                                    onChange={(e) => {
                                                                        const newCourses = [...(formData.courses_data || [])];
                                                                        newCourses[selectedCourseIndex].price = Number(e.target.value);
                                                                        handleChange("courses_data", newCourses);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col justify-end">
                                                                <div className="flex items-center space-x-2 py-2">
                                                                    <Switch
                                                                        id="course-available"
                                                                        checked={formData.courses_data[selectedCourseIndex].available !== false}
                                                                        onCheckedChange={(checked) => {
                                                                            const newCourses = [...(formData.courses_data || [])];
                                                                            newCourses[selectedCourseIndex].available = checked;
                                                                            handleChange("courses_data", newCourses);
                                                                        }}
                                                                    />
                                                                    <Label htmlFor="course-available" className="font-bold cursor-pointer">Matrículas Abertas</Label>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 pt-4 border-t">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Target className="h-4 w-4 text-primary" />
                                                                <Label className="text-xs font-black uppercase tracking-wider text-primary">Sequência Pedagógica</Label>
                                                            </div>
                                                            <div className="grid gap-6 md:grid-cols-2 items-end">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Próximo Curso Sugerido</Label>
                                                                    <Select
                                                                        value={formData.courses_data[selectedCourseIndex].next_course_id || "none"}
                                                                        onValueChange={(value) => {
                                                                            const newCourses = [...(formData.courses_data || [])];
                                                                            newCourses[selectedCourseIndex].next_course_id = value === "none" ? undefined : value.toLowerCase().trim().replace(/\s+/g, '-');
                                                                            handleChange("courses_data", newCourses);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="border-2 font-bold">
                                                                            <SelectValue placeholder="Selecione o próximo curso" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="none">Nenhum (Automático)</SelectItem>
                                                                            {(formData.courses_data || [])
                                                                                .filter((c, i) => i !== selectedCourseIndex && c.title && c.title.trim() !== "")
                                                                                .map((c, i) => (
                                                                                    <SelectItem
                                                                                        key={i}
                                                                                        value={c.title.toLowerCase().trim().replace(/\s+/g, '-')}
                                                                                    >
                                                                                        {c.title}
                                                                                    </SelectItem>
                                                                                ))
                                                                            }
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground italic pb-2">
                                                                    * Define qual módulo aparecerá no Portal do Aluno após a conclusão deste.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 pt-4 border-t">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <BookOpen className="h-4 w-4 text-primary" />
                                                                    <Label className="text-xs font-black uppercase tracking-wider text-primary">Conteúdo Programático</Label>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const newCourses = [...(formData.courses_data || [])];
                                                                        newCourses[selectedCourseIndex].features = [...(newCourses[selectedCourseIndex].features || []), ""];
                                                                        handleChange("courses_data", newCourses);
                                                                    }}
                                                                    className="h-7 text-[10px] font-black uppercase tracking-widest gap-1 border-primary/20 text-primary hover:bg-primary/5"
                                                                >
                                                                    <Plus className="h-3 w-3" /> Adicionar Tópico
                                                                </Button>
                                                            </div>
                                                            <div className="grid gap-3 sm:grid-cols-2">
                                                                {(formData.courses_data[selectedCourseIndex].features || []).map((feature, fIndex) => (
                                                                    <div key={fIndex} className="flex gap-2 group/feature">
                                                                        <div className="relative flex-1">
                                                                            <Input
                                                                                value={feature}
                                                                                className="pl-8 border-muted transition-all focus-visible:border-primary/50"
                                                                                onChange={(e) => {
                                                                                    const newCourses = [...(formData.courses_data || [])];
                                                                                    const newFeatures = [...(newCourses[selectedCourseIndex].features || [])];
                                                                                    newFeatures[fIndex] = e.target.value;
                                                                                    newCourses[selectedCourseIndex].features = newFeatures;
                                                                                    handleChange("courses_data", newCourses);
                                                                                }}
                                                                                placeholder="Ex: Teologia Sistemática"
                                                                            />
                                                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 font-black text-[10px]">
                                                                                {(fIndex + 1).toString().padStart(2, '0')}
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => {
                                                                                const newCourses = [...(formData.courses_data || [])];
                                                                                newCourses[selectedCourseIndex].features = (newCourses[selectedCourseIndex].features || []).filter((_, i) => i !== fIndex);
                                                                                handleChange("courses_data", newCourses);
                                                                            }}
                                                                            className="h-9 w-9 text-destructive opacity-0 group-hover/feature:opacity-100 transition-opacity hover:bg-destructive/10"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl text-center bg-muted/5"
                                            >
                                                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                                                    <ChefHat className="h-10 w-10 text-primary opacity-20" />
                                                </div>
                                                <h4 className="text-xl font-black text-muted-foreground/60 mb-2">Selecione um curso</h4>
                                                <p className="text-sm text-muted-foreground/40 max-w-xs">Escolha um módulo na lista à esquerda para editar seus detalhes, preços e sequência.</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Course (Details) & Social Details */}
                        <TabsContent value="hero" className="mt-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Cabeçalho (Hero)</CardTitle>
                                        <CardDescription>A primeira coisa que os visitantes veem ao abrir o site.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hero_badge">Badge (Texto pequeno acima do título)</Label>
                                            <Input
                                                id="hero_badge"
                                                value={formData.hero_badge || ""}
                                                onChange={(e) => handleChange("hero_badge", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hero_title">Título Principal</Label>
                                            <Input
                                                id="hero_title"
                                                value={formData.hero_title || ""}
                                                onChange={(e) => handleChange("hero_title", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hero_description">Descrição</Label>
                                            <Textarea
                                                id="hero_description"
                                                rows={4}
                                                value={formData.hero_description || ""}
                                                onChange={(e) => handleChange("hero_description", e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>

                        {/* CTA & Benefits Section */}
                        <TabsContent value="cta" className="mt-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Chamada para Ação</CardTitle>
                                            <CardDescription>Texto que incentiva a matrícula.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="cta_title">Título do CTA</Label>
                                                <Input
                                                    id="cta_title"
                                                    value={formData.cta_title || ""}
                                                    onChange={(e) => handleChange("cta_title", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cta_description">Descrição do CTA</Label>
                                                <Textarea
                                                    id="cta_description"
                                                    rows={3}
                                                    value={formData.cta_description || ""}
                                                    onChange={(e) => handleChange("cta_description", e.target.value)}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Benefícios</CardTitle>
                                            <CardDescription>Lista de itens que aparecem no CTA.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {(formData.benefits || []).map((benefit, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        value={benefit}
                                                        onChange={(e) => handleBenefitChange(index, e.target.value)}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeBenefit(index)}
                                                        className="text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={addBenefit} className="w-full gap-2">
                                                <Plus className="h-4 w-4" />
                                                Adicionar Benefício
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>
                        </TabsContent>

                        {/* Pricing Section */}
                        <TabsContent value="pricing" className="mt-6">
                            {/* ... pricing content ... */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Configurações de Preço</CardTitle>
                                        <CardDescription>Como o investimento é exibido no site.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="pricing_installments">Texto de Parcelamento (ex: 12x de R$ 150)</Label>
                                                <Input
                                                    id="pricing_installments"
                                                    value={formData.pricing_installments || ""}
                                                    onChange={(e) => handleChange("pricing_installments", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pricing_total">Texto à Vista (ex: ou R$ 1.500 à vista)</Label>
                                                <Input
                                                    id="pricing_total"
                                                    value={formData.pricing_total || ""}
                                                    onChange={(e) => handleChange("pricing_total", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>

                        {/* Course & Social Details */}
                        <TabsContent value="course" className="mt-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Detalhes do Curso</CardTitle>
                                        <CardDescription>Informações que aparecem no card de investimento.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="course_duration">Duração</Label>
                                            <Input
                                                id="course_duration"
                                                value={formData.course_duration || ""}
                                                onChange={(e) => handleChange("course_duration", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="course_workload">Carga Horária</Label>
                                            <Input
                                                id="course_workload"
                                                value={formData.course_workload || ""}
                                                onChange={(e) => handleChange("course_workload", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="course_modality">Modalidade</Label>
                                            <Input
                                                id="course_modality"
                                                value={formData.course_modality || ""}
                                                onChange={(e) => handleChange("course_modality", e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Share2 className="h-5 w-5" />
                                            Redes Sociais
                                        </CardTitle>
                                        <CardDescription>Links para as redes sociais no rodapé.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="social_facebook">Facebook URL</Label>
                                            <Input
                                                id="social_facebook"
                                                value={formData.social_facebook || ""}
                                                onChange={(e) => handleChange("social_facebook", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="social_instagram">Instagram URL</Label>
                                            <Input
                                                id="social_instagram"
                                                value={formData.social_instagram || ""}
                                                onChange={(e) => handleChange("social_instagram", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="social_youtube">Youtube URL</Label>
                                            <Input
                                                id="social_youtube"
                                                value={formData.social_youtube || ""}
                                                onChange={(e) => handleChange("social_youtube", e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div >
        </AdminLayout >
    );
}
