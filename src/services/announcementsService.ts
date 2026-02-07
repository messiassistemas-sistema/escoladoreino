import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
    id: string;
    title: string;
    content: string;
    audience: string;
    author_name: string;
    type: 'info' | 'urgente' | 'evento';
    pinned: boolean;
    views: number;
    created_at: string;
}

export const announcementsService = {
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase
            .from("announcements")
            .select("*")
            .order("pinned", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar avisos:", error);
            throw error;
        }

        return data as Announcement[];
    },

    async createAnnouncement(announcement: Omit<Announcement, "id" | "created_at" | "views">): Promise<Announcement> {
        const { data, error } = await supabase
            .from("announcements")
            .insert({ ...announcement, views: 0 })
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar aviso:", error);
            throw error;
        }

        return data as Announcement;
    },

    async updateAnnouncement(id: string, announcement: Partial<Announcement>): Promise<Announcement> {
        const { data, error } = await supabase
            .from("announcements")
            .update(announcement)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar aviso:", error);
            throw error;
        }

        return data as Announcement;
    },

    async deleteAnnouncement(id: string): Promise<void> {
        const { error } = await supabase
            .from("announcements")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir aviso:", error);
            throw error;
        }
    },

    async incrementViews(id: string): Promise<void> {
        await supabase.rpc('increment_announcement_views', { announcement_id: id });
    }
};
