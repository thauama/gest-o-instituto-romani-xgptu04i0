import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Send,
  Sparkles,
  User,
  HelpCircle,
  Stethoscope,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatIA() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá, ${
        user?.name || 'Dr. Pedro Ivo'
      }! Sou o assistente inteligente de gestão da clínica Instituto Romani.\n\nPosso te ajudar com dúvidas como:\n• Quais contratos têm mais de 1 ano ou procedimentos pendentes?\n• Quais itens de estoque estão em falta ou abaixo do mínimo?\n• Qual o lucro líquido e receitas apuradas no mês?\n• Como está a taxa de aprovação de orçamentos e a agenda de consultas?\n\nComo posso ajudar você agora?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
        body: JSON.stringify({
          message: userText,
          conversation_id: conversationId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao consultar assistente de IA.')
      }

      if (data.conversation_id) {
        setConversationId(data.conversation_id)
      }

      const assistantMsg: Message = {
        id: data.message_id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      console.error('Erro na IA:', err)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Desculpe, ocorreu um imprevisto ao processar sua pergunta: ${err.message}. Por favor, verifique se está conectado ao sistema e tente novamente.`,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const promptSuggestions = [
    'Quais contratos precisam de alerta por terem mais de 1 ano?',
    'Quais produtos do estoque estão com quantidade crítica?',
    'Resumo financeiro: quanto tivemos de receita e lucro este mês?',
    'Quantos orçamentos temos emitidos e aprovados?',
  ]

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Assistente de Gestão Romani</h1>
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                IA Nativa da Plataforma
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Pergunte sobre pacientes, estoque, contratos, consultas e métricas financeiras.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setConversationId(null)
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content: `Conversa reiniciada. Em que posso te orientar agora sobre a gestão do Instituto Romani?`,
              },
            ])
          }}
          className="text-xs text-slate-500 h-8"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Nova Conversa
        </Button>
      </div>

      {/* Chat Messages Body */}
      <Card className="flex-1 overflow-hidden border-slate-200 shadow-sm flex flex-col bg-white">
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm whitespace-pre-wrap'
                  }`}
                >
                  {m.content}
                </div>
                {isUser && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700 font-bold shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-500 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold animate-pulse">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] ml-1 text-slate-500">
                  Consultando base clínica do Instituto Romani...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Prompt Suggestions */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 overflow-x-auto flex gap-2 no-scrollbar">
          {promptSuggestions.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPrompt(p)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-900 transition-colors shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="Digite sua dúvida clínica ou gerencial..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="text-xs h-10"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 h-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
