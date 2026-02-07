
import { supabase } from "@/integrations/supabase/client";

export interface AsaasCustomer {
    name: string;
    email: string;
    cpfCnpj: string;
    mobilePhone?: string;
    externalReference?: string;
}

export interface AsaasPayment {
    customer: string; // Asaas Customer ID
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
    value: number;
    dueDate: string; // YYYY-MM-DD
    description?: string;
    externalReference?: string;
}

const handleSupabaseError = async (error: any) => {
    console.error("Asaas Service Error Raw:", error);
    try {
        if (error && error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body && body.error) {
                return new Error(body.error);
            }
        }
    } catch (e) {
        console.error("Error parsing response body:", e);
    }
    return error;
};

export const asaasService = {
    async createCustomer(customerData: AsaasCustomer) {
        const { data, error } = await supabase.functions.invoke("asaas-integration", {
            body: {
                action: "create_customer",
                ...customerData
            }
        });

        if (error) throw await handleSupabaseError(error);
        if (!data.success) throw new Error(data.error || "Failed to create Asaas customer");

        return data.data; // Returns Asaas Customer Object (including .id)
    },

    async createPayment(paymentData: AsaasPayment) {
        const { data, error } = await supabase.functions.invoke("asaas-integration", {
            body: {
                action: "create_payment",
                ...paymentData
            }
        });

        if (error) throw await handleSupabaseError(error);
        if (!data.success) throw new Error(data.error || "Failed to create Asaas payment");

        return data.data; // Returns Payment Object (including .invoiceUrl, .bankSlipUrl, .pixQrCodeField)
    },

    async getPaymentStatus(paymentId: string) {
        const { data, error } = await supabase.functions.invoke("asaas-integration", {
            body: {
                action: "get_payment_status",
                id: paymentId
            }
        });

        if (error) throw await handleSupabaseError(error);
        if (!data.success) throw new Error(data.error || "Failed to fetch status");

        return data.data;
    }
};
