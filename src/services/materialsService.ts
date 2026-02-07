import { supabase } from "@/integrations/supabase/client";

export interface Material {
    id: string;
    title: string;
    subject_name: string;
    type: 'pdf' | 'pptx' | 'video' | 'link';
    file_size: string | null;
    file_url: string;
    author_name: string;
    downloads_count: number;
    created_at: string;
}

export const materialsService = {
    async getMaterials(): Promise<Material[]> {
        const { data, error } = await supabase
            .from("materials")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar materiais:", error);
            throw error;
        }

        return data as Material[];
    },

    async createMaterial(material: Omit<Material, "id" | "created_at" | "downloads_count">): Promise<Material> {
        const { data, error } = await supabase
            .from("materials")
            .insert({ ...material, downloads_count: 0 })
            .select()
            .single();

        if (error) {
            console.error("Erro ao cadastrar material:", error);
            throw error;
        }

        return data as Material;
    },

    async updateMaterial(id: string, material: Partial<Material>): Promise<Material> {
        const { data, error } = await supabase
            .from("materials")
            .update(material)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar material:", error);
            throw error;
        }

        return data as Material;
    },

    async deleteMaterial(id: string): Promise<void> {
        const { error } = await supabase
            .from("materials")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir material:", error);
            throw error;
        }
    },

    async incrementDownloads(id: string): Promise<void> {
        await supabase.rpc('increment_material_downloads', { material_id: id });
    },

    async uploadFile(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `materials/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('school-materials')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('school-materials')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
