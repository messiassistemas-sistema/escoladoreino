import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CreditCard,
    Barcode,
    QrCode,
    ExternalLink,
    ChevronRight,
    Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { paymentsService } from "@/services/paymentsService";

interface EnrollmentPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: {
        id: string;
        title: string;
        price: number | null;
    } | null;
    student: {
        id: string;
        name: string;
        email: string | null;
    } | null;
}

export const EnrollmentPaymentModal: React.FC<EnrollmentPaymentModalProps> = ({
    isOpen,
    onClose,
    course,
    student
}) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<any>(null);

    const handleStartEnrollment = async () => {
        if (!course || !student) return;

        setIsLoading(true);
        try {
            const result = await paymentsService.createEnrollmentPayment({
                studentId: student.id,
                studentName: student.name,
                studentEmail: student.email || "",
                amount: course.price || 0,
                courseTitle: course.title
            });

            setPaymentData(result);
            toast({
                title: "Cobrança gerada!",
                description: "Escolha agora sua forma de pagamento preferida.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao gerar pagamento",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const openCheckout = () => {
        if (paymentData?.invoiceUrl) {
            window.open(paymentData.invoiceUrl, "_blank");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-bold">Matricular-se no Módulo</DialogTitle>
                    <DialogDescription className="font-medium">
                        Você está prestes a iniciar sua nova etapa em <strong>{course?.title}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {!paymentData ? (
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <span className="font-bold text-muted-foreground">Investimento</span>
                            <span className="text-2xl font-black text-primary">
                                {course?.price ? `R$ ${course.price.toFixed(2)}` : "R$ 0,00"}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Formas de Pagamento</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card text-center">
                                    <QrCode className="h-5 w-5 text-emerald-500" />
                                    <span className="text-[10px] font-bold">PIX</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card text-center">
                                    <CreditCard className="h-5 w-5 text-blue-500" />
                                    <span className="text-[10px] font-bold">CARTÃO</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card text-center">
                                    <Barcode className="h-5 w-5 text-amber-500" />
                                    <span className="text-[10px] font-bold">BOLETO</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20"
                            onClick={handleStartEnrollment}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    Confirmar e Gerar Pagamento
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 pt-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="text-center space-y-2">
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none font-bold">SUCESSO</Badge>
                            <p className="text-sm font-medium text-muted-foreground">Sua fatura foi gerada com sucesso no Asaas.</p>
                        </div>

                        <div className="grid gap-3">
                            <Button
                                variant="outline"
                                className="h-16 rounded-2xl border-primary/20 hover:bg-primary/5 flex items-center justify-between px-6"
                                onClick={openCheckout}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <ExternalLink className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold">Checkout Completo</p>
                                        <p className="text-xs text-muted-foreground">Pague com Cartão, Boleto ou PIX</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>

                        <p className="text-[10px] text-center text-muted-foreground px-6">
                            Ao clicar no botão acima você será redirecionado para o ambiente seguro de pagamento.
                            Sua matrícula será liberada automaticamente após a confirmação.
                        </p>

                        <Button variant="ghost" className="w-full font-bold text-muted-foreground" onClick={onClose}>
                            Fechar e concluir depois
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
