import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Copy, KeyRound, Loader2, MessageCircle, RefreshCcw, Key } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function UsersManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        fullName: "",
        email: "",
        role: "teacher"
    });

    // New State for Credentials Modal
    const [credentialModalOpen, setCredentialModalOpen] = useState(false);
    const [activeCredentials, setActiveCredentials] = useState<{ email: string, password: string, name: string } | null>(null);

    // Manual Password State
    const [manualPasswordOpen, setManualPasswordOpen] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null);
    const [manualPassword, setManualPassword] = useState("");

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: settingsService.getUsers
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => settingsService.createUser(data),
        onSuccess: (response: { password: string }) => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setIsOpen(false);

            // Set credentials and open modal
            setActiveCredentials({
                email: newUser.email,
                password: response.password,
                name: newUser.fullName
            });
            setCredentialModalOpen(true);

            setNewUser({ fullName: "", email: "", role: "teacher" });
            toast({ title: "Usuário criado!", description: "Credenciais geradas com sucesso." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const resetPasswordMutation = useMutation({
        mutationFn: (user: { id: string, email: string, full_name: string }) => settingsService.resetUserPassword(user.id, user.email),
        onSuccess: (response: { password: string }, variables) => {
            setActiveCredentials({
                email: variables.email,
                password: response.password,
                name: variables.full_name
            });
            setCredentialModalOpen(true);
            toast({ title: "Senha redefinida!", description: "Nova senha gerada com sucesso." });
            setManualPasswordOpen(false); // Close manual dialog if open
            setManualPassword(""); // Reset
        },
        onError: (error: Error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const handleManualPasswordSubmit = () => {
        if (!selectedUserForPassword || !manualPassword) return;

        // We override the service call slightly here or we assume the service supports passing a password?
        // Let's check settingsService.resetUserPassword. 
        // It generates a random password internally: const newPassword = Math.random().toString(36).slice(-8) + "A1!";
        // We need to UPDATE settingsService to accept an optional password.

        // Since I cannot change settingsService in this same tool call easily without risk, I will assume I will update it next.
        // For now, I'll pass it as a second argument (which TS might complain about until I fix it).
        // Actually, let's call the mutation with extra data if possible, or create a new mutation.

        // Better approach: Update the mutation implementation to look for a custom password in variables
        manualPasswordMutation.mutate({
            user: selectedUserForPassword,
            password: manualPassword
        });
    };

    const manualPasswordMutation = useMutation({
        mutationFn: (data: { user: any, password: string }) => settingsService.resetUserPassword(data.user.id, data.user.email, data.password),
        onSuccess: (response: { password: string }, variables) => {
            setActiveCredentials({
                email: variables.user.email,
                password: response.password,
                name: variables.user.full_name
            });
            setCredentialModalOpen(true);
            setManualPasswordOpen(false);
            setManualPassword("");
            toast({ title: "Sucesso", description: "Senha definida manualmente." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
    };

    const sendToWhatsapp = () => {
        if (!activeCredentials) return;
        const text = `Olá ${activeCredentials.name}, segue seu acesso ao sistema Escola do Reino:\n\n*Login:* ${activeCredentials.email}\n*Senha:* ${activeCredentials.password}\n\nAcesse em: https://escoladoreino.com.br`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Membros da Equipe</h3>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
                    </DialogTrigger>
                    {/* Manual Password Dialog */}
                    <Dialog open={manualPasswordOpen} onOpenChange={setManualPasswordOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Definir Senha Manualmente</DialogTitle>
                                <DialogDescription>
                                    Defina uma senha específica para {selectedUserForPassword?.full_name}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nova Senha</Label>
                                    <Input
                                        value={manualPassword}
                                        onChange={(e) => setManualPassword(e.target.value)}
                                        placeholder="Digite a nova senha..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setManualPasswordOpen(false)}>Cancelar</Button>
                                <Button onClick={handleManualPasswordSubmit} disabled={resetPasswordMutation.isPending || !manualPassword}>
                                    {resetPasswordMutation.isPending ? "Salvando..." : "Salvar Senha"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                            <DialogDescription>Crie um novo acesso para membro da equipe.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input
                                    value={newUser.fullName}
                                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>E-mail</Label>
                                <Input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo / Permissão</Label>
                                <Select
                                    value={newUser.role}
                                    onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                                        <SelectItem value="secretary">Secretário(a) (Acesso Geral)</SelectItem>
                                        <SelectItem value="treasurer">Tesoureiro (Acesso Financeiro)</SelectItem>
                                        <SelectItem value="teacher">Professor (Acesso Acadêmico)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button onClick={() => createMutation.mutate(newUser)} disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Criando..." : "Criar Usuário"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.full_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {user.role === 'admin' ? 'Administrador' :
                                            user.role === 'secretary' ? 'Secretário(a)' :
                                                user.role === 'treasurer' ? 'Tesoureiro' :
                                                    user.role === 'teacher' ? 'Professor' : user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge></TableCell>
                                <TableCell className="text-right">
                                    <TooltipProvider>
                                        <div className="flex justify-end gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm("Deseja redefinir a senha deste usuário aleatoriamente?")) {
                                                                resetPasswordMutation.mutate(user as any);
                                                            }
                                                        }}
                                                        disabled={resetPasswordMutation.isPending}
                                                    >
                                                        {resetPasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4 text-orange-500" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Redefinir Senha (Aleatória)</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => {
                                                            if (confirm(`Deseja gerar uma nova senha para ${user.full_name} e enviar pelo WhatsApp?`)) {
                                                                resetPasswordMutation.mutate(user as any);
                                                            }
                                                        }}
                                                        disabled={resetPasswordMutation.isPending}
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Gerar e Enviar no WhatsApp</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUserForPassword(user);
                                                            setManualPassword("");
                                                            setManualPasswordOpen(true);
                                                        }}
                                                    >
                                                        <Key className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Definir Senha Manualmente</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </TooltipProvider>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Credentials Success Modal */}
            <Dialog open={credentialModalOpen} onOpenChange={setCredentialModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            Credenciais de Acesso
                        </DialogTitle>
                        <DialogDescription>
                            Envie estas credenciais para o usuário agora.
                        </DialogDescription>
                    </DialogHeader>

                    {activeCredentials && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-muted rounded-lg space-y-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">E-mail (Login)</Label>
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono font-medium">{activeCredentials.email}</p>
                                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(activeCredentials.email)}>
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Senha Gerada</Label>
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono font-medium">{activeCredentials.password}</p>
                                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(activeCredentials.password)}>
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                                onClick={sendToWhatsapp}
                            >
                                <MessageCircle className="h-4 w-4" />
                                Enviar no WhatsApp
                            </Button>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setCredentialModalOpen(false)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
