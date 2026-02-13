import { supabase } from "@/integrations/supabase/client";

export interface MercadoPagoPreference {
    items: Array<{
        title: string;
        unit_price: number;
        quantity: number;
    }>;
    back_urls?: {
        success: string;
        pending: string;
        failure: string;
    };
    auto_return?: "approved" | "all";
    external_reference?: string;
    payer?: {
        name?: string;
        email?: string;
    };
}

const handleSupabaseError = async (error: any) => {
    console.error("Mercado Pago Service Error Raw:", error);
    if (error.message && error.message.includes("non-2xx")) {
        // Se for erro de status do Supabase, tentamos pegar o corpo
        try {
            const context = (error as any).context;
            if (context && typeof context.json === 'function') {
                const body = await context.json();
                if (body && body.error) return new Error(body.error);
            }
        } catch (e) {
            console.error("Erro ao converter JSON de erro:", e);
        }
    }
    return error;
};

export const mercadopagoService = {
    async createPreference(preferenceData: MercadoPagoPreference) {
        const { data, error } = await supabase.functions.invoke("mercadopago-integration", {
            body: {
                action: "create_preference",
                ...preferenceData
            }
        });

        if (error) throw await handleSupabaseError(error);

        if (!data.success) {
            throw new Error(data.error || "Failed to create Mercado Pago preference");
        }

        return data.data; // Retorna o objeto da preferência (incluindo init_point)
    }
};
