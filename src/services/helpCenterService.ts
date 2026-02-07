import { supabase } from "@/integrations/supabase/client";

export interface HelpCenterItem {
    id: string;
    title: string;
    content: string;
    video_url?: string;
    category?: string;
    created_at: string;
}

export const helpCenterService = {
    async getItems(): Promise<HelpCenterItem[]> {
        const { data, error } = await supabase
            .from("help_center_items")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar itens de ajuda:", error);
            // Fallback for when table doesn't exist yet to avoid crashing the app completely
            if (error.code === '42P01') {
                return [];
            }
            throw error;
        }

        return data as HelpCenterItem[];
    },

    async createItem(item: Omit<HelpCenterItem, "id" | "created_at">): Promise<HelpCenterItem> {
        const { data, error } = await supabase
            .from("help_center_items")
            .insert(item)
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar item de ajuda:", error);
            throw error;
        }

        return data as HelpCenterItem;
    },

    async updateItem(id: string, item: Partial<HelpCenterItem>): Promise<HelpCenterItem> {
        const { data, error } = await supabase
            .from("help_center_items")
            .update(item)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar item de ajuda:", error);
            throw error;
        }

        return data as HelpCenterItem;
    },

    async deleteItem(id: string): Promise<void> {
        const { error } = await supabase
            .from("help_center_items")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir item de ajuda:", error);
            throw error;
        }
    }
};
