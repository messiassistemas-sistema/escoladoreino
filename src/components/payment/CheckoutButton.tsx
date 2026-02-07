
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { asaasService } from "@/services/asaasService";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";

interface CheckoutButtonProps {
    amount: number;
    description: string;
    studentName: string;
    studentEmail: string;
    cpfCnpj: string;
    mobilePhone?: string;
    buttonText?: string;
    onSuccess?: (payment: any) => void;
}

export function CheckoutButton({
    amount,
    description,
    studentName,
    studentEmail,
    cpfCnpj,
    mobilePhone,
    buttonText = "Pagar com Asaas",
    onSuccess
}: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        try {
            setLoading(true);
            toast.info("Iniciando pagamento...");

            // 1. Create/Get Customer
            // Note: In a real app, you should check if the user already has an asaas_id in your DB.
            // For this implementation, we try to create (Asaas handles duplicates by email usually, or returns existing)
            // But strictly speaking, Asaas API v3 create customer returns a new ID if not careful. 
            // Ideally we store this ID. For now, we generate strictly for the checkout flow.

            const customer = await asaasService.createCustomer({
                name: studentName,
                email: studentEmail,
                cpfCnpj: cpfCnpj,
                mobilePhone: mobilePhone,
                externalReference: studentEmail // using email as reference
            });

            console.log("Customer created/found:", customer);

            // 2. Create Payment
            // Defaulting to billingType UNDEFINED to let user choose in the hosted page?
            // Actually Asaas API requires billingType for direct API payments.
            // If we want a "Link de Pagamento" (Payment Link), that's a different endpoint.
            // But createPayment returns an 'invoiceUrl' which IS a hosted payment page for that specific charge.
            // We usually pick UNDEF or specific. Let's send 'PIX' as default or let backend handle?
            // The service interface says 'PIX' | 'BOLETO' | 'CREDIT_CARD'.
            // Let's iterate: For the hosted page experience, usually we create with billingType: 'UNDEFINED' if allowed, 
            // or we pick one. Asaas API V3 `billingType` is required.

            // Wait, if we want the generic payment page where user CHOOSES method, 
            // we should creating a generic charge or use a predefined method. 
            // Let's assume we want to offer the User the link to pay. 
            // Often developers send "BOLETO" and the link allows changing to PIX/Card if configured in Asaas Dashboard.
            // Or we just ask the user before this button?
            // Let's default to 'PIX' for now as it's the most common/modern for "Brazil".
            // OR we can add a selector prop.

            const payment = await asaasService.createPayment({
                customer: customer.id,
                billingType: 'PIX', // Defaulting to PIX, but the link usually supports others if enabled in Asaas settings.
                value: amount,
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
                description: description,
                externalReference: `ORD-${Date.now()}`
            });

            toast.success("Pagamento criado! Redirecionando...");

            if (onSuccess) onSuccess(payment);

            // Redirect to Asaas Hosted Page
            if (payment.invoiceUrl) {
                window.open(payment.invoiceUrl, '_blank');
            } else {
                toast.error("URL de pagamento não gerada.");
            }

        } catch (error: any) {
            console.error("Checkout error:", error);
            toast.error(error.message || "Erro ao processar pagamento.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handlePayment} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            {buttonText}
        </Button>
    );
}
