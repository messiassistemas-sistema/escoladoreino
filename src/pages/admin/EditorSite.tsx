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

export default function AdminEditorSite() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<LandingPageContent>>({});

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
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold">Cursos Oferecidos</h3>
                                        <p className="text-sm text-muted-foreground">Gerencie os cursos que aparecem na página "Nossos Cursos".</p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const newCourses = [...(formData.courses_data || []), {
                                                title: "Novo Curso",
                                                description: "Descrição do curso...",
                                                duration: "1 ano",
                                                level: "Básico",
                                                features: ["Matéria 1", "Matéria 2"]
                                            }];
                                            handleChange("courses_data", newCourses);
                                        }}
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" /> Novo Curso
                                    </Button>
                                </div>

                                <div className="grid gap-6">
                                    {(formData.courses_data || []).map((course, index) => (
                                        <Card key={index}>
                                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                                <CardTitle className="text-base font-medium">#{index + 1} - {course.title}</CardTitle>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={index === 0}
                                                        onClick={() => {
                                                            const newCourses = [...(formData.courses_data || [])];
                                                            const temp = newCourses[index - 1];
                                                            newCourses[index - 1] = newCourses[index];
                                                            newCourses[index] = temp;
                                                            handleChange("courses_data", newCourses);
                                                        }}
                                                        title="Mover para cima"
                                                    >
                                                        <ArrowUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={index === (formData.courses_data?.length || 0) - 1}
                                                        onClick={() => {
                                                            const newCourses = [...(formData.courses_data || [])];
                                                            const temp = newCourses[index + 1];
                                                            newCourses[index + 1] = newCourses[index];
                                                            newCourses[index] = temp;
                                                            handleChange("courses_data", newCourses);
                                                        }}
                                                        title="Mover para baixo"
                                                    >
                                                        <ArrowDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            const newCourses = (formData.courses_data || []).filter((_, i) => i !== index);
                                                            handleChange("courses_data", newCourses);
                                                        }}
                                                        className="text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Nome do Curso</Label>
                                                        <Input
                                                            value={course.title}
                                                            onChange={(e) => {
                                                                const newCourses = [...(formData.courses_data || [])];
                                                                newCourses[index].title = e.target.value;
                                                                handleChange("courses_data", newCourses);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Nível</Label>
                                                        <Input
                                                            value={course.level}
                                                            onChange={(e) => {
                                                                const newCourses = [...(formData.courses_data || [])];
                                                                newCourses[index].level = e.target.value;
                                                                handleChange("courses_data", newCourses);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Descrição</Label>
                                                    <Textarea
                                                        rows={2}
                                                        value={course.description}
                                                        onChange={(e) => {
                                                            const newCourses = [...(formData.courses_data || [])];
                                                            newCourses[index].description = e.target.value;
                                                            handleChange("courses_data", newCourses);
                                                        }}
                                                    />
                                                </div>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Duração</Label>
                                                        <Input
                                                            value={course.duration}
                                                            onChange={(e) => {
                                                                const newCourses = [...(formData.courses_data || [])];
                                                                newCourses[index].duration = e.target.value;
                                                                handleChange("courses_data", newCourses);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Preço da Matrícula (R$)</Label>
                                                        <Input
                                                            type="number"
                                                            value={course.price || ""}
                                                            placeholder="Ex: 1500"
                                                            onChange={(e) => {
                                                                const newCourses = [...(formData.courses_data || [])];
                                                                newCourses[index].price = Number(e.target.value);
                                                                handleChange("courses_data", newCourses);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2 pt-8">
                                                        <Switch
                                                            id={`available-${index}`}
                                                            checked={course.available !== false}
                                                            onCheckedChange={(checked) => {
                                                                const newCourses = [...(formData.courses_data || [])];
                                                                newCourses[index].available = checked;
                                                                handleChange("courses_data", newCourses);
                                                            }}
                                                        />
                                                        <Label htmlFor={`available-${index}`}>Matrículas Abertas</Label>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label>Disciplinas/Tópicos</Label>
                                                    <div className="grid gap-2">
                                                        {(course.features || []).map((feature, fIndex) => (
                                                            <div key={fIndex} className="flex gap-2">
                                                                <Input
                                                                    value={feature}
                                                                    onChange={(e) => {
                                                                        const newCourses = [...(formData.courses_data || [])];
                                                                        const newFeatures = [...(newCourses[index].features || [])];
                                                                        newFeatures[fIndex] = e.target.value;
                                                                        newCourses[index].features = newFeatures;
                                                                        handleChange("courses_data", newCourses);
                                                                    }}
                                                                    placeholder="Ex: Teologia Sistemática"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        const newCourses = [...(formData.courses_data || [])];
                                                                        newCourses[index].features = (newCourses[index].features || []).filter((_, i) => i !== fIndex);
                                                                        handleChange("courses_data", newCourses);
                                                                    }}
                                                                    className="text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                const newCourses = [...(formData.courses_data || [])];
                                                                newCourses[index].features = [...(newCourses[index].features || []), ""];
                                                                handleChange("courses_data", newCourses);
                                                            }}
                                                            className="w-full gap-2 mt-2"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Adicionar Tópico
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </motion.div>
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
