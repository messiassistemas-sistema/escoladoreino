
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Loader2, ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

const formSchema = z.object({
    email: z.string().email("E-mail inválido"),
});

export default function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const { data: settings } = useQuery({
        queryKey: ["system-settings"],
        queryFn: settingsService.getSettings,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        document.title = settings?.school_name ? `${settings.school_name} - Recuperar Senha` : "Escola do Reino - Recuperar Senha";
    }, [settings]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) {
                // Rate limit error often comes with 429 status
                if (error.status === 429) {
                    throw new Error("Muitas solicitações. Aguarde um momento.");
                }
                throw error;
            }

            toast({
                title: "E-mail enviado!",
                description: "Verifique sua caixa de entrada para redefinir a senha.",
            });
            form.reset();
        } catch (error: any) {
            toast({
                title: "Erro ao enviar",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-lg">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-0 flex h-32 w-full items-center justify-center">
                        {settings?.logo_url ? (
                            <img
                                src={settings.logo_url}
                                alt="Logo"
                                className="h-full w-auto object-contain"
                            />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
                                <BookOpen className="h-10 w-10 text-primary-foreground" />
                            </div>
                        )}
                    </div>
                    <h1 className="font-display text-2xl font-bold">Recuperar Senha</h1>
                    <p className="text-sm text-muted-foreground">
                        Digite seu e-mail para receber o link de redefinição
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="seu@email.com" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Link"
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
                    <Link to="/matricula" className="hover:text-primary hover:underline">
                        Ainda não é aluno? Faça sua matrícula
                    </Link>
                    <Link to="/login" className="flex items-center justify-center gap-2 hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para o login
                    </Link>
                </div>
            </div>
        </div>
    );
}
