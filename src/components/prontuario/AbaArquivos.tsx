import { useRef, useEffect, useState } from 'react'
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Loader2,
  FileVideo,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { ArquivoPaciente, CategoriaArquivoPaciente, Cliente } from '@/types/clinic'
import { useToast } from '@/hooks/use-toast'

interface Props {
  paciente: Cliente
  versao: number
}

const CATEGORIAS: { valor: CategoriaArquivoPaciente; label: string }[] = [
  { valor: 'exame', label: 'Exame' },
  { valor: 'foto', label: 'Foto' },
  { valor: 'contrato', label: 'Contrato' },
  { valor: 'orcamento', label: 'Orçamento' },
  { valor: 'video', label: 'Vídeo' },
  { valor: 'outro', label: 'Outro' },
]

export default function AbaArquivos({ paciente, versao }: Props) {
  const { toast } = useToast()
  const [arquivos, setArquivos] = useState<ArquivoPaciente[]>([])
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaArquivoPaciente>('exame')
  const [descricao, setDescricao] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)

  const carregar = () => {
    setLoading(true)
    prontuarioService
      .listarArquivos(paciente.id)
      .then(setArquivos)
      .catch((err) => {
        console.error('Erro ao carregar arquivos:', err)
        toast({ title: 'Erro ao carregar arquivos', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [paciente.id, versao])

  const salvar = async () => {
    if (!file) return
    try {
      setSalvando(true)
      const fd = new FormData()
      fd.set('paciente', paciente.id)
      fd.set('titulo', titulo || file.name)
      fd.set('categoria', categoria)
      fd.set('descricao', descricao)
      fd.set('arquivo', file)
      await prontuarioService.criarArquivo(fd)
      toast({ title: 'Arquivo anexado' })
      setOpen(false)
      setTitulo('')
      setDescricao('')
      setFile(null)
      carregar()
    } catch (err) {
      console.error('Erro ao enviar arquivo:', err)
      toast({ title: 'Erro ao enviar arquivo', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (a: ArquivoPaciente) => {
    if (!confirm('Excluir este arquivo?')) return
    try {
      await prontuarioService.excluirArquivo(a.id, paciente.id)
      carregar()
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const iconeCategoria = (cat: CategoriaArquivoPaciente) =>
    cat === 'video' ? (
      <FileVideo className="h-4 w-4" />
    ) : cat === 'exame' ? (
      <FileText className="h-4 w-4" />
    ) : (
      <ImageIcon className="h-4 w-4" />
    )

  const urlArquivo = (a: ArquivoPaciente) =>
    prontuarioService.urlArquivo(
      a as unknown as { id: string; collectionId?: string; collectionName?: string },
      a.arquivo,
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Fotos, exames, contratos, orçamentos e vídeos do paciente — armazenados de forma privada,
          com acesso registrado.
        </p>
        <Button size="sm" onClick={() => setOpen(true)} className="text-xs">
          <Upload className="h-3.5 w-3.5 mr-1" /> Enviar arquivo
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </div>
      ) : arquivos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Nenhum arquivo anexado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {arquivos.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    {iconeCategoria(a.categoria)}
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.titulo}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-600">
                    {CATEGORIAS.find((c) => c.valor === a.categoria)?.label || a.categoria}
                  </Badge>
                </div>
                {a.descricao && (
                  <p className="text-[11px] text-slate-500 line-clamp-2">{a.descricao}</p>
                )}
                <p className="text-[10px] text-slate-400">
                  {new Date(a.created).toLocaleDateString('pt-BR')}
                </p>
                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <a href={urlArquivo(a)} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" /> Abrir
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-rose-600"
                    onClick={() => excluir(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar arquivo do paciente</DialogTitle>
            <DialogDescription>
              Exames, fotos, contratos, orçamentos ou vídeos (até ~10&nbsp;MB por arquivo).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label htmlFor="arq-titulo">Título</Label>
              <Input
                id="arq-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Hemograma completo"
              />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v as CategoriaArquivoPaciente)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.valor} value={c.valor}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="arq-desc">Descrição</Label>
              <Input
                id="arq-desc"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Arquivo</Label>
              <Input
                ref={inputRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept="image/*,application/pdf,video/*"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={!file || salvando}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
