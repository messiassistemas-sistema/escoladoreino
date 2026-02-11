import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { KeyRound, Loader2, User, Mail, Hash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
});

export default function PortalPerfil() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: values.password,
            });

            if (error) throw error;

            toast({
                title: "Senha atualizada!",
                description: "Sua senha foi alterada com sucesso.",
            });
            form.reset();
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar",
                description: error.message || "Ocorreu um erro ao tentar alterar a senha.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const userData = {
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || "Aluno",
        email: user?.email || "",
        student_id: user?.user_metadata?.student_id || "N/A",
    };

    return (
        <PortalLayout title="Meu Perfil" description="Gerencie suas informações e segurança da conta.">
            <div className="max-w-4xl space-y-8">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* User Info Card */}
                    <Card className="md:col-span-1 border-none shadow-soft h-fit">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                                <User className="h-10 w-10" />
                            </div>
                            <CardTitle className="font-display text-xl">{userData.name}</CardTitle>
                            <CardDescription className="text-xs uppercase tracking-widest font-bold">Portal do Aluno</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{userData.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground font-medium">ID: {userData.student_id}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Password Change Card */}
                    <Card className="md:col-span-2 border-none shadow-soft">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-display text-xl">
                                <KeyRound className="h-5 w-5 text-primary" />
                                Alterar Senha
                            </CardTitle>
                            <CardDescription>
                                Recomendamos o uso de uma senha forte que você não utilize em outros sites.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Nova Senha</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="******" className="rounded-xl" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Confirmar Nova Senha</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="******" className="rounded-xl" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={loading} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Atualizar Senha
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PortalLayout>
    );
}
