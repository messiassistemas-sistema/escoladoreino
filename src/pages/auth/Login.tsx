
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Loader2 } from "lucide-react";
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
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: settings } = useQuery({
        queryKey: ["system-settings"],
        queryFn: settingsService.getSettings,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    useEffect(() => {
        document.title = settings?.school_name ? `${settings.school_name} - Login` : "Escola do Reino - Login";
    }, [settings]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            console.log("Tentando login para:", values.email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) {
                console.error("Erro Supabase Auth:", error);
                throw error;
            }

            if (!data.user) {
                throw new Error("Usuário não encontrado após login.");
            }

            const role = data.user.user_metadata?.role;
            console.log("Login bem-sucedido. Role:", role);

            toast({
                title: "Login realizado com sucesso!",
                description: "Bem-vindo de volta.",
            });

            // Pequeno delay para garantir que o AuthContext atualizou
            setTimeout(() => {
                if (role === 'admin') {
                    navigate("/admin");
                } else {
                    navigate("/portal");
                }
            }, 500);

        } catch (error: any) {
            console.error("Catch login error:", error);
            let errorMessage = "Ocorreu um erro ao tentar entrar.";

            if (error.message === "Invalid login credentials") {
                errorMessage = "E-mail ou senha incorretos.";
            } else if (error.message.includes("Email not confirmed")) {
                errorMessage = "E-mail ainda não confirmado.";
            } else if (error.status === 429) {
                errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
            } else {
                errorMessage = error.message;
            }

            toast({
                title: "Falha na autenticação",
                description: errorMessage,
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
                    <h1 className="font-display text-2xl font-bold">{settings?.school_name || "Escola do Reino"}</h1>
                    <p className="text-sm text-muted-foreground">
                        Entre para acessar sua conta
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
                                        <Input placeholder="seu@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Senha</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-primary hover:underline hover:text-primary/80"
                            >
                                Esqueci a senha
                            </Link>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="text-center text-sm text-muted-foreground">
                    <Link to="/" className="hover:text-foreground">
                        Voltar para o início
                    </Link>
                </div>
            </div>
        </div>
    );
}
