import { useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { categoriasFinanceirasService } from '@/services/clinic'
import type { CategoriaFinanceira } from '@/types/clinic'

interface Props {
  open: boolean
  isAdmin: boolean
  onClose: () => void
  /** Chamado após qualquer mudança — a tela recarrega as categorias */
  onMudou: () => void
}

export default function DialogoCategorias({ open, isAdmin, onClose, onMudou }: Props) {
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [carregando, setCarregando] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoTipo, setNovoTipo] = useState<'receita' | 'despesa'>('receita')
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  useEffect(() => {
    if (open) carregar()
  }, [open])

  const carregar = async () => {
    setCarregando(true)
    try {
      setCategorias(await categoriasFinanceirasService.list())
    } catch (err) {
      toast({
        title: 'Erro ao carregar categorias',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  const porTipo = useMemo(
    () => ({
      receita: categorias.filter((c) => c.tipo === 'receita'),
      despesa: categorias.filter((c) => c.tipo === 'despesa'),
    }),
    [categorias],
  )

  const criar = async () => {
    const nome = novoNome.trim()
    if (nome.length < 2) {
      toast({ title: 'Informe um nome com pelo menos 2 letras', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      await categoriasFinanceirasService.create({ nome, tipo: novoTipo })
      toast({ title: 'Categoria criada', description: `${nome} (${novoTipo})` })
      setNovoNome('')
      await carregar()
      onMudou()
    } catch (err) {
      toast({
        title: 'Erro ao criar categoria',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const salvarEdicao = async (c: CategoriaFinanceira) => {
    const nome = nomeEdicao.trim()
    if (nome.length < 2) {
      toast({ title: 'Informe um nome com pelo menos 2 letras', variant: 'destructive' })
      return
    }
    setSalvandoEdicao(true)
    try {
      await categoriasFinanceirasService.update(c.id, { nome })
      toast({ title: 'Categoria renomeada' })
      setEditandoId(null)
      await carregar()
      onMudou()
    } catch (err) {
      toast({
        title: 'Erro ao renomear categoria',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const remover = async (c: CategoriaFinanceira) => {
    if (!confirm(`Excluir a categoria "${c.nome}"? Lançamentos antigos mantêm o texto dela.`))
      return
    try {
      await categoriasFinanceirasService.delete(c.id)
      toast({ title: 'Categoria excluída' })
      await carregar()
      onMudou()
    } catch (err) {
      toast({
        title: 'Erro ao excluir categoria',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  const colunas = (tipo: 'receita' | 'despesa') => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
          {tipo === 'receita' ? 'Categorias de receita' : 'Categorias de despesa'}
        </h4>
        <Badge
          variant="outline"
          className={
            tipo === 'receita'
              ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
              : 'border-rose-500/60 bg-rose-950/40 text-rose-200'
          }
        >
          {porTipo[tipo].length}
        </Badge>
      </div>
      <div className="rounded-lg border border-slate-700/70 divide-y divide-slate-800 max-h-52 overflow-y-auto">
        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
          </div>
        ) : porTipo[tipo].length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Nenhuma categoria.</div>
        ) : (
          porTipo[tipo].map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2">
              {editandoId === c.id ? (
                <>
                  <Input
                    value={nomeEdicao}
                    onChange={(e) => setNomeEdicao(e.target.value)}
                    className="h-7 bg-slate-800/70 border-slate-600 text-xs text-slate-100"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') salvarEdicao(c)
                      if (e.key === 'Escape') setEditandoId(null)
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs bg-sky-600 hover:bg-sky-500 text-white"
                    disabled={salvandoEdicao}
                    onClick={() => salvarEdicao(c)}
                  >
                    {salvandoEdicao ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-slate-300 hover:text-slate-100"
                    onClick={() => setEditandoId(null)}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-100 truncate">{c.nome}</span>
                  {isAdmin && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-300 hover:text-sky-300 hover:bg-slate-800"
                        onClick={() => {
                          setEditandoId(c.id)
                          setNomeEdicao(c.nome)
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-300 hover:text-rose-300 hover:bg-slate-800"
                        onClick={() => remover(c)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </span>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <Tag className="h-4 w-4 text-sky-400" /> Categorias financeiras
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            {isAdmin
              ? 'Veja, crie, renomeie ou exclua categorias de receita e despesa.'
              : 'Visualização — somente administradores podem gerenciar categorias.'}
          </DialogDescription>
        </DialogHeader>

        {isAdmin && (
          <div className="rounded-lg border border-slate-700/70 bg-slate-800/40 p-3 space-y-2">
            <Label className="text-xs text-slate-200">Nova categoria</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex.: Convênios e Reembolsos"
                className="h-9 flex-1 bg-slate-800/70 border-slate-600 text-slate-100 placeholder:text-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && criar()}
              />
              <Select
                value={novoTipo}
                onValueChange={(v) => setNovoTipo(v as 'receita' | 'despesa')}
              >
                <SelectTrigger className="h-9 w-full sm:w-[150px] bg-slate-800/70 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={criar}
                disabled={salvando || novoNome.trim().length < 2}
                className="h-9 bg-sky-600 hover:bg-sky-500 text-white"
              >
                {salvando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 py-1">
          {colunas('receita')}
          {colunas('despesa')}
        </div>
      </DialogContent>
    </Dialog>
  )
}
