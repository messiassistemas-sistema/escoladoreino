import { supabase } from "@/integrations/supabase/client";

export interface DailyQuote {
    id: string;
    content: string;
    author: string;
    created_at: string;
}

export const dailyQuotesService = {
    async getQuotes(): Promise<DailyQuote[]> {
        const { data, error } = await supabase
            .from("daily_quotes")
            .select("*");

        if (error) {
            console.error("Erro ao buscar frases diárias:", error);
            throw error;
        }

        return data as DailyQuote[];
    },

    async getQuoteOfTheDay(): Promise<DailyQuote | null> {
        try {
            const quotes = await this.getQuotes();
            if (quotes.length === 0) return null;

            // Simple logic: seed based on the day of the year
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);

            const index = dayOfYear % quotes.length;
            return quotes[index];
        } catch (error) {
            console.error("Erro ao selecionar a frase do dia:", error);
            return null;
        }
    }
};
