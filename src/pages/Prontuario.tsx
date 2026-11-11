import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ClipboardList,
  FilePlus2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { clientesService, prontuarioService } from '@/services/clinic'
import type { Cliente, ConsentimentoPaciente, TipoConsentimento } from '@/types/clinic'
import AbaAnamnese from '@/components/prontuario/AbaAnamnese'
import AbaDocumentos from '@/components/prontuario/AbaDocumentos'
import AbaArquivos from '@/components/prontuario/AbaArquivos'

type Aba = 'anamnese' | 'documentos' | 'arquivos'

const ABAS: { id: Aba; label: string; icon: typeof ClipboardList }[] = [
  { id: 'anamnese', label: 'Anamnese', icon: ClipboardList },
  { id: 'documentos', label: 'Documentos', icon: FilePlus2 },
  { id: 'arquivos', label: 'Arquivos', icon: ImageIcon },
]

const LABEL_CONSENTIMENTO: Record<TipoConsentimento, string> = {
  uso_dados: 'Uso de dados',
  tratamento: 'Tratamento',
  imagem: 'Imagem',
  outro: 'Outro',
}

export default function Prontuario() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const pacienteId = searchParams.get('paciente') || ''

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const [aba, setAba] = useState<Aba>('anamnese')
  const [versao, setVersao] = useState(0)

  const [consentimentos, setConsentimentos] = useState<ConsentimentoPaciente[]>([])
  const [consentOpen, setConsentOpen] = useState(false)
  const [consentTipo, setConsentTipo] = useState<TipoConsentimento>('uso_dados')
  const [consentVersao, setConsentVersao] = useState('1.0')
  const [consentAssinado, setConsentAssinado] = useState(true)
  const [salvandoConsent, setSalvandoConsent] = useState(false)

  const paciente = clientes.find((c) => c.id === pacienteId) || null

  const carregarClientes = useCallback(async () => {
    setLoading(true)
    try {
      const list = await clientesService.list('', 'nome')
      setClientes(list)
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err)
      toast({ title: 'Erro ao carregar pacientes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    carregarClientes()
  }, [carregarClientes])

  // Auditoria LGPD: todo acesso ao prontuário de um paciente fica registrado (create-only)
  useEffect(() => {
    if (!pacienteId) return
    prontuarioService.auditoria(pacienteId, 'visualizacao', 'Abertura do prontuário')
  }, [pacienteId])

  const carregarConsentimentos = useCallback(() => {
    if (!pacienteId) {
      setConsentimentos([])
      return
    }
    prontuarioService
      .listarConsentimentos(pacienteId)
      .then(setConsentimentos)
      .catch((err) => console.warn('Erro ao carregar consentimentos:', err))
  }, [pacienteId])

  useEffect(() => {
    carregarConsentimentos()
  }, [carregarConsentimentos, versao])

  const salvarConsentimento = async () => {
    if (!pacienteId) return
    try {
      setSalvandoConsent(true)
      await prontuarioService.criarConsentimento({
        paciente: pacienteId,
        tipo: consentTipo,
        versao: consentVersao,
        assinado: consentAssinado,
        assinado_em: consentAssinado ? new Date().toISOString().slice(0, 10) : '',
        registrado_por: user?.name || user?.email || '—',
      })
      toast({ title: 'Consentimento registrado' })
      setConsentOpen(false)
      carregarConsentimentos()
    } catch (err) {
      console.error('Erro ao registrar consentimento:', err)
      toast({ title: 'Erro ao registrar consentimento', variant: 'destructive' })
    } finally {
      setSalvandoConsent(false)
    }
  }

  const filtrados = clientes.filter((c) => {
    const term = busca.toLowerCase()
    return (
      c.nome?.toLowerCase().includes(term) ||
      c.cpf?.toLowerCase().includes(term) ||
      c.contato?.toLowerCase().includes(term)
    )
  })

  const abrirPaciente = (id: string) => {
    setAba('anamnese')
    setSearchParams({ paciente: id })
  }

  const voltarLista = () => setSearchParams({})

  // ---------- Seleção de paciente ----------
  if (!pacienteId || !paciente) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-blue-600" />
              Prontuário Eletrônico
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Anamnese, documentos clínicos e arquivos do paciente. Acesso restrito ao administrador
              (LGPD) — cada abertura é registrada na auditoria.
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 w-fit"
          >
            <ShieldCheck className="h-3 w-3 mr-1" /> Somente admin
          </Badge>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar paciente por nome, CPF ou contato..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando pacientes…
          </div>
        ) : filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              {clientes.length === 0
                ? 'Nenhum paciente cadastrado — cadastre na tela Clientes & Pacientes.'
                : 'Nenhum paciente encontrado para esta busca.'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((c) => (
              <Card
                key={c.id}
                className="border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" /> {c.nome}
                  </CardTitle>
                  {c.cpf && <p className="text-[11px] text-slate-500">CPF: {c.cpf}</p>}
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <Button size="sm" className="w-full text-xs" onClick={() => abrirPaciente(c.id)}>
                    Abrir prontuário
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ---------- Prontuário do paciente ----------
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={voltarLista} title="Voltar para a lista">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">{paciente.nome}</h1>
            <p className="text-[11px] text-slate-500">
              Prontuário eletrônico · acesso registrado na auditoria (LGPD)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-[11px] text-slate-500">
            {consentimentos.length} consentimento(s) registrado(s)
          </span>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setConsentOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Consentimento
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
        {ABAS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAba(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              aba === t.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {aba === 'anamnese' && (
        <AbaAnamnese paciente={paciente} versao={versao} autor={user?.name || user?.email || '—'} />
      )}
      {aba === 'documentos' && (
        <AbaDocumentos
          paciente={paciente}
          versao={versao}
          autor={user?.name || user?.email || '—'}
        />
      )}
      {aba === 'arquivos' && <AbaArquivos paciente={paciente} versao={versao} />}

      {/* Dialog consentimento LGPD */}
      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar consentimento LGPD</DialogTitle>
            <DialogDescription className="text-xs">
              Registra o consentimento do paciente para uso de dados, tratamento ou imagem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select
                value={consentTipo}
                onValueChange={(v) => setConsentTipo(v as TipoConsentimento)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LABEL_CONSENTIMENTO) as TipoConsentimento[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {LABEL_CONSENTIMENTO[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="consent-versao">Versão do termo</Label>
              <Input
                id="consent-versao"
                value={consentVersao}
                onChange={(e) => setConsentVersao(e.target.value)}
                placeholder="Ex: 1.0"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5">
              <div>
                <p className="font-medium text-slate-800">Assinado</p>
                <p className="text-[10px] text-slate-500">Marca a data de hoje como assinatura.</p>
              </div>
              <Switch checked={consentAssinado} onCheckedChange={setConsentAssinado} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarConsentimento} disabled={salvandoConsent}>
              {salvandoConsent ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista compacta de consentimentos (LGPD) */}
      {consentimentos.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Consentimentos LGPD
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Termos registrados para este paciente, com versão e data de assinatura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {consentimentos.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium text-slate-800">{LABEL_CONSENTIMENTO[c.tipo]}</span>
                  {c.versao && <span className="text-[10px] text-slate-500">v{c.versao}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {c.assinado_em && (
                    <span className="text-[10px] text-slate-500">
                      Assinado em{' '}
                      {new Date(`${c.assinado_em}T12:00:00`).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      c.assinado
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {c.assinado ? 'Assinado' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
