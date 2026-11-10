import React, { useEffect, useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { financeiroService } from '@/services/clinic'
import type { RegistroFinanceiro } from '@/types/clinic'

interface Props {
  registro: RegistroFinanceiro | null
  open: boolean
  onClose: () => void
  onSolicitada: (id: string, email: string) => void
}

export default function DialogoNotaFiscal({ registro, open, onClose, onSolicitada }: Props) {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (registro) {
      setEmail(registro.nf_email_destinatario || 'financeiro@institutoromani.com.br')
    }
  }, [registro])

  const solicitar = async () => {
    if (!registro || !email.trim()) {
      toast({ title: 'Informe o e-mail do destinatário', variant: 'destructive' })
      return
    }
    setEnviando(true)
    try {
      const data = await financeiroService.solicitarNf(registro.id, email.trim())
      toast({ title: 'Nota fiscal solicitada', description: data?.message || 'E-mail enviado' })
      onSolicitada(registro.id, email.trim())
      onClose()
    } catch (err) {
      toast({
        title: 'Erro ao solicitar NF',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setEnviando(false)
    }
  }

  if (!registro) return null

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Solicitar Nota Fiscal</DialogTitle>
          <DialogDescription className="text-slate-300">
            {registro.descricao} —{' '}
            <span className="font-semibold text-emerald-300">
              R${' '}
              {(Number(registro.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nf-email" className="text-slate-300">
              E-mail do destinatário (contabilidade)
            </Label>
            <Input
              id="nf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="financeiro@institutoromani.com.br"
              className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={solicitar}
              disabled={enviando || registro.nf_solicitada}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-1" />
                  {registro.nf_solicitada ? 'NF já solicitada' : 'Solicitar NF'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
