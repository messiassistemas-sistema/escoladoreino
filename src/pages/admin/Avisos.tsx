import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Pin,
  Bell,
  Eye,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsService, Announcement } from "@/services/announcementsService";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";



export default function AdminAvisos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "Toda a escola",
    type: "info" as "info" | "urgente" | "evento",
    pinned: false,
    author_name: user?.user_metadata?.name || "Admin",
  });

  const { data: avisos = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: announcementsService.getAnnouncements,
  });

  useEffect(() => {
    if (editingAnnouncement) {
      setFormData({
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        audience: editingAnnouncement.audience,
        type: editingAnnouncement.type,
        pinned: editingAnnouncement.pinned,
        author_name: editingAnnouncement.author_name,
      });
    } else {
      setFormData({
        title: "",
        content: "",
        audience: "Toda a escola",
        type: "info",
        pinned: false,
        author_name: user?.user_metadata?.name || "Admin",
      });
    }
  }, [editingAnnouncement, user]);

  const createMutation = useMutation({
    mutationFn: announcementsService.createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setIsDialogOpen(false);
      toast({ title: "Aviso publicado com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao criar aviso:", error);
      toast({
        title: "Erro ao publicar aviso",
        description: "Verifique se a tabela 'announcements' existe.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Announcement> }) =>
      announcementsService.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      toast({ title: "Aviso atualizado com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao atualizar aviso:", error);
      toast({
        title: "Erro ao atualizar aviso",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: announcementsService.deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Aviso excluído com sucesso!" });
    },
  });

  const handleSave = () => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredAvisos = avisos.filter(
    (aviso) =>
      aviso.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aviso.content.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <AdminLayout title="Avisos" description="Gerencie o mural de comunicados">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar avisos..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Aviso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingAnnouncement ? "Editar Aviso" : "Novo Aviso"}
                </DialogTitle>
                <DialogDescription>
                  {editingAnnouncement ? "Altere os dados do comunicado." : "Crie um novo comunicado para o mural."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Título do aviso"
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    placeholder="Escreva o conteúdo do aviso..."
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Audiência</Label>
                    <Input
                      placeholder="Ex: Toda a escola"
                      value={formData.audience}
                      onChange={(e) => setFormData(p => ({ ...p, audience: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(val: any) => setFormData(p => ({ ...p, type: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Informativo</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="evento">Evento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label>Fixar no topo</Label>
                    <p className="text-sm text-muted-foreground">
                      Este aviso aparecerá em destaque.
                    </p>
                  </div>
                  <Switch
                    checked={formData.pinned}
                    onCheckedChange={(val) => setFormData(p => ({ ...p, pinned: val }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingAnnouncement(null);
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingAnnouncement ? "Salvar" : "Publicar"}
                </Button>
              </DialogFooter>

            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-soft">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aviso</TableHead>
                    <TableHead>Audiência</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead className="text-center">Visualizações</TableHead>
                    <TableHead className="text-center">Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvisos.map((aviso) => (
                    <TableRow key={aviso.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${aviso.type === "urgente"
                              ? "bg-destructive/10"
                              : aviso.type === "evento"
                                ? "bg-secondary/20"
                                : "bg-primary/10"
                              }`}
                          >
                            <Bell
                              className={`h-5 w-5 ${aviso.type === "urgente"
                                ? "text-destructive"
                                : aviso.type === "evento"
                                  ? "text-secondary"
                                  : "text-primary"
                                }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{aviso.title}</p>
                              {aviso.pinned && (
                                <Pin className="h-3 w-3 text-secondary" />
                              )}
                            </div>
                            <p className="line-clamp-1 text-sm text-muted-foreground">
                              {aviso.content}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{aviso.audience}</Badge>
                      </TableCell>
                      <TableCell>{aviso.author_name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          {aviso.views}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(aviso.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => updateMutation.mutate({ id: aviso.id, data: { pinned: !aviso.pinned } })}
                            >
                              <Pin className="h-4 w-4" />
                              {aviso.pinned ? "Desafixar" : "Fixar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => {
                                setEditingAnnouncement(aviso);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => {
                                if (window.confirm("Deseja realmente excluir este aviso?")) {
                                  deleteMutation.mutate(aviso.id);
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
