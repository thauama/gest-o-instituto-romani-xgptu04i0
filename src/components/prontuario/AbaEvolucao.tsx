import { useEffect, useState } from 'react'
import { ClipboardPaste, Loader2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { prontuarioService } from '@/services/clinic'
import type { Cliente, EvolucaoPaciente } from '@/types/clinic'
import { useToast } from '@/hooks/use-toast'

interface Props {
  paciente: Cliente
  versao: number
  autor?: string
}

export default function AbaEvolucao({ paciente, versao, autor }: Props) {
  const { toast } = useToast()
  const [evolucoes, setEvolucoes] = useState<EvolucaoPaciente[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [data, setData] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [transcricao, setTranscricao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = () => {
    setLoading(true)
    prontuarioService
      .listarEvolucao(paciente.id)
      .then(setEvolucoes)
      .catch((err) => {
        console.error('Erro ao carregar evoluções:', err)
        toast({ title: 'Erro ao carregar evoluções', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [paciente.id, versao])

  const abrirColar = () => {
    setData(new Date().toISOString().slice(0, 10))
    setTitulo('Evolução — transcrição Plaud')
    setDescricao('')
    setTranscricao('')
    setOpen(true)
  }

  const salvar = async () => {
    try {
      setSalvando(true)
      await prontuarioService.criarEvolucao({
        paciente: paciente.id,
        data,
        titulo,
        descricao: descricao || undefined,
        transcricao,
        autor,
      })
      toast({ title: 'Transcrição do Plaud salva na evolução' })
      setOpen(false)
      carregar()
    } catch (err) {
      console.error('Erro ao salvar transcrição:', err)
      toast({ title: 'Erro ao salvar transcrição', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (e: EvolucaoPaciente) => {
    if (!confirm('Excluir esta evolução?')) return
    try {
      await prontuarioService.excluirEvolucao(e.id, paciente.id)
      toast({ title: 'Evolução excluída' })
      carregar()
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Evoluções do paciente — cole aqui a transcrição gerada pelo app Plaud (a integração
          automática com o aparelho não está disponível nesta plataforma).
        </p>
        <Button size="sm" onClick={abrirColar} className="text-xs">
          <ClipboardPaste className="h-3.5 w-3.5 mr-1" /> Colar transcrição do Plaud
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </div>
      ) : evolucoes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Nenhuma evolução registrada para este paciente.
          </CardContent>
        </Card>
      ) : (
        evolucoes.map((e) => (
          <Card key={e.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {e.titulo || 'Evolução'}
                  {e.transcricao && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-blue-50 text-blue-700 border-blue-300"
                    >
                      Transcrição Plaud
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-[11px] text-slate-500">
                  {e.data ? new Date(`${e.data}T12:00:00`).toLocaleDateString('pt-BR') : '—'}
                  {e.autor ? ` · por ${e.autor}` : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-600"
                onClick={() => excluir(e)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {e.descricao && (
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{e.descricao}</p>
              )}
              {e.transcricao && (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Transcrição
                  </p>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{e.transcricao}</p>
                </div>
              )}
              {!e.descricao && !e.transcricao && <p className="text-sm text-slate-500">—</p>}
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog colar transcrição do Plaud */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Colar transcrição do Plaud</DialogTitle>
            <DialogDescription>
              Abra o app Plaud, copie a transcrição da consulta e cole abaixo — ela fica vinculada
              ao prontuário de {paciente.nome}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label htmlFor="evolucao-data">Data da consulta</Label>
              <Input
                id="evolucao-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="evolucao-titulo">Título</Label>
              <Input
                id="evolucao-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Evolução — retorno"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="evolucao-descricao">Observações (opcional)</Label>
              <Textarea
                id="evolucao-descricao"
                rows={2}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Resumo, impressões clínicas…"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="evolucao-transcricao">Transcrição do Plaud</Label>
              <Textarea
                id="evolucao-transcricao"
                rows={10}
                value={transcricao}
                onChange={(e) => setTranscricao(e.target.value)}
                placeholder="Cole aqui o texto da transcrição…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando || !data || !transcricao.trim()}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
