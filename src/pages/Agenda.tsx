import React, { useEffect, useState } from 'react'
import { consultasService, clientesService } from '@/services/clinic'
import type { Consulta, Cliente } from '@/types/clinic'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { execute, listConnectors } from '@/lib/skipConnectors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Stethoscope,
  CalendarDays,
  ExternalLink,
} from 'lucide-react'

export default function Agenda() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [googleStatus, setGoogleStatus] = useState<string>('not_connected')
  const [syncingGoogle, setSyncingGoogle] = useState(false)
  const [googleEvents, setGoogleEvents] = useState<any[]>([])

  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [horario, setHorario] = useState('14:00')
  const [tipo, setTipo] = useState('Primeira Consulta')
  const [profissional, setProfissional] = useState('Dr. Pedro Ivo Romani')
  const [observacoes, setObservacoes] = useState('')
  const [syncWithGoogle, setSyncWithGoogle] = useState(true)

  // Filter
  const [filtroData, setFiltroData] = useState('')

  useEffect(() => {
    loadAll()
    checkConnector()
  }, [])

  const checkConnector = async () => {
    try {
      const all = await listConnectors()
      const gcal = all.find((c) => c.toolkit === 'googlecalendar')
      setGoogleStatus(gcal?.status || 'not_connected')
    } catch (err) {
      console.warn('Erro ao checar conector do Google Calendar:', err)
    }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const cons = await consultasService.list('', 'data,horario')
      const clis = await clientesService.list('', 'nome')
      setConsultas(cons)
      setClientes(clis)
    } catch (err) {
      console.error('Erro ao carregar agenda:', err)
    } finally {
      setLoading(false)
    }
  }

  const syncWithGoogleCalendar = async () => {
    setSyncingGoogle(true)
    try {
      await checkConnector()
      const now = new Date()
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString()

      const r = await execute('GOOGLECALENDAR_EVENTS_LIST', {
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      })

      if (r.successful && r.data) {
        // Composio response data items
        const raw = r.data as any
        const items = raw?.items || raw?.response_data?.items || []
        setGoogleEvents(items)
      } else if (!r.successful) {
        console.warn('Falha no Google Calendar:', r.error)
      }
    } catch (err) {
      console.warn('Erro ao sincronizar Google Calendar:', err)
    } finally {
      setSyncingGoogle(false)
    }
  }

  const handleCreateConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteId || !data) return

    let googleEventId = ''

    // If connected to Google Calendar, create event directly in Dr. Romani's calendar!
    if (syncWithGoogle && googleStatus === 'connected') {
      try {
        const selectedCli = clientes.find((c) => c.id === clienteId)
        const summary = `[Instituto Romani] ${tipo} - ${selectedCli?.nome || 'Paciente'}`
        const startDateTime = `${data}T${horario || '09:00'}:00`
        const endDateTime = `${data}T${
          horario
            ? `${String(parseInt(horario.split(':')[0], 10) + 1).padStart(2, '0')}:${horario.split(':')[1]}`
            : '10:00'
        }:00`

        const gRes = await execute('GOOGLECALENDAR_CREATE_EVENT', {
          summary,
          description: `Paciente: ${selectedCli?.nome}\nContato: ${selectedCli?.contato || 'N/A'}\nNotas: ${observacoes}\nProfissional: ${profissional}`,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
        })

        if (gRes.successful && gRes.data) {
          const resObj = gRes.data as any
          googleEventId = resObj?.id || resObj?.response_data?.id || ''
        }
      } catch (gErr) {
        console.warn('Google calendar event create notice:', gErr)
      }
    }

    await consultasService.create({
      cliente: clienteId,
      data,
      horario,
      tipo,
      profissional,
      observacoes,
      status: 'agendada',
      google_event_id: googleEventId,
    })

    setOpenModal(false)
    setClienteId('')
    setObservacoes('')
    await loadAll()
  }

  const handleStatusChange = async (
    id: string,
    newStatus: 'agendada' | 'desmarcada' | 'realizada',
  ) => {
    await consultasService.update(id, { status: newStatus })
    await loadAll()
  }

  const filteredConsultas = consultas.filter((c) => {
    if (!filtroData) return true
    return c.data === filtroData
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-amber-600" />
            Agenda da Clínica
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consultas, avaliações e retornos cirúrgicos integrados ao Google Calendar da clínica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncWithGoogleCalendar}
            disabled={syncingGoogle}
            className="text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncingGoogle ? 'animate-spin' : ''}`} />
            {syncingGoogle ? 'Sincronizando...' : 'Sincronizar Google'}
          </Button>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9">
                <Plus className="h-4 w-4 mr-1.5" />
                Agendar Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Consulta na Agenda</DialogTitle>
                <DialogDescription className="text-xs">
                  Agende a consulta para a equipe do Dr. Pedro Ivo Romani.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateConsulta} className="space-y-4 text-xs mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cliente-sel">Paciente *</Label>
                  <Select value={clienteId} onValueChange={setClienteId} required>
                    <SelectTrigger id="cliente-sel">
                      <SelectValue placeholder="Selecione o paciente cadastrado" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome} {c.cpf ? `(${c.cpf})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="data-cons">Data *</Label>
                    <Input
                      id="data-cons"
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hora-cons">Horário</Label>
                    <Input
                      id="hora-cons"
                      type="time"
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tipo-cons">Tipo de Atendimento</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger id="tipo-cons">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primeira Avaliação">Primeira Avaliação</SelectItem>
                      <SelectItem value="Consulta Pré-Operatória">
                        Consulta Pré-Operatória
                      </SelectItem>
                      <SelectItem value="Retorno Pós-Procedimento">
                        Retorno Pós-Procedimento
                      </SelectItem>
                      <SelectItem value="Procedimento em Consultório">
                        Procedimento em Consultório
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-cons">Profissional Responsável</Label>
                  <Input
                    id="prof-cons"
                    value={profissional}
                    onChange={(e) => setProfissional(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="obs-cons">Observações Clínicas</Label>
                  <Input
                    id="obs-cons"
                    placeholder="Ex: Trazer exames de sangue e ECG"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>

                <div className="pt-2 border-t flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-slate-900 text-white">
                    Confirmar Agendamento
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Google Calendar Integration Status Card */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-slate-900/5 to-amber-500/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">
                  Conexão Google Calendar da Clínica
                </span>
                <Badge
                  variant="outline"
                  className={
                    googleStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]'
                      : 'bg-slate-100 text-slate-600 border-slate-300 text-[10px]'
                  }
                >
                  {googleStatus === 'connected' ? 'Ativo e Conectado' : 'Não conectado'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {googleStatus === 'connected'
                  ? 'As consultas agendadas sincronizam diretamente na conta Google Calendar do Dr. Pedro Ivo Romani.'
                  : 'Conecte a conta Google da clínica para sincronizar as consultas automaticamente.'}
              </p>
            </div>
          </div>

          <div>
            <ConnectorButton toolkit="googlecalendar" name="Google Calendar" className="text-xs" />
          </div>
        </CardContent>
      </Card>

      {/* Filter and List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filtrar por data:</span>
            <Input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="w-44 h-8 text-xs"
            />
            {filtroData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltroData('')}
                className="text-xs h-8 text-slate-500"
              >
                Limpar filtro
              </Button>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {filteredConsultas.length} consulta(s) encontrada(s)
          </span>
        </div>

        {/* Consultas Table / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConsultas.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed rounded-xl bg-white text-xs text-slate-500">
              Nenhuma consulta cadastrada para este período.
            </div>
          ) : (
            filteredConsultas.map((c) => (
              <Card
                key={c.id}
                className={`border shadow-sm transition-shadow hover:shadow-md ${
                  c.status === 'desmarcada'
                    ? 'border-slate-200 bg-slate-50/60 opacity-80'
                    : c.status === 'realizada'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">
                        {c.expand?.cliente?.nome || 'Paciente'}
                      </CardTitle>
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        {c.tipo || 'Consulta Clínica'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-semibold ${
                        c.status === 'agendada'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : c.status === 'realizada'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {c.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3 text-xs text-slate-600">
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span>
                        {c.data} às {c.horario || 'Horário flexível'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Médico: {c.profissional || 'Dr. Pedro Ivo Romani'}
                    </div>
                    {c.expand?.cliente?.contato && (
                      <div className="text-[11px] text-slate-500">
                        Contato: {c.expand?.cliente?.contato}
                      </div>
                    )}
                  </div>

                  {c.observacoes && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-2 rounded border border-amber-100">
                      &ldquo;{c.observacoes}&rdquo;
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {c.status !== 'realizada' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(c.id, 'realizada')}
                          className="h-7 text-[11px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Realizada
                        </Button>
                      )}
                      {c.status !== 'desmarcada' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(c.id, 'desmarcada')}
                          className="h-7 text-[11px] text-rose-700 hover:text-rose-800 hover:bg-rose-50 px-2"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Desmarcar
                        </Button>
                      )}
                      {c.status === 'desmarcada' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(c.id, 'agendada')}
                          className="h-7 text-[11px] text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-2"
                        >
                          Reagendar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
