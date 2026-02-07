import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Calendar, Search, Trash2, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminMensagens() {
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const { data: messages, isLoading, refetch } = useQuery({
        queryKey: ["contact-messages"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("contact_messages")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("contact_messages")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast({
                title: "Mensagem excluída",
                description: "A mensagem foi removida com sucesso.",
            });
            refetch();
        } catch (error) {
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir a mensagem.",
                variant: "destructive",
            });
        }
    };

    const filteredMessages = messages?.filter(
        (msg) =>
            msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout title="Mensagens" description="Gerencie as mensagens recebidas pelo site">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Todas as Mensagens</h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome, email ou mensagem..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Remetente</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Mensagem</TableHead>
                                <TableHead className="w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Carregando mensagens...
                                    </TableCell>
                                </TableRow>
                            ) : filteredMessages?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhuma mensagem encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMessages?.map((msg) => (
                                    <TableRow key={msg.id}>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {format(new Date(msg.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{msg.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {msg.email}
                                                </div>
                                                {msg.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                        {msg.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="link" className="h-auto p-0 text-foreground truncate max-w-[200px] block">
                                                        {msg.message}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Mensagem de {msg.name}</DialogTitle>
                                                        <DialogDescription>
                                                            Recebida em {format(new Date(msg.created_at), "PPP 'às' HH:mm", { locale: ptBR })}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="font-semibold block mb-1">Email</span>
                                                                {msg.email}
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold block mb-1">Telefone</span>
                                                                {msg.phone || "-"}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold block mb-1">Mensagem</span>
                                                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                                                {msg.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(msg.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}
