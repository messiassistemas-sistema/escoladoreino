import { useState, useEffect } from "react";
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
import { KeyRound, Loader2, User, Mail, Hash, MapPin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { studentsService } from "@/services/studentsService";
import { useStudentData } from "@/hooks/useStudentData";

const formSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
});

export default function PortalPerfil() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Use centralized hook
    const { student, refetchStudent, displayName, displayEmail, displayRegistration } = useStudentData();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            password: "",
            confirmPassword: "",
        },
    });

    // Update form when student data is loaded
    useEffect(() => {
        form.reset({
            name: displayName,
            password: "",
            confirmPassword: "",
        });
    }, [displayName, displayEmail, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            // 1. Update Profile in Database if name changed
            if (student && values.name !== student.name) {
                await studentsService.updateStudent(student.id, { name: values.name });
            }

            // 2. Update Auth User (Metadata and Password if provided)
            const updateData: any = {
                data: {
                    full_name: values.name,
                    name: values.name
                }
            };

            if (values.password) {
                updateData.password = values.password;
            }

            const { error } = await supabase.auth.updateUser(updateData);

            if (error) throw error;

            toast({
                title: "Perfil atualizado!",
                description: "Suas informações foram salvas com sucesso.",
            });

            refetchStudent();
            form.reset({ ...values, password: "", confirmPassword: "" });
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar",
                description: error.message || "Ocorreu um erro ao tentar atualizar o perfil.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const userData = {
        name: displayName,
        email: displayEmail,
        student_id: displayRegistration,
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
                            <div className="mt-4 pt-4 border-t space-y-3">
                                <Badge variant="secondary" className={cn(
                                    "w-full justify-center py-1.5 gap-2 border shadow-sm",
                                    student?.modality === 'online'
                                        ? "bg-amber-100 text-amber-700 border-amber-200"
                                        : "bg-blue-100 text-blue-700 border-blue-200"
                                )}>
                                    {student?.modality === 'online' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                    MODALIDADE: {student?.modality?.toUpperCase() || 'PRESENCIAL'}
                                </Badge>

                                {student?.modality === 'online' && student?.status === 'pendente' && (
                                    <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-100 italic">
                                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">
                                            Sob análise da direção
                                        </p>
                                    </div>
                                )}
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
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Nome Completo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Seu nome" className="rounded-xl" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
