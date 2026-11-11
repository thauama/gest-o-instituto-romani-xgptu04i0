import { useEffect, useState } from 'react'
import { FilePlus2, Plus, Printer, RotateCcw, Trash2, Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { prontuarioService } from '@/services/clinic'
import type {
  Cliente,
  DocumentoClinico,
  ModeloDocumento,
  TipoDocumentoClinico,
} from '@/types/clinic'
import { useToast } from '@/hooks/use-toast'

interface Props {
  paciente: Cliente
  versao: number
  autor?: string
}

const LABEL_TIPO: Record<TipoDocumentoClinico, string> = {
  prescricao: 'Prescrição',
  pedido_exame: 'Pedido de exame',
}

export default function AbaDocumentos({ paciente, versao, autor }: Props) {
  const { toast } = useToast()
  const [modelos, setModelos] = useState<ModeloDocumento[]>([])
  const [documentos, setDocumentos] = useState<DocumentoClinico[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoDocumentoClinico>('prescricao')
  const [modeloId, setModeloId] = useState<string>('')
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = () => {
    setLoading(true)
    Promise.all([
      prontuarioService.listarModelosDocumentos(),
      prontuarioService.listarDocumentos(paciente.id),
    ])
      .then(([ms, ds]) => {
        setModelos(ms)
        setDocumentos(ds)
      })
      .catch((err) => {
        console.error('Erro ao carregar documentos:', err)
        toast({ title: 'Erro ao carregar documentos', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [paciente.id, versao])

  const [reemitindoDe, setReemitindoDe] = useState<string | null>(null)

  const abrirNovo = (tipoInicial: TipoDocumentoClinico = 'prescricao') => {
    setTipo(tipoInicial)
    setModeloId('')
    setTitulo('')
    setConteudo('')
    setReemitindoDe(null)
    setOpen(true)
  }

  /** Reemissão: abre o formulário preenchido com o documento original (mantém o histórico). */
  const reemitir = (d: DocumentoClinico) => {
    setTipo(d.tipo)
    setModeloId(d.modelo || '')
    setTitulo(`${d.titulo} (reemissão)`)
    setConteudo(d.conteudo)
    setReemitindoDe(d.id)
    setOpen(true)
  }

  const aplicarModelo = (id: string) => {
    setModeloId(id)
    const m = modelos.find((x) => x.id === id)
    if (m) {
      setTipo(m.tipo)
      setTitulo(m.nome.replace('{paciente}', paciente.nome))
      setConteudo(m.conteudo.replaceAll('{paciente}', paciente.nome))
    }
  }

  const salvar = async () => {
    try {
      setSalvando(true)
      await prontuarioService.criarDocumento({
        paciente: paciente.id,
        tipo,
        titulo,
        conteudo,
        modelo: modeloId || undefined,
        emitido_por: autor,
        reemitido: !!reemitindoDe,
        reemitido_de: reemitindoDe || undefined,
      })
      toast({ title: reemitindoDe ? 'Documento reemitido' : 'Documento gerado' })
      setOpen(false)
      setReemitindoDe(null)
      carregar()
    } catch (err) {
      console.error('Erro ao gerar documento:', err)
      toast({ title: 'Erro ao gerar documento', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const imprimir = (d: DocumentoClinico) => {
    const janela = window.open('', '_blank', 'width=800,height=900')
    if (!janela) return
    janela.document
      .write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${d.titulo}</title>
      <style>body{font-family:Georgia,serif;padding:48px;color:#111;line-height:1.6}h1{font-size:18px;margin-bottom:4px}
      .sub{color:#666;font-size:12px;margin-bottom:24px}pre{white-space:pre-wrap;font-family:inherit}</style></head>
      <body><h1>${LABEL_TIPO[d.tipo]} — Instituto Romani</h1>
      <div class="sub">Paciente: ${paciente.nome} · Emitido em ${new Date(d.created).toLocaleDateString('pt-BR')}${d.reemitido ? ' · Reemissão' : ''}</div>
      <pre>${d.conteudo}</pre></body></html>`)
    janela.document.close()
    janela.print()
    // LGPD: impressão/download de documento clínico é registrado na auditoria
    prontuarioService.auditoria(paciente.id, 'impressao', `${LABEL_TIPO[d.tipo]}: ${d.titulo}`)
  }

  const excluir = async (d: DocumentoClinico) => {
    if (!confirm('Excluir este documento?')) return
    try {
      await prontuarioService.excluirDocumento(d.id, paciente.id)
      carregar()
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const modelosDoTipo = modelos.filter((m) => m.tipo === tipo)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Gere prescrições e pedidos de exames a partir de modelos; reemita um documento já emitido
          mantendo o histórico.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => abrirNovo('pedido_exame')}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Pedido de exame
          </Button>
          <Button size="sm" onClick={() => abrirNovo('prescricao')} className="text-xs">
            <FilePlus2 className="h-3.5 w-3.5 mr-1" /> Nova prescrição
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </div>
      ) : documentos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Nenhum documento emitido para este paciente.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {documentos.map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{d.titulo}</CardTitle>
                  <div className="flex gap-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-slate-300 text-slate-600"
                    >
                      {LABEL_TIPO[d.tipo]}
                    </Badge>
                    {d.reemitido && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-amber-50 text-amber-700 border-amber-300"
                      >
                        <RotateCcw className="h-2.5 w-2.5 mr-0.5" /> Reemitido
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  {new Date(d.created).toLocaleDateString('pt-BR')}
                  {d.emitido_por ? ` · ${d.emitido_por}` : ''}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-4">
                  {d.conteudo}
                </p>
                <div className="flex gap-1 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => imprimir(d)}
                  >
                    <Printer className="h-3 w-3 mr-1" /> Imprimir / PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => reemitir(d)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Reemitir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-rose-600"
                    onClick={() => excluir(d)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog gerar/reemitir documento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{reemitindoDe ? 'Reemitir documento' : 'Gerar documento'}</DialogTitle>
            <DialogDescription>
              {reemitindoDe
                ? 'Uma nova versão será emitida mantendo o original no histórico.'
                : 'Escolha um modelo — o texto vem pronto para ajustar antes de emitir.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Modelo</Label>
              <Select value={modeloId} onValueChange={aplicarModelo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelosDoTipo.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => {
                  setTipo(v as TipoDocumentoClinico)
                  setModeloId('')
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prescricao">Prescrição</SelectItem>
                  <SelectItem value="pedido_exame">Pedido de exame</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Conteúdo</Label>
              <Textarea rows={8} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando || !titulo || !conteudo}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Emitir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
