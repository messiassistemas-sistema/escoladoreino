import { useState } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    HelpCircle,
    Video,
    FileText,
    ExternalLink
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { helpCenterService, HelpCenterItem } from "@/services/helpCenterService";
import { useToast } from "@/hooks/use-toast";

export default function AdminHelpCenter() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<HelpCenterItem | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        video_url: "",
    });

    const { data: items = [], isLoading } = useQuery({
        queryKey: ["help-center-items"],
        queryFn: helpCenterService.getItems,
    });

    const createMutation = useMutation({
        mutationFn: helpCenterService.createItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["help-center-items"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Item criado com sucesso!" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao criar item",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<HelpCenterItem> }) =>
            helpCenterService.updateItem(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["help-center-items"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Item atualizado com sucesso!" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao atualizar item",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: helpCenterService.deleteItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["help-center-items"] });
            toast({ title: "Item excluído com sucesso!" });
        },
    });

    const resetForm = () => {
        setEditingItem(null);
        setFormData({ title: "", content: "", video_url: "" });
    };

    const handleEdit = (item: HelpCenterItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            content: item.content || "",
            video_url: item.video_url || "",
        });
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.title) {
            toast({
                title: "Campo obrigatório",
                description: "O título é obrigatório.",
                variant: "destructive",
            });
            return;
        }

        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const filteredItems = items.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout title="Central de Ajuda" description="Gerencie tutoriais e artigos de ajuda">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar itens..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Novo Artigo/Vídeo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>{editingItem ? "Editar Item" : "Novo Item de Ajuda"}</DialogTitle>
                                <DialogDescription>
                                    Crie ou edite tutoriais e artigos para a central de ajuda dos alunos.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Título</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Como acessar as aulas gravadas"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="video_url">URL do Vídeo (YouTube) - Opcional</Label>
                                    <div className="relative">
                                        <Video className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="video_url"
                                            className="pl-9"
                                            value={formData.video_url}
                                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                            placeholder="https://youtube.com/watch?v=..."
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="content">Conteúdo / Descrição</Label>
                                    <Textarea
                                        id="content"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Digite o conteúdo do tutorial ou descrição do vídeo..."
                                        className="h-32"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                                    {editingItem ? "Salvar Alterações" : "Criar Item"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="shadow-soft">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Título</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Conteúdo</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Nenhum item encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                        {item.title}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        {item.video_url ? (
                                                            <span className="flex items-center gap-1 text-blue-500 font-medium">
                                                                <Video className="h-3 w-3" /> Vídeo
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-slate-500 font-medium">
                                                                <FileText className="h-3 w-3" /> Texto
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[300px]">
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {item.content || "Sem descrição"}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(item)}>
                                                                <Edit className="h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            {item.video_url && (
                                                                <DropdownMenuItem className="gap-2" asChild>
                                                                    <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="h-4 w-4" />
                                                                        Abrir Vídeo
                                                                    </a>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="gap-2 text-destructive"
                                                                onClick={() => {
                                                                    if (window.confirm("Deseja realmente excluir este item?")) {
                                                                        deleteMutation.mutate(item.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
