import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Switch } from '@/components/ui/switch'
import { prontuarioService } from '@/services/clinic'
import type { Anamnese, CampoModeloAnamnese, Cliente, ModeloAnamnese, ModuloAnamnese } from '@/types/clinic'
import { useToast } from '@/hooks/use-toast'

interface Props {
  paciente: Cliente
  versao: number
  autor?: string
}

export default function AbaAnamnese({ paciente, versao, autor }: Props) {
  const { toast } = useToast()
  const [modelos, setModelos] = useState<ModeloAnamnese[]>([])
  const [anamneses, setAnamneses] = useState<Anamnese[]>([])
  const [loading, setLoading] = useState(true)

  const [modeloEscolhido, setModeloEscolhido] = useState<string>('')
  const [tituloNova, setTituloNova] = useState('')
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [novaOpen, setNovaOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Editor de modelos (admin)
  const [editorOpen, setEditorOpen] = useState(false)
  const [modeloEditando, setModeloEditando] = useState<ModeloAnamnese | null>(null)
  const [nomeModelo, setNomeModelo] = useState('')
  const [descricaoModelo, setDescricaoModelo] = useState('')
  const [camposModelo, setCamposModelo] = useState<CampoModeloAnamnese[]>([])

  const carregar = () => {
    setLoading(true)
    Promise.all([
      prontuarioService.listarModelosAnamnese(),
      prontuarioService.listarAnamnese(paciente.id),
    ])
      .then(([ms, as]) => {
        setModelos(ms)
        setAnamneses(as)
      })
      .catch((err) => {
        console.error('Erro ao carregar anamnese:', err)
        toast({ title: 'Erro ao carregar anamnese', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [paciente.id, versao])

  const abrirNova = () => {
    setTituloNova(`${paciente.nome} — Anamnese`)
    setModeloEscolhido(modelos[0]?.id || '')
    setRespostas({})
    setNovaOpen(true)
  }

  const modeloAtual = modelos.find((m) => m.id === modeloEscolhido)

  const salvarNova = async () => {
    const modulos: ModuloAnamnese[] = (modeloAtual?.campos || []).map((campo) => ({
      titulo: campo.titulo,
      conteudo: respostas[campo.titulo] || '',
    }))
    try {
      setSalvando(true)
      await prontuarioService.criarAnamnese({
        paciente: paciente.id,
        titulo: tituloNova,
        modelo: modeloAtual?.id,
        modulos,
      })
      toast({ title: 'Anamnese salva' })
      setNovaOpen(false)
      carregar()
    } catch (err) {
      console.error('Erro ao salvar anamnese:', err)
      toast({ title: 'Erro ao salvar anamnese', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (a: Anamnese) => {
    if (!confirm('Excluir esta anamnese?')) return
    try {
      await prontuarioService.excluirAnamnese(a.id, paciente.id)
      toast({ title: 'Anamnese excluída' })
      carregar()
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  // ---- Editor de modelos ----
  const abrirEditor = (m?: ModeloAnamnese) => {
    setModeloEditando(m || null)
    setNomeModelo(m?.nome || '')
    setDescricaoModelo(m?.descricao || '')
    setCamposModelo(
      m?.campos?.length ? m.campos : [{ titulo: 'Queixa principal', tipo: 'texto_longo' }],
    )
    setEditorOpen(true)
  }

  const salvarModelo = async () => {
    try {
      const data = { nome: nomeModelo, descricao: descricaoModelo, campos: camposModelo, ativo: true }
      if (modeloEditando) await prontuarioService.atualizarModeloAnamnese(modeloEditando.id, data)
      else await prontuarioService.criarModeloAnamnese(data)
      toast({ title: 'Modelo salvo' })
      setEditorOpen(false)
      carregar()
    } catch {
      toast({ title: 'Erro ao salvar modelo', variant: 'destructive' })
    }
  }

  const excluirModelo = async (m: ModeloAnamnese) => {
    if (!confirm(`Excluir o modelo "${m.nome}"?`)) return
    try {
      await prontuarioService.excluirModeloAnamnese(m.id)
      carregar()
    } catch {
      toast({ title: 'Erro ao excluir modelo', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Módulos preenchidos por anamnese — o admin escolhe quais módulos inserir e edita os
          modelos disponíveis.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => abrirEditor()} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Novo modelo
          </Button>
          <Button size="sm" onClick={abrirNova} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Nova anamnese
          </Button>
        </div>
      </div>

      {/* Modelos editáveis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Modelos de anamnese (editáveis)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {modelos.length === 0 && (
            <p className="text-xs text-slate-500">Nenhum modelo cadastrado.</p>
          )}
          {modelos.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{m.nome}</p>
                <p className="text-[11px] text-slate-500">
                  {m.descricao} · {m.campos?.length || 0} módulos
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => abrirEditor(m)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-rose-600"
                  onClick={() => excluirModelo(m)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Anamneses preenchidas */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </div>
      ) : anamneses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Nenhuma anamnese preenchida para este paciente.
          </CardContent>
        </Card>
      ) : (
        anamneses.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">{a.titulo}</CardTitle>
                <p className="text-[11px] text-slate-500">
                  Atualizada em {new Date(a.updated).toLocaleDateString('pt-BR')}
                  {a.preenchido_por ? ` · por ${a.preenchido_por}` : ''}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => excluir(a)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(a.modulos || []).map((mod, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-1">{mod.titulo}</p>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {mod.conteudo || '—'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog nova anamnese */}
      <Dialog open={novaOpen} onOpenChange={setNovaOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova anamnese</DialogTitle>
            <DialogDescription>
              Escolha o modelo — os módulos vêm prontos para preencher.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label htmlFor="anamnese-titulo">Título</Label>
              <Input id="anamnese-titulo" value={tituloNova} onChange={(e) => setTituloNova(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Modelo</Label>
              <Select value={modeloEscolhido} onValueChange={(v) => { setModeloEscolhido(v); setRespostas({}) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(modeloAtual?.campos || []).map((campo: CampoModeloAnamnese) => (
              <div key={campo.titulo} className="space-y-1">
                <Label>
                  {campo.titulo}
                  {campo.obrigatorio && <span className="text-rose-600"> *</span>}
                </Label>
                {campo.tipo === 'texto_longo' ? (
                  <Textarea
                    value={respostas[campo.titulo] || ''}
                    onChange={(e) => setRespostas({ ...respostas, [campo.titulo]: e.target.value })}
                    rows={3}
                  />
                ) : campo.tipo === 'sim_nao' ? (
                  <Select
                    value={respostas[campo.titulo] || ''}
                    onValueChange={(v) => setRespostas({ ...respostas, [campo.titulo]: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={respostas[campo.titulo] || ''}
                    onChange={(e) => setRespostas({ ...respostas, [campo.titulo]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaOpen(false)}>Cancelar</Button>
            <Button onClick={salvarNova} disabled={salvando}>
              {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog editor de modelos */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modeloEditando ? 'Editar modelo' : 'Novo modelo'} de anamnese</DialogTitle>
            <DialogDescription>
              Defina os módulos que aparecerão ao preencher uma anamnese com este modelo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Nome do modelo</Label>
              <Input value={nomeModelo} onChange={(e) => setNomeModelo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={descricaoModelo} onChange={(e) => setDescricaoModelo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Módulos</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() =>
                    setCamposModelo([...camposModelo, { titulo: '', tipo: 'texto_longo' }])
                  }
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar módulo
                </Button>
              </div>
              {camposModelo.map((campo, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    placeholder="Título do módulo"
                    value={campo.titulo}
                    onChange={(e) => {
                      const copia = [...camposModelo]
                      copia[i] = { ...campo, titulo: e.target.value }
                      setCamposModelo(copia)
                    }}
                    className="flex-1"
                  />
                  <Select
                    value={campo.tipo}
                    onValueChange={(v) => {
                      const copia = [...camposModelo]
                      copia[i] = { ...campo, tipo: v as CampoModeloAnamnese['tipo'] }
                      setCamposModelo(copia)
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto">Texto</SelectItem>
                      <SelectItem value="texto_longo">Texto longo</SelectItem>
                      <SelectItem value="sim_nao">Sim/Não</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={!!campo.obrigatorio}
                      onCheckedChange={(v) => {
                        const copia = [...camposModelo]
                        copia[i] = { ...campo, obrigatorio: v }
                        setCamposModelo(copia)
                      }}
                    />
                    <span className="text-[10px] text-slate-500">Obrig.</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600 h-7"
                    onClick={() => setCamposModelo(camposModelo.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancelar</Button>
            <Button onClick={salvarModelo}>Salvar modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
