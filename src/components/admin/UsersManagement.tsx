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
import { Plus } from "lucide-react";

export function UsersManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        fullName: "",
        email: "",
        role: "teacher"
    });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: settingsService.getUsers
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => settingsService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setIsOpen(false);
            setNewUser({ fullName: "", email: "", role: "teacher" });
            toast({ title: "Usuário convidado com sucesso!", description: "As credenciais foram enviadas por e-mail." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Membros da Equipe</h3>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
                    </DialogTrigger>
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
        </div>
    );
}
