import { supabase } from "@/integrations/supabase/client";

export interface Course {
    title: string;
    description: string;
    duration: string;
    level: string;
    features: string[];
    available?: boolean;
    price?: number;
    next_course_id?: string;
}

export interface LandingPageContent {
    id: string;
    hero_badge: string;
    hero_title: string;
    hero_description: string;
    cta_title: string;
    cta_description: string;
    pricing_installments: string;
    pricing_total: string;
    benefits: string[];
    course_duration: string;
    course_workload: string;
    course_modality: string;
    social_facebook: string;
    social_instagram: string;
    social_youtube: string;
    courses_data?: Course[];
    updated_at?: string;
}

export const landingService = {
    async getContent(): Promise<LandingPageContent> {
        const { data, error } = await supabase
            .from("landing_page_content")
            .select("*")
            .maybeSingle();

        if (error || !data) {
            if (error) console.error("Erro ao buscar conteúdo do site:", error);
            // Retornar padrão se não existir no banco para evitar quebra
            return {
                id: "1",
                hero_badge: "Matrículas Abertas para 2025",
                hero_title: "Forme-se para servir ao Reino de Deus",
                hero_description: "A Escola do Reino oferece formação teológica sólida e prática, preparando homens e mulheres para o ministério cristão com excelência e compromisso bíblico.",
                cta_title: "Comece sua jornada de formação teológica hoje",
                cta_description: "Junte-se a centenas de alunos que já transformaram suas vidas através do conhecimento bíblico profundo.",
                pricing_installments: "12x de R$ 150",
                pricing_total: "ou R$ 1.500 à vista",
                benefits: [
                    "Professores experientes e qualificados",
                    "Material didático completo incluso",
                    "Certificado reconhecido ao final",
                    "Aulas presenciais e suporte online"
                ],
                course_duration: "2 anos",
                course_workload: "360 horas",
                course_modality: "Presencial",
                social_facebook: "#",
                social_instagram: "#",
                social_youtube: "#",
                courses_data: [
                    {
                        title: "Teologia Sistemática",
                        description: "Um estudo aprofundado das doutrinas fundamentais da fé cristã, desde a doutrina de Deus até a escatologia.",
                        duration: "2 anos",
                        level: "Básico ao Avançado",
                        features: [
                            "Bibliologia e Hermenêutica",
                            "Doutrina de Deus e Cristo",
                            "Soteriologia e Pneumatologia",
                            "Eclesiologia"
                        ]
                    },
                    {
                        title: "Liderança Ministerial",
                        description: "Formação prática para quem deseja liderar com excelência no Reino de Deus.",
                        duration: "1 ano",
                        level: "Liderança",
                        features: [
                            "Caráter do Líder",
                            "Gestão de Pessoas",
                            "Planejamento Ministerial",
                            "Aconselhamento Pastoral"
                        ]
                    },
                    {
                        title: "Panorama Bíblico",
                        description: "Uma jornada completa por todos os livros da Bíblia, entendendo o contexto e mensagem de cada um.",
                        duration: "1 ano",
                        level: "Introdutório",
                        features: [
                            "Antigo Testamento",
                            "Novo Testamento",
                            "História de Israel",
                            "Geografia Bíblica"
                        ]
                    }
                ]
            };
        }

        return data as LandingPageContent;
    },

    async updateContent(content: Partial<LandingPageContent>): Promise<LandingPageContent> {
        const { data: current, error: fetchError } = await supabase
            .from("landing_page_content")
            .select("id")
            .maybeSingle();

        let query;
        if (current?.id) {
            query = supabase
                .from("landing_page_content")
                .update({ ...content, updated_at: new Date().toISOString() })
                .eq("id", current.id);
        } else {
            // Remove id from content if it exists to let database generate one
            const { id, ...insertData } = content;
            query = supabase
                .from("landing_page_content")
                .insert([insertData]);
        }

        const { data, error } = await query.select().single();

        if (error) {
            console.error("Erro ao atualizar conteúdo do site:", error);
            throw error;
        }

        return data as LandingPageContent;
    }
};
