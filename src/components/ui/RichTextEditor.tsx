import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Smile, Bold, Italic, Strikethrough, Code } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    label?: string;
}

const EMOJIS = ["🙂", "😊", "🚀", "✅", "❌", "⚠️", "📅", "🕒", "📞", "🇧🇷", "📚", "✏️", "🙏", "👍", "👋", "🔥", "💡", "💰", "🎉", "❤️"];

export function RichTextEditor({ value, onChange, disabled, placeholder, className, label }: RichTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Helper to insert text at cursor position
    const insertText = (textToInsert: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const previousValue = textarea.value;

        // Insert text
        const newValue = previousValue.substring(0, start) + textToInsert + previousValue.substring(end);

        onChange(newValue);

        // Restore focus and move cursor
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        }, 0);
    };

    // Helper to wrap selected text
    const wrapText = (wrapper: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const previousValue = textarea.value;
        const selectedText = previousValue.substring(start, end);

        if (!selectedText) {
            // If no selection, just insert the wrapper (e.g. **cursor**)
            const textToInsert = `${wrapper}${wrapper}`;
            const newValue = previousValue.substring(0, start) + textToInsert + previousValue.substring(end);
            onChange(newValue);
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + wrapper.length, start + wrapper.length);
            }, 0);
            return;
        }

        const newValue = previousValue.substring(0, start) + `${wrapper}${selectedText}${wrapper}` + previousValue.substring(end);
        onChange(newValue);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(end + (wrapper.length * 2), end + (wrapper.length * 2));
        }, 0);
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && <Label>{label}</Label>}

            <div className="border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all">
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
                    <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8"
                        onClick={() => wrapText("*")}
                        title="Negrito (*texto*)"
                        type="button"
                        disabled={disabled}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8"
                        onClick={() => wrapText("_")}
                        title="Itálico (_texto_)"
                        type="button"
                        disabled={disabled}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8"
                        onClick={() => wrapText("~")}
                        title="Tachado (~texto~)"
                        type="button"
                        disabled={disabled}
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8"
                        onClick={() => wrapText("```")}
                        title="Monoespaçado (```texto```)"
                        type="button"
                        disabled={disabled}
                    >
                        <Code className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-4 bg-border mx-1" />

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" type="button" disabled={disabled}>
                                <Smile className="h-4 w-4 text-yellow-600" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="start">
                            <div className="grid grid-cols-5 gap-1">
                                {EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded text-lg transition-colors"
                                        onClick={() => insertText(emoji)}
                                        type="button"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Text Area */}
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="border-0 focus-visible:ring-0 rounded-t-none resize-none min-h-[120px] shadow-none"
                    disabled={disabled}
                />
            </div>

            {/* Helper Text */}
            <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Use os botões para formatar. O WhatsApp reconhecerá os símbolos.</span>
                <span>{value.length} caracteres</span>
            </div>
        </div>
    );
}
