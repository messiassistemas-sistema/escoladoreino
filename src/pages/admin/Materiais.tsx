import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  FileText,
  Video,
  Presentation,
  Upload,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { materialsService, Material } from "@/services/materialsService";
import { subjectsService } from "@/services/subjectsService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";



export default function AdminMateriais() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subject_name: "",
    type: "pdf" as "pdf" | "pptx" | "video" | "link",
    file_size: "",
    file_url: "",
    author_name: user?.user_metadata?.name || "Admin",
  });

  const { data: materiais = [], isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: materialsService.getMaterials,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsService.getSubjects,
  });

  useEffect(() => {
    if (editingMaterial) {
      setFormData({
        title: editingMaterial.title,
        subject_name: editingMaterial.subject_name,
        type: editingMaterial.type,
        file_size: editingMaterial.file_size || "",
        file_url: editingMaterial.file_url,
        author_name: editingMaterial.author_name,
      });
    } else {
      setFormData({
        title: "",
        subject_name: "",
        type: "pdf",
        file_size: "",
        file_url: "",
        author_name: user?.user_metadata?.name || "Admin",
      });
    }
  }, [editingMaterial, user]);

  const createMutation = useMutation({
    mutationFn: materialsService.createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setIsDialogOpen(false);
      toast({ title: "Material cadastrado com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao cadastrar material:", error);
      toast({
        title: "Erro ao cadastrar material",
        description: "Verifique se a tabela 'materials' existe.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Material> }) =>
      materialsService.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setIsDialogOpen(false);
      setEditingMaterial(null);
      toast({ title: "Material atualizado com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao atualizar material:", error);
      toast({
        title: "Erro ao atualizar material",
        description: "Ocorreu um problema ao salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: materialsService.deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast({ title: "Material excluído com sucesso!" });
    },
  });

  const handleSave = () => {
    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredMateriais = materiais.filter(
    (mat) =>
      mat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (material: Material) => {
    try {
      await materialsService.incrementDownloads(material.id);
      window.open(material.file_url, '_blank');
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    } catch (error) {
      console.error("Erro ao incrementar downloads:", error);
      window.open(material.file_url, '_blank');
    }
  };


  return (
    <AdminLayout title="Materiais" description="Gerencie os materiais didáticos">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-display text-2xl font-bold">{materiais.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">PDFs</p>
              <p className="font-display text-2xl font-bold text-destructive">
                {materiais.filter((m) => m.type === "pdf").length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Slides</p>
              <p className="font-display text-2xl font-bold text-orange-500">
                {materiais.filter((m) => m.type === "pptx").length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Downloads</p>
              <p className="font-display text-2xl font-bold text-primary">
                {materiais.reduce((acc, m) => acc + (m.downloads_count || 0), 0)}
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar materiais..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Enviar Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingMaterial ? "Editar Material" : "Enviar Material"}
                </DialogTitle>
                <DialogDescription>
                  {editingMaterial ? "Altere os dados do material." : "Faça upload de um novo material didático."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Apostila Completa"
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Disciplina</Label>
                  <Select
                    value={formData.subject_name}
                    onValueChange={(val) => setFormData(p => ({ ...p, subject_name: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL do Arquivo / Vídeo</Label>
                  <Input
                    id="url"
                    placeholder="https://..."
                    value={formData.file_url}
                    onChange={(e) => setFormData(p => ({ ...p, file_url: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(val: any) => setFormData(p => ({ ...p, type: val }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="pptx">Slides (PPTX)</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="link">Outro Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="size">Tamanho (Ex: 2.4 MB)</Label>
                    <Input
                      id="size"
                      placeholder="Optional"
                      value={formData.file_size}
                      onChange={(e) => setFormData(p => ({ ...p, file_size: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingMaterial(null);
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingMaterial ? "Salvar" : "Enviar"}
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
                    <TableHead>Material</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead className="text-center">Downloads</TableHead>
                    <TableHead className="text-center">Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMateriais.map((mat) => (
                    <TableRow key={mat.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            {mat.type === 'pdf' ? <FileText className="h-5 w-5" /> :
                              mat.type === 'pptx' ? <Presentation className="h-5 w-5" /> :
                                mat.type === 'video' ? <Video className="h-5 w-5" /> :
                                  <Download className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium">{mat.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {mat.file_size || "Link"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{mat.subject_name}</TableCell>
                      <TableCell>{mat.author_name}</TableCell>
                      <TableCell className="text-center">{mat.downloads_count}</TableCell>
                      <TableCell className="text-center">
                        {new Date(mat.created_at).toLocaleDateString("pt-BR")}
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
                              onClick={() => handleDownload(mat)}
                            >
                              <Download className="h-4 w-4" />
                              Abrir / Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => {
                                setEditingMaterial(mat);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => {
                                if (window.confirm("Deseja realmente excluir este material?")) {
                                  deleteMutation.mutate(mat.id);
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
