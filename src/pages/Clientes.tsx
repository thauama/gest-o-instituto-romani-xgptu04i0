import React, { useEffect, useState } from 'react'
import { clientesService } from '@/services/clinic'
import type { Cliente } from '@/types/clinic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Users,
  Search,
  Plus,
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  Instagram,
} from 'lucide-react'

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Dialog State
  const [openModal, setOpenModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)

  // Form Fields
  const [nome, setNome] = useState('')
  const [rg, setRg] = useState('')
  const [cpf, setCpf] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [profissao, setProfissao] = useState('')
  const [estadoCivil, setEstadoCivil] = useState('Solteira(o)')
  const [email, setEmail] = useState('')
  const [religiao, setReligiao] = useState('')
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [instagram, setInstagram] = useState('')
  const [contato, setContato] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    setLoading(true)
    try {
      const list = await clientesService.list('', 'nome')
      setClientes(list)
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingClient(null)
    setNome('')
    setRg('')
    setCpf('')
    setNascimento('')
    setEndereco('')
    setProfissao('')
    setEstadoCivil('Solteira(o)')
    setEmail('')
    setReligiao('')
    setPeso('')
    setAltura('')
    setInstagram('')
    setContato('')
    setObservacoes('')
    setOpenModal(true)
  }

  const handleOpenEdit = (c: Cliente) => {
    setEditingClient(c)
    setNome(c.nome || '')
    setRg(c.rg || '')
    setCpf(c.cpf || '')
    setNascimento(c.nascimento || '')
    setEndereco(c.endereco || '')
    setProfissao(c.profissao || '')
    setEstadoCivil(c.estado_civil || 'Solteira(o)')
    setEmail(c.email || '')
    setReligiao(c.religiao || '')
    setPeso(c.peso || '')
    setAltura(c.altura || '')
    setInstagram(c.instagram || '')
    setContato(c.contato || '')
    setObservacoes(c.observacoes || '')
    setOpenModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome) return

    const payload: Partial<Cliente> = {
      nome,
      rg,
      cpf,
      nascimento,
      endereco,
      profissao,
      estado_civil: estadoCivil,
      email,
      religiao,
      peso,
      altura,
      instagram,
      contato,
      observacoes,
      status_cadastro: 'completo',
    }

    if (editingClient) {
      await clientesService.update(editingClient.id, payload)
    } else {
      await clientesService.create(payload)
    }

    setOpenModal(false)
    await loadClientes()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir o cadastro deste paciente?')) {
      await clientesService.delete(id)
      await loadClientes()
    }
  }

  const getPublicLink = (id: string) => {
    return `${window.location.origin}/pre-cadastro/${id}`
  }

  const handleCopyLink = (id: string) => {
    const link = getPublicLink(id)
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const filtered = clientes.filter((c) => {
    const term = search.toLowerCase()
    return (
      c.nome?.toLowerCase().includes(term) ||
      c.cpf?.toLowerCase().includes(term) ||
      c.contato?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Clientes e Pacientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ficha clínica cadastral, contato, medidas e envio de link para autopreenchimento pelo
            paciente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Cadastrar Paciente
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CPF ou contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total: {filtered.length} paciente(s)
        </div>
      </div>

      {/* Clientes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl bg-white text-xs text-slate-500">
            Nenhum paciente encontrado.
          </div>
        ) : (
          filtered.map((c) => (
            <Card
              key={c.id}
              className="border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">{c.nome}</CardTitle>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {c.profissao || 'Profissão não informada'} · {c.estado_civil || 'N/A'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      c.status_cadastro === 'completo'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {c.status_cadastro === 'completo' ? 'Ficha Completa' : 'Pendente Preenchimento'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3 text-xs text-slate-600">
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                  {c.cpf && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">CPF:</span>
                      <span className="font-semibold text-slate-800">{c.cpf}</span>
                    </div>
                  )}
                  {c.nascimento && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nascimento:</span>
                      <span className="text-slate-800">{c.nascimento}</span>
                    </div>
                  )}
                  {c.contato && (
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      <span>{c.contato}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Mail className="h-3 w-3 text-blue-600" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.endereco && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                      <span className="truncate">{c.endereco}</span>
                    </div>
                  )}
                </div>

                {/* Biometrics & Instagram */}
                <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                  <span>
                    Peso: <strong>{c.peso || '-'}</strong>
                  </span>
                  <span>
                    Altura: <strong>{c.altura || '-'}</strong>
                  </span>
                  {c.instagram && (
                    <span className="flex items-center gap-1 text-rose-700 font-medium">
                      <Instagram className="h-3 w-3" /> {c.instagram}
                    </span>
                  )}
                </div>

                {/* Public Link Box */}
                <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-amber-950">
                      Link público para o paciente:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(c.id)}
                      className="flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-800 font-bold"
                    >
                      {copiedId === c.id ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copiar Link
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Envie via WhatsApp ou e-mail para o paciente preencher seus dados cadastrais
                    antes da consulta.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(c)}
                    className="h-8 text-xs text-slate-700"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar Ficha
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(c.id)}
                    className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Dialog Form */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados completos para a ficha cadastral do Instituto Romani.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 text-xs mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="c-nome">Nome Completo *</Label>
                <Input
                  id="c-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mariana Alcantara Silveira"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-contato">Telefone / WhatsApp *</Label>
                <Input
                  id="c-contato"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  placeholder="(15) 99999-9999"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="c-cpf">CPF</Label>
                <Input
                  id="c-cpf"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-rg">RG</Label>
                <Input
                  id="c-rg"
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                  placeholder="00.000.000-0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-nasc">Data de Nascimento</Label>
                <Input
                  id="c-nasc"
                  type="date"
                  value={nascimento}
                  onChange={(e) => setNascimento(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="c-email">E-mail</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@email.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-insta">Instagram</Label>
                <Input
                  id="c-insta"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@usuario"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="c-prof">Profissão</Label>
                <Input
                  id="c-prof"
                  value={profissao}
                  onChange={(e) => setProfissao(e.target.value)}
                  placeholder="Ex: Arquiteta"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-est">Estado Civil</Label>
                <Input
                  id="c-est"
                  value={estadoCivil}
                  onChange={(e) => setEstadoCivil(e.target.value)}
                  placeholder="Casada(o), Solteira(o)"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-rel">Religião</Label>
                <Input
                  id="c-rel"
                  value={religiao}
                  onChange={(e) => setReligiao(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="c-peso">Peso</Label>
                <Input
                  id="c-peso"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 62 kg"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-alt">Altura</Label>
                <Input
                  id="c-alt"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  placeholder="Ex: 1.68 m"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="c-end">Endereço Completo</Label>
              <Input
                id="c-end"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, Número, Bairro, Sorocaba - SP"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="c-obs">Observações / Histórico Clínico</Label>
              <Input
                id="c-obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Procedimento de interesse, alergias, restrições"
              />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">
                Salvar Paciente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
