"use client";

import React, { useState, useRef, useEffect } from "react";
import { useFloorPlanStore } from "@/store/useFloorPlanStore";
import { SendHorizontal, Loader2, Sparkles, Building2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const AI_MODELS = [
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    { value: "claude-sonnet-4-6", label: "Claude 4.6 Sonnet" },
];

export default function DesignAssistant() {
    const { messages, generatePlan, isLoading, clearChat } = useFloorPlanStore();
    const [prompt, setPrompt] = useState("");
    const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].value);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        const currentPrompt = prompt;
        setPrompt("");
        await generatePlan(currentPrompt, selectedModel);
    };

    return (
        <Card className="flex flex-col h-full border-l rounded-none border-y-0 border-r-0 bg-black">
            <CardHeader className="py-3 px-5 border-b bg-black flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-base font-medium tracking-tight">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Archion AI
                </CardTitle>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={clearChat}
                        disabled={isLoading || messages.length === 0}
                        title="New Chat"
                        className="h-8 w-8 border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
                        <SelectTrigger className="w-[180px] h-8 text-xs bg-muted/20 border-border/50">
                            <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                            {AI_MODELS.map((model) => (
                                <SelectItem key={model.value} value={model.value} className="text-xs">
                                    {model.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4 pr-4">
                    {/* Welcome Message */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-5 text-center text-muted-foreground mt-8 px-2 space-y-2">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">Welcome to Archion AI</p>
                                <p className="text-xs opacity-75">
                                    Describe your floor plan or select a prompt below.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 w-full mt-2">
                                {[
                                    "Create a 120m² apartment with 3 bedrooms",
                                    "Add a walk-in closet to the master bedroom",
                                    "Add a balcony to the main bedroom",
                                    "Make the living room open plan with kitchen",
                                    "Increase bathroom size to include a bathtub"
                                ].map((p, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        className="w-full justify-start text-xs font-normal h-auto py-2.5 px-3 bg-muted/20 border-border/50 hover:bg-muted/50 text-left whitespace-normal leading-snug"
                                        onClick={() => generatePlan(p, selectedModel)}
                                    >
                                        {p}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chat History */}
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-muted text-foreground rounded-tl-sm"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex w-full justify-start">
                            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-muted text-foreground rounded-tl-sm shadow-sm flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span className="opacity-80">Generating architectural intent...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <Separator />

            <CardFooter className="p-4 bg-black">
                <form onSubmit={handleSubmit} className="relative w-full flex items-center">
                    <Input
                        type="text"
                        placeholder="Describe your floor plan..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        className="w-full rounded-full bg-muted/20 border-border/50 pr-12 pl-5 h-12 text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        variant="secondary"
                        disabled={!prompt.trim() || isLoading}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-muted/80 text-foreground hover:bg-muted"
                    >
                        <SendHorizontal className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
