import { useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { studentsService, Student } from "@/services/studentsService";
import { classesService } from "@/services/classesService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, PauseCircle, PlayCircle, StopCircle, RefreshCw, MessageSquare, Search, Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function AdminComunicados() {
    const { toast } = useToast();
    const [message, setMessage] = useState("");
    const [selectedAudience, setSelectedAudience] = useState("all"); // 'all', 'class', 'status', 'individual'
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);

    // Sending State
    const [isSending, setIsSending] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [sentCount, setSentCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [currentStudent, setCurrentStudent] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // Batch Pause Configuration
    const [batchSize, setBatchSize] = useState(20);
    const [pauseDuration, setPauseDuration] = useState(5);
    const [pauseUnit, setPauseUnit] = useState<"seconds" | "minutes">("minutes");
    const [isBatchPaused, setIsBatchPaused] = useState(false);
    const [batchPauseTimer, setBatchPauseTimer] = useState(0);

    // Advanced Configuration
    const [delaySeconds, setDelaySeconds] = useState(15); // Default 15s
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
    const [isScheduling, setIsScheduling] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Refs for controlling the loop
    const shouldStopRef = useRef(false);
    const isPausedRef = useRef(false);

    // Fetch Students
    const { data: students = [], isLoading: isLoadingStudents } = useQuery({
        queryKey: ["students-for-messaging"],
        queryFn: studentsService.getStudents,
    });

    // Fetch Classes
    const { data: classes = [] } = useQuery({
        queryKey: ["classes-for-filter"],
        queryFn: classesService.getClasses,
    });

    // Valid Students Filter
    const targetStudents = students.filter(student => {
        // Must have phone and be active (optional condition, maybe 'ativo' only)
        const hasPhone = student.phone && student.phone.length > 8;
        const isActive = student.status === 'ativo';
        const isPending = student.status === 'pendente';

        if (!hasPhone) return false;

        if (selectedAudience === 'all') return isActive;
        if (selectedAudience === 'pending') return isPending;
        if (selectedAudience === 'class') return isActive && student.class_name === selectedClassId;
        if (selectedAudience === 'individual') return student.id === selectedStudentId;

        return false;
    });

    // Actually, looking at studentsService, it stores `class_name`. classesService likely returns objects with `name`.

    useEffect(() => {
        if (selectedAudience === 'pending' && !message) {
            setMessage(
                "Graça e Paz, {nome}! 👋\n\n" +
                "Passando para lembrar que sua matrícula no {curso} da Escola do Reino ainda consta como pendente de pagamento.\n\n" +
                "📖 Assim que o pagamento for confirmado pelo sistema, você receberá automaticamente seus dados de acesso ao Portal do Aluno, por aqui e também por e-mail.\n\n" +
                "Caso já tenha realizado o pagamento, pode desconsiderar esta mensagem.\n" +
                "Se precisar de ajuda ou tiver alguma dúvida, estamos à disposição para te auxiliar.\n\n" +
                "Que Deus abençoe sua caminhada de aprendizado e chamado. 🙏\n" +
                "Mensagem automática – Escola do Reino"
            );
        }
    }, [selectedAudience]);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleStartSending = async () => {
        if (!message.trim()) {
            toast({ title: "Erro", description: "Escreva uma mensagem para enviar.", variant: "destructive" });
            return;
        }

        if (targetStudents.length === 0) {
            toast({ title: "Erro", description: "Nenhum aluno encontrado com este filtro.", variant: "destructive" });
            return;
        }

        // Handle Scheduling
        if (isScheduling) {
            if (!scheduleDate) {
                toast({ title: "Erro", description: "Selecione uma data e hora para agendar.", variant: "destructive" });
                return;
            }
            if (!confirm(`Confirmar agendamento para ${format(scheduleDate, "PPP 'às' HH:mm", { locale: ptBR })} para ${targetStudents.length} alunos?`)) {
                return;
            }

            // Logic for scheduling (DB insertion)
            setIsSending(true);
            setProgress(0);
            setLogs([]);
            addLog(`📅 Iniciando agendamento para ${format(scheduleDate, "dd/MM/yyyy HH:mm")}...`);

            try {
                // 1. Create Campaign
                const { data: campaign, error: campaignError } = await supabase
                    .from('communication_campaigns')
                    .insert({
                        title: `Disparo ${format(new Date(), "dd/MM HH:mm")}`,
                        message: message,
                        target_audience: selectedAudience,
                        target_filter: selectedAudience === 'class' ? selectedClassId : (selectedAudience === 'individual' ? selectedStudentId : null),
                        status: 'scheduled',
                        created_by: (await supabase.auth.getUser()).data.user?.id
                    })
                    .select()
                    .single();

                if (campaignError) throw campaignError;
                addLog(`✅ Campanha criada: ${campaign.id}`);

                // 2. Prepare Queue Items
                const queueItems = targetStudents.map(student => ({
                    campaign_id: campaign.id,
                    student_name: student.name,
                    phone: student.phone?.replace(/\D/g, "") || "",
                    message_body: message.replace(/{nome}/g, student.name.split(" ")[0]).replace(/{name}/g, student.name.split(" ")[0]).replace(/{curso}/g, student.class_name || "curso"),
                    status: 'scheduled',
                    scheduled_for: scheduleDate.toISOString()
                }));

                // 3. Insert Queue (Batched)
                const batchSize = 100;
                for (let i = 0; i < queueItems.length; i += batchSize) {
                    const batch = queueItems.slice(i, i + batchSize);
                    const { error: queueError } = await supabase
                        .from('communication_queue')
                        .insert(batch);

                    if (queueError) throw queueError;

                    const currentProgress = Math.round(((i + batch.length) / queueItems.length) * 100);
                    setProgress(currentProgress);
                    addLog(`📥 Agendados ${Math.min(i + batch.length, queueItems.length)}/${queueItems.length} mensagens...`);
                }

                addLog(`✨ Agendamento concluído com sucesso!`);
                toast({ title: "Agendado!", description: `${queueItems.length} mensagens agendadas para ${format(scheduleDate, "dd/MM HH:mm")}.` });

                // 4. If scheduled for very soon, we rely on the Cron Job (every minute)
                // Removed explicit invocation to prevent Permisson/CORS issues causing false negatives.

            } catch (error: any) {
                console.error(error);
                addLog(`❌ Erro no agendamento: ${error.message}`);
                toast({ title: "Erro", description: "Falha ao agendar mensagens.", variant: "destructive" });
            } finally {
                setIsSending(false);
            }
            return;
        }

        if (!confirm(`Tem certeza que deseja enviar agora para ${targetStudents.length} alunos? O intervalo será de ~${delaySeconds}s.`)) {
            return;
        }

        setIsSending(true);
        setIsPaused(false);
        shouldStopRef.current = false;
        isPausedRef.current = false;
        setSentCount(0);
        setErrorCount(0);
        setProgress(0);
        setLogs([]);
        setIsBatchPaused(false);
        setBatchPauseTimer(0);

        for (let i = 0; i < targetStudents.length; i++) {
            // Check Batch Pause
            if (i > 0 && i % batchSize === 0) {
                setIsBatchPaused(true);
                const totalSeconds = pauseUnit === "minutes" ? pauseDuration * 60 : pauseDuration;
                setBatchPauseTimer(totalSeconds);

                addLog(`🛡️ Pausa de segurança iniciada: ${pauseDuration} ${pauseUnit === "minutes" ? "minutos" : "segundos"}.`);

                // Countdown loop
                for (let seconds = totalSeconds; seconds > 0; seconds--) {
                    if (shouldStopRef.current) break;
                    setBatchPauseTimer(seconds);
                    await delay(1000);
                }

                setIsBatchPaused(false);
                setBatchPauseTimer(0);
                if (shouldStopRef.current) break;
                addLog("🚀 Pausa finalizada. Retomando envios...");
            }

            // Check Stop
            if (shouldStopRef.current) {
                addLog("🛑 Envio interrompido pelo usuário.");
                break;
            }

            // Check Pause (Spinlockish)
            while (isPausedRef.current) {
                if (shouldStopRef.current) break;
                await delay(1000);
            }

            const student = targetStudents[i];
            setCurrentStudent(student.name);

            try {
                // Prepare Phone (basic clean again just to be safe, though Function does it too)
                const cleanPhone = student.phone?.replace(/\D/g, "") || "";

                // Construct Message
                const firstName = student.name.split(" ")[0];
                const finalMessage = message.replace(/{nome}/g, firstName).replace(/{name}/g, firstName).replace(/{curso}/g, student.class_name || "curso");

                addLog(`📤 Enviando para ${student.name} (${i + 1}/${targetStudents.length})...`);

                const { data, error } = await supabase.functions.invoke("send-whatsapp", {
                    body: {
                        phone: cleanPhone,
                        message: finalMessage,
                    },
                });

                if (error) throw error;
                if (data && !data.success) throw new Error(data.error);

                setSentCount(prev => prev + 1);
                addLog(`✅ Sucesso: ${student.name}`);

            } catch (err: any) {
                console.error(err);
                setErrorCount(prev => prev + 1);
                addLog(`❌ Erro ${student.name}: ${err.message || "Falha desconhecida"}`);
            }

            // Update Progress
            const newProgress = Math.round(((i + 1) / targetStudents.length) * 100);
            setProgress(newProgress);

            // Rate Limit Delay
            if (i < targetStudents.length - 1) { // Don't wait after last one
                // Use selected delay as base, add random 20% variance
                const baseDelay = delaySeconds * 1000;
                const variance = Math.floor(Math.random() * (baseDelay * 0.2));
                const waitTime = baseDelay + variance;

                addLog(`⏳ Aguardando ~${Math.round(waitTime / 1000)}s (Config: ${delaySeconds}s)...`);
                await delay(waitTime);
            }
        }

        setIsSending(false);
        setCurrentStudent(null);
        toast({ title: "Envio finalizado!", description: `Sucessos: ${sentCount}. Erros: ${errorCount}.` });
    };

    const handleStop = () => {
        shouldStopRef.current = true;
        setIsSending(false); // UI update immediately
    };

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current;
        setIsPaused(isPausedRef.current);
        addLog(isPausedRef.current ? "⏸️ Envio pausado." : "▶️ Envio retomado.");
    };

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev]); // Newest first
    };

    return (
        <AdminLayout title="Disparo WhatsApp" description="Envie mensagens em massa para seus alunos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">

                {/* Left Column: Configuration */}
                <div className="space-y-6 flex flex-col">
                    <Card className="flex-1 shadow-soft flex flex-col">
                        <CardHeader>
                            <CardTitle>Configuração do Envio</CardTitle>
                            <CardDescription>Selecione o público e escreva a mensagem.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 flex flex-col">

                            {/* Filters */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Público Alvo</Label>
                                    <Select value={selectedAudience} onValueChange={setSelectedAudience} disabled={isSending}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Alunos Ativos</SelectItem>
                                            <SelectItem value="pending">Alunos Pendentes</SelectItem>
                                            <SelectItem value="class">Por Turma</SelectItem>
                                            <SelectItem value="individual">Aluno Individual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedAudience === 'class' && (
                                    <div className="space-y-2">
                                        <Label>Selecione a Turma</Label>
                                        <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isSending}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Escolha a turma" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map((cls: any) => (
                                                    <SelectItem key={cls.id} value={cls.title || cls.name || ""}>
                                                        {cls.title || cls.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedAudience === 'individual' && (
                                    <div className="space-y-2">
                                        <Label>Buscar Aluno</Label>
                                        <Popover open={isStudentSelectOpen} onOpenChange={setIsStudentSelectOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={isStudentSelectOpen}
                                                    className="w-full justify-between"
                                                    disabled={isSending}
                                                >
                                                    {selectedStudentId
                                                        ? students.find((student) => student.id === selectedStudentId)?.name
                                                        : "Selecionar aluno..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Buscar por nome..." />
                                                    <CommandList>
                                                        <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                                                        <CommandGroup>
                                                            {students.map((student) => (
                                                                <CommandItem
                                                                    key={student.id}
                                                                    value={student.name}
                                                                    onSelect={() => {
                                                                        setSelectedStudentId(student.id);
                                                                        setIsStudentSelectOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedStudentId === student.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span>{student.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{student.class_name || "Sem turma"}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                            </div>

                            {/* Audience Summary */}
                            <div className="bg-muted/30 p-3 rounded-lg flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Destinatários estimados:</span>
                                <Badge variant="secondary" className="text-base px-3">
                                    {isLoadingStudents ? <Loader2 className="h-3 w-3 animate-spin" /> : targetStudents.length} alunos
                                </Badge>
                            </div>

                            {/* Advanced Configuration: Delay & Scheduling */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-4 border p-3 rounded-md bg-muted/10">
                                    <div className="flex justify-between items-center">
                                        <Label>Intervalo entre Envios</Label>
                                        <Badge variant="outline" className="font-mono text-xs">{delaySeconds} segundos</Badge>
                                    </div>
                                    <Slider
                                        value={[delaySeconds]}
                                        onValueChange={(val) => setDelaySeconds(val[0])}
                                        max={60}
                                        min={2}
                                        step={1}
                                        disabled={isSending}
                                        className="py-2"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Tempo de espera entre cada mensagem para segurança do número.
                                    </p>
                                </div>

                            </div>

                            {/* Flow Configuration: Batch & Pause */}
                            <div className="col-span-1 md:col-span-2 space-y-4 border p-4 rounded-md bg-primary/5 border-primary/10">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold flex items-center gap-2">
                                        <PauseCircle className="h-4 w-4 text-primary" />
                                        Pausa Automática por Lote
                                    </Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[10px] h-7 bg-primary/10 text-primary hover:bg-primary/20"
                                        onClick={() => {
                                            setDelaySeconds(30);
                                            setBatchSize(25);
                                            setPauseDuration(5);
                                            setPauseUnit("minutes");
                                            toast({ title: "Modo Seguro Ativado", description: "Configurações recomendadas aplicadas." });
                                        }}
                                        disabled={isSending}
                                    >
                                        Modo Seguro (Recomendado)
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Tamanho do Lote</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={batchSize}
                                                onChange={(e) => setBatchSize(Number(e.target.value))}
                                                min={1}
                                                disabled={isSending}
                                                className="h-8"
                                            />
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">envios</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">Duração da Pausa</Label>
                                        <Input
                                            type="number"
                                            value={pauseDuration}
                                            onChange={(e) => setPauseDuration(Number(e.target.value))}
                                            min={1}
                                            disabled={isSending}
                                            className="h-8"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">Unidade</Label>
                                        <Select value={pauseUnit} onValueChange={(val: any) => setPauseUnit(val)} disabled={isSending}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="seconds">Segundos</SelectItem>
                                                <SelectItem value="minutes">Minutos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    O sistema irá pausar o envio automaticamente após cada lote para evitar detecção de SPAM.
                                </p>
                            </div>


                            <div className="space-y-2 flex-1 flex flex-col">
                                <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                                    <span>Variáveis: <code className="bg-muted px-1 rounded">{`{nome}`}</code>, <code className="bg-muted px-1 rounded">{`{curso}`}</code></span>
                                </div>
                                <RichTextEditor
                                    value={message}
                                    onChange={setMessage}
                                    placeholder="Olá {nome}, temos um comunicado importante..."
                                    className="flex-1"
                                    disabled={isSending}
                                    label="Mensagem"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex gap-3">
                                {!isSending ? (
                                    <Button onClick={handleStartSending} className={`w-full text-white shadow-lg ${isScheduling ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`} size="lg" disabled={targetStudents.length === 0}>
                                        {isScheduling ? <><Clock className="mr-2 h-4 w-4" /> Agendar Disparo</> : <><Send className="mr-2 h-4 w-4" /> Iniciar Disparo</>}
                                    </Button>
                                ) : (
                                    <>
                                        <Button onClick={togglePause} variant="outline" className="flex-1">
                                            {isPaused ? <><PlayCircle className="mr-2 h-4 w-4" /> Retomar</> : <><PauseCircle className="mr-2 h-4 w-4" /> Pausar</>}
                                        </Button>
                                        <Button onClick={handleStop} variant="destructive" className="flex-1">
                                            <StopCircle className="mr-2 h-4 w-4" /> Parar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Monitoring */}
                <div className="space-y-6 flex flex-col h-full">
                    <Card className="h-full shadow-soft flex flex-col border-none bg-muted/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Monitoramento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-6">

                            {/* Progress Status */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Progresso Total</span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-3 w-full transition-all" />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>Enviados: <span className="text-green-600 font-bold">{sentCount}</span></span>
                                    <span>Erros: <span className="text-red-500 font-bold">{errorCount}</span></span>
                                    <span>Restantes: {targetStudents.length - (sentCount + errorCount)}</span>
                                </div>
                            </div>

                            {/* Current Action */}
                            <div className="bg-background border rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Status Atual</h4>
                                {isSending ? (
                                    <div className="flex items-center gap-3">
                                        {isPaused ? (
                                            <PauseCircle className="h-8 w-8 text-yellow-500 animate-pulse" />
                                        ) : (
                                            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {isBatchPaused
                                                    ? `Pausa de segurança ativa: Retomando em ${Math.floor(batchPauseTimer / 60).toString().padStart(2, '0')}:${(batchPauseTimer % 60).toString().padStart(2, '0')}`
                                                    : isPaused ? "Envio Pausado" : (currentStudent ? `Enviando para ${currentStudent}...` : "Aguardando intervalo...")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {isBatchPaused
                                                    ? "Aguarde o tempo de segurança terminar para continuar"
                                                    : isPaused ? "Clique em Retomar para continuar" : "Mantenha esta janela aberta"}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <StopCircle className="h-4 w-4" /> O sistema está pronto para iniciar.
                                    </p>
                                )}
                            </div>

                            {/* Logs Console */}
                            <div className="flex-1 flex flex-col min-h-0 bg-black/90 text-green-400 font-mono text-xs rounded-lg overflow-hidden border border-border/50 shadow-inner">
                                <div className="p-2 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                    <span>Console de Execução</span>
                                    <Badge variant="outline" className="text-[10px] h-4 border-green-500/30 text-green-500">Live</Badge>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                                    {logs.length === 0 && <span className="text-white/30 italic">Aguardando início...</span>}
                                    {logs.map((log, i) => (
                                        <div key={i} className="break-words opacity-90 hover:opacity-100 transition-opacity">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
