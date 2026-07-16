"use client";

import {
  BarChart3,
  Copy,
  Download,
  Eye,
  FileText,
  Gift,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Mail,
  MessageCircle,
  MonitorSmartphone,
  Plus,
  Save,
  Search,
  Settings,
  Timer,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type AdminContent,
  type AdminGift,
  defaultAdminContent,
  getAdminContent,
  saveAdminContent,
} from "@/lib/admin-store";
import { eventInfo } from "@/lib/event";
import { createGift, listGifts, removeGift } from "@/lib/gift-service";
import { listLocalGuests } from "@/lib/guest-service";
import {
  createOpenRsvpFromAdmin,
  deleteOpenRsvp,
  listOpenRsvps,
  updateOpenRsvp,
} from "@/lib/open-rsvp-service";
import type { Guest, OpenRsvpRecord } from "@/lib/types";
import { listInviteViews, type InviteViewRecord } from "@/lib/view-service";
import { ZodError } from "zod";

type AdminSection = "dashboard" | "guests" | "gifts" | "settings";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "guests", label: "Convidados", icon: Users },
  { id: "gifts", label: "Presentes", icon: Gift },
  { id: "settings", label: "Configurações", icon: Settings },
] satisfies Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboard }>;

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvps, setRsvps] = useState<OpenRsvpRecord[]>([]);
  const [views, setViews] = useState<InviteViewRecord[]>([]);
  const [gifts, setGifts] = useState<AdminGift[]>([]);
  const [content, setContent] = useState<AdminContent>(defaultAdminContent());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then((data: { granted: boolean }) => {
        setAccessGranted(data.granted);
        if (data.granted) loadAdminData();
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const matchesQuery = `${guest.mainGuestName} ${guest.phone}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = status === "all" || guest.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [guests, query, status]);

  const confirmedRsvps = rsvps.filter((rsvp) => rsvp.status === "confirmed");
  const declinedRsvps = rsvps.filter((rsvp) => rsvp.status === "declined");
  const noShowRsvps = rsvps.filter((rsvp) => rsvp.status === "no_show");
  const confirmedPeople = confirmedRsvps.reduce(
    (total, rsvp) => total + getRsvpListedPeople(rsvp).length,
    0,
  );

  async function loadAdminData() {
    setGuests(listLocalGuests());
    setContent(getAdminContent());

    try {
      const [savedRsvps, savedGifts, savedViews] = await Promise.all([
        listOpenRsvps(),
        listGifts(),
        listInviteViews(),
      ]);
      setRsvps(savedRsvps);
      setGifts(savedGifts);
      setViews(savedViews);
    } catch {
      setRsvps([]);
      setGifts([]);
      setViews([]);
      setMessage(
        "Firebase ativo: as confirmações são salvas em rsvps. Consulte no Firebase Console enquanto o painel sem login não usa API administrativa.",
      );
    }
  }

  async function unlockWithCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Codigo de acesso incorreto.");
      }

      setAccessGranted(true);
      await loadAdminData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Codigo de acesso incorreto.");
    }
  }

  async function lockAdmin() {
    await fetch("/api/admin/access", { method: "DELETE" });
    setAccessGranted(false);
    setAccessCode("");
  }

  async function handleCreateGuest(formData: FormData) {
    setMessage("");
    setError("");

    try {
      await createOpenRsvpFromAdmin({
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        companions: String(formData.get("companions") ?? "")
          .split("\n")
          .map((person) => person.trim())
          .filter(Boolean),
      });

      setMessage("Pessoa adicionada à lista de presença.");
      await loadAdminData();
    } catch (reason) {
      setError(getFriendlyError(reason, "Não foi possível cadastrar a pessoa."));
    }
  }

  async function handleCreateGift(formData: FormData) {
    setMessage("");
    setError("");

    try {
      await createGift({
        name: String(formData.get("name") ?? ""),
        category: String(formData.get("category") ?? "Outros"),
        description: "",
        imageUrl: "",
        linkUrl: "",
        size: "",
        color: "",
        notes: "",
        priority: "",
        active: true,
      });
      setGifts(await listGifts());
      setMessage("Sugestão de presente adicionada.");
    } catch (reason) {
      setError(getFriendlyError(reason, "Não foi possível salvar o presente."));
    }
  }

  async function handleDeleteGift(id: string) {
    setMessage("");
    setError("");

    try {
      await removeGift(id);
      setGifts(await listGifts());
      setMessage("Sugestão removida.");
    } catch (reason) {
      setError(getFriendlyError(reason, "Não foi possível remover o presente."));
    }
  }

  async function handleUpdateRsvp(
    id: string,
    payload: {
      name: string;
      phone: string;
      people: string[];
      status: OpenRsvpRecord["status"];
    },
  ) {
    setMessage("");
    setError("");

    try {
      await updateOpenRsvp(id, payload);
      await loadAdminData();
      setMessage("Confirmação atualizada.");
    } catch (reason) {
      setError(getFriendlyError(reason, "Não foi possível atualizar a confirmação."));
    }
  }

  async function handleDeleteRsvp(id: string) {
    setMessage("");
    setError("");

    try {
      await deleteOpenRsvp(id);
      await loadAdminData();
      setMessage("Registro excluído.");
    } catch (reason) {
      setError(getFriendlyError(reason, "Não foi possível excluir o registro."));
    }
  }

  function handleSaveContent(formData: FormData) {
    const nextContent: AdminContent = {
      heroTitle: String(formData.get("heroTitle") ?? ""),
      heroSubtitle: String(formData.get("heroSubtitle") ?? ""),
      inviteText: String(formData.get("inviteText") ?? ""),
      aboutText: String(formData.get("aboutText") ?? ""),
      finalText: String(formData.get("finalText") ?? ""),
      dressCode: String(formData.get("dressCode") ?? ""),
      parking: String(formData.get("parking") ?? ""),
      childrenRules: String(formData.get("childrenRules") ?? ""),
      arrivalTime: String(formData.get("arrivalTime") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
    };

    saveAdminContent(nextContent);
    setContent(nextContent);
    setMessage("Edicoes salvas neste painel.");
  }

  function exportCsv() {
    const header = "tipo,nome,telefone,status,total_pessoas,pessoas\n";
    const rsvpRows = rsvps
      .map((rsvp) => {
        const listedPeople = getRsvpListedPeople(rsvp);

        return [
          "confirmação",
          rsvp.name,
          rsvp.phone,
          rsvp.status,
          rsvp.status === "confirmed" ? listedPeople.length : 0,
          listedPeople.join("|"),
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",");
      })
      .join("\n");
    const guestRows = filteredGuests
      .map((guest) =>
        ["controle", guest.mainGuestName, guest.phone, guest.status, "", ""]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const rows = [rsvpRows, guestRows].filter(Boolean).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "convidados-juliane-15.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function generatePresencePdf() {
    const rows = rsvps.flatMap((rsvp) =>
      getRsvpListedPeople(rsvp).map((person) => ({
        name: person,
        holder:
          getRsvpListedPeople(rsvp).length === 1
            ? "Individual"
            : getComparableName(person) === getComparableName(rsvp.name)
              ? "Titular"
              : rsvp.name,
        status: getStatusLabel(rsvp.status),
        date: rsvp.createdAt
          ? new Intl.DateTimeFormat("pt-BR").format(new Date(rsvp.createdAt))
          : "-",
      })),
    );
    const sortedRows = rows.sort((firstRow, secondRow) =>
      firstRow.name.localeCompare(secondRow.name, "pt-BR", { sensitivity: "base" }),
    );
    const printable = window.open("", "_blank", "width=1024,height=768");
    if (!printable) {
      setError("Não foi possível abrir o relatório. Libere pop-ups para gerar o PDF.");
      return;
    }

    printable.document.write(`<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatório de presença - Juliane 15 anos</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
            h1 { margin: 0 0 4px; font-size: 28px; }
            p { margin: 0 0 18px; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; background: #f3f4f6; }
            th, td { border: 1px solid #d1d5db; padding: 8px; }
            .summary { display: flex; gap: 12px; margin: 18px 0; }
            .summary div { border: 1px solid #d1d5db; padding: 10px; border-radius: 6px; }
            @media print { body { margin: 18mm; } button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Salvar como PDF</button>
          <h1>Relatório de presença</h1>
          <p>Juliane 15 anos - Gerado em ${new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date())}</p>
          <div class="summary">
            <div><strong>${confirmedPeople}</strong><br />Pessoas confirmadas</div>
            <div><strong>${declinedRsvps.length}</strong><br />Recusados</div>
            <div><strong>${noShowRsvps.length}</strong><br />Não compareceu</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Titular do convite</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              ${sortedRows
                .map(
                  (row) => `<tr>
                    <td>${escapeHtml(row.name)}</td>
                    <td>${escapeHtml(row.holder)}</td>
                    <td>${escapeHtml(row.status)}</td>
                    <td>${escapeHtml(row.date)}</td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>`);
    printable.document.close();
    printable.focus();
  }

  function getInviteLink() {
    return `${window.location.origin}/convite?cartao=1`;
  }

  function getInviteMessage() {
    return `Ola! Voce esta convidado(a) para celebrar os 15 anos da Juliane em uma noite muito especial.

Data: ${eventInfo.dateLabel}
Horario: ${eventInfo.timeLabel}
Local: ${eventInfo.venueName}

Toque no cartão virtual para abrir o convite:
${getInviteLink()}

Esperamos você sob as estrelas.`;
  }

  async function copyInviteLink() {
    await navigator.clipboard.writeText(getInviteLink());
    setMessage("Link único do convite copiado.");
  }

  async function copyInviteMessage() {
    await navigator.clipboard.writeText(getInviteMessage());
    setMessage("Mensagem pronta copiada.");
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="route-center">
          <div className="route-card">Verificando acesso...</div>
        </section>
      </main>
    );
  }

  if (!accessGranted) {
    return (
      <main className="admin-page">
        <section className="admin-login">
          <form className="route-card route-form" onSubmit={unlockWithCode}>
            <span className="section-eyebrow">Área restrita</span>
            <h1>Painel Administrativo</h1>
            <label>
              Codigo do organizador
              <input
                autoComplete="one-time-code"
                onChange={(event) => setAccessCode(event.target.value)}
                placeholder="Digite o codigo"
                required
                type="password"
                value={accessCode}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button" type="submit">
              Acessar painel
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <aside className="admin-sidebar admin-real-sidebar">
        <div className="admin-logo">Juliane 15</div>
        {menuItems.map(({ id, label, icon: Icon }) => (
          <button
            className={activeSection === id ? "active" : ""}
            key={id}
            onClick={() => setActiveSection(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
        <button onClick={lockAdmin}>
          <LogOut size={17} />
          Sair
        </button>
      </aside>

      <section className="admin-real-main">
        <header className="admin-real-header">
          <div>
            <span className="section-eyebrow">Organizacao</span>
            <h1>Painel Administrativo</h1>
            <p>
              Gerencie convidados, sugestoes de presentes, textos do convite e
              informacoes importantes.
            </p>
          </div>
          <button className="ghost-button" onClick={exportCsv}>
            <Download size={16} />
            Exportar CSV
          </button>
        </header>

        {message ? <p className="form-success admin-message">{message}</p> : null}
        {error ? <p className="form-error admin-message">{error}</p> : null}

        {activeSection === "dashboard" ? (
          <>
            <DashboardPanel
              confirmedPeople={confirmedPeople}
              confirmedRsvps={confirmedRsvps.length}
              declinedRsvps={declinedRsvps.length}
              generatePresencePdf={generatePresencePdf}
              noShowRsvps={noShowRsvps.length}
              views={views}
            />
            <RsvpPanel rsvps={rsvps} />
            <SharePanel
              copyInviteLink={copyInviteLink}
              copyInviteMessage={copyInviteMessage}
              getInviteLink={getInviteLink}
              getInviteMessage={getInviteMessage}
              setMessage={setMessage}
            />
          </>
        ) : null}

        {activeSection === "guests" ? (
          <div className="guests-workspace">
            <RsvpManagementPanel
              onDelete={handleDeleteRsvp}
              onUpdate={handleUpdateRsvp}
              query={query}
              rsvps={rsvps}
              setQuery={setQuery}
              setStatus={setStatus}
              status={status}
            />
            <div className="guests-side-panels">
              <GuestForm handleCreateGuest={handleCreateGuest} />
              <InviteDeliveryPanel
                copyInviteLink={copyInviteLink}
                getInviteLink={getInviteLink}
                getInviteMessage={getInviteMessage}
              />
            </div>
          </div>
        ) : null}

        {activeSection === "gifts" ? (
          <div className="admin-two-columns">
            <GiftsList gifts={gifts} onDelete={handleDeleteGift} />
            <GiftForm handleCreateGift={handleCreateGift} />
          </div>
        ) : null}

        {activeSection === "settings" ? (
          <SettingsForm content={content} handleSaveContent={handleSaveContent} />
        ) : null}
      </section>
    </main>
  );
}

function getFriendlyError(reason: unknown, fallback: string) {
  if (reason instanceof ZodError) {
    return reason.issues.map((issue) => issue.message).join(" ");
  }

  return reason instanceof Error ? reason.message : fallback;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const totalCapacity = 100;

function getDaysToDeadline() {
  const deadline = new Date(eventInfo.rsvpDeadlineIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((deadline - now) / 86_400_000));
}

function DashboardPanel({
  confirmedPeople,
  confirmedRsvps,
  declinedRsvps,
  generatePresencePdf,
  noShowRsvps,
  views,
}: {
  confirmedPeople: number;
  confirmedRsvps: number;
  declinedRsvps: number;
  generatePresencePdf: () => void;
  noShowRsvps: number;
  views: InviteViewRecord[];
}) {
  const attendancePercent = Math.min(
    100,
    Math.round((confirmedPeople / totalCapacity) * 100),
  );
  const remaining = Math.max(totalCapacity - confirmedPeople, 0);
  const daysToDeadline = getDaysToDeadline();
  const deviceStats = {
    Celular: views.filter((view) => view.deviceType === "Celular").length,
    Computador: views.filter((view) => view.deviceType === "Computador").length,
    Tablet: views.filter((view) => view.deviceType === "Tablet").length,
  };
  const maxDeviceViews = Math.max(1, ...Object.values(deviceStats));

  return (
    <section className="power-dashboard" aria-label="Resumo do convite">
      <div className="dashboard-title">
        <div>
          <span className="section-eyebrow">Estatísticas</span>
          <h2>Dashboard do Convite</h2>
          <p>Resumo das respostas, alcance do link e ocupação prevista.</p>
        </div>
        <div className="dashboard-actions">
          <button className="report-button" onClick={generatePresencePdf}>
            <FileText size={17} />
            Gerar PDF
          </button>
          <div className="dashboard-deadline">
            <Timer size={18} />
            <span>{daysToDeadline} dias para confirmar</span>
          </div>
        </div>
      </div>

      <div className="dashboard-kpis">
        <DashboardCard
          accent="blue"
          icon={Eye}
          label="Visualizações"
          value={views.length}
          detail="únicas por navegador/aparelho"
        />
        <DashboardCard
          accent="green"
          icon={UserCheck}
          label="Confirmou Presença"
          value={confirmedRsvps}
          detail={`${confirmedPeople} pessoa(s) confirmada(s)`}
        />
        <DashboardCard
          accent="red"
          icon={UserX}
          label="Recusados"
          value={declinedRsvps}
          detail="respostas que não poderão comparecer"
        />
        <DashboardCard
          accent="purple"
          icon={Users}
          label="Não compareceu"
          value={noShowRsvps}
          detail="marcação administrativa pós-evento"
        />
        <DashboardCard
          accent="gold"
          icon={TrendingUp}
          label="Ocupação"
          value={`${attendancePercent}%`}
          detail={`${confirmedPeople} de ${totalCapacity} pessoas`}
        />
      </div>

      <div className="dashboard-analytics">
        <article className="dashboard-chart-card">
          <div className="chart-card-header">
            <div>
              <span>Capacidade total</span>
              <strong>{confirmedPeople}/{totalCapacity}</strong>
            </div>
            <BarChart3 size={22} />
          </div>
          <div className="capacity-meter">
            <div style={{ width: `${attendancePercent}%` }} />
          </div>
          <div className="capacity-legend">
            <span>{confirmedPeople} confirmados</span>
            <span>{remaining} vagas restantes</span>
          </div>
        </article>

        <article className="dashboard-chart-card">
          <div className="chart-card-header">
            <div>
              <span>Visualizações por aparelho</span>
              <strong>{views.length} acesso(s) único(s)</strong>
            </div>
            <MonitorSmartphone size={22} />
          </div>
          <div className="device-bars">
            {Object.entries(deviceStats).map(([device, amount]) => (
              <div className="device-bar-row" key={device}>
                <span>{device}</span>
                <div>
                  <i style={{ width: `${(amount / maxDeviceViews) * 100}%` }} />
                </div>
                <strong>{amount}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-chart-card deadline-card">
          <div className="chart-card-header">
            <div>
              <span>Prazo de confirmação</span>
              <strong>{eventInfo.rsvpDeadlineLabel}</strong>
            </div>
            <Timer size={22} />
          </div>
          <p>
            Acompanhe as confirmações até o prazo e mantenha a lista final perto
            do limite de {totalCapacity} pessoas.
          </p>
        </article>
      </div>
    </section>
  );
}

function DashboardCard({
  accent,
  detail,
  icon: Icon,
  label,
  value,
}: {
  accent: "blue" | "green" | "red" | "gold" | "purple";
  detail: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <article className={`dashboard-kpi ${accent}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
      <Icon size={24} />
    </article>
  );
}

function getStatusLabel(status: OpenRsvpRecord["status"]) {
  if (status === "confirmed") return "Presente";
  if (status === "declined") return "Recusado";
  return "Não compareceu";
}

function getComparableName(name: string) {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getRsvpListedPeople(rsvp: OpenRsvpRecord) {
  const holderName = rsvp.name.trim();

  if (rsvp.status !== "confirmed") {
    return holderName ? [holderName] : [];
  }

  const listedPeople = rsvp.people.map((person) => person.trim()).filter(Boolean);
  const people = holderName ? [holderName, ...listedPeople] : listedPeople;
  const seen = new Set<string>();

  return people.filter((person) => {
    const comparable = getComparableName(person);
    if (!comparable || seen.has(comparable)) return false;
    seen.add(comparable);
    return true;
  });
}

function RsvpPanel({ rsvps }: { rsvps: OpenRsvpRecord[] }) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"recent" | "az" | "za">("az");
  const rows = useMemo(() => {
    return rsvps.flatMap((rsvp) => {
      const people = getRsvpListedPeople(rsvp);
      const isIndividual = people.length === 1;
      const holder = getComparableName(rsvp.name);

      return people.map((person, index) => {
        const personName = person.trim() || rsvp.name;
        const isHolder = getComparableName(personName) === holder;

        return {
          id: `${rsvp.id}-${index}`,
          name: personName,
          holder: isIndividual ? "Individual" : isHolder ? "Titular" : rsvp.name,
          status: rsvp.status,
          createdAt: rsvp.createdAt,
        };
      });
    });
  }, [rsvps]);
  const duplicatedNames = useMemo(() => {
    const counts = rows.reduce<Record<string, number>>((accumulator, row) => {
      const comparable = getComparableName(row.name);
      if (!comparable) return accumulator;
      accumulator[comparable] = (accumulator[comparable] ?? 0) + 1;
      return accumulator;
    }, {});

    return new Set(
      Object.entries(counts)
        .filter(([, count]) => count > 1)
        .map(([name]) => name),
    );
  }, [rows]);
  const filteredRows = rows
    .filter((row) =>
      `${row.name} ${row.holder}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((firstRow, secondRow) => {
      if (sortMode === "recent") return 0;

      const comparison = firstRow.name.localeCompare(secondRow.name, "pt-BR", {
        sensitivity: "base",
      });

      return sortMode === "az" ? comparison : -comparison;
    });

  return (
    <article className="admin-panel rsvp-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Lista de Presença</h2>
          <p>Uma linha para cada pessoa listada no convite.</p>
        </div>
        <div className="confirmed-tools">
          <label className="confirmed-search">
            <Search size={16} />
            <input
              aria-label="Filtrar nomes confirmados"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filtrar por nome"
              value={search}
            />
          </label>
          <select
            aria-label="Ordenar lista de presença"
            onChange={(event) =>
              setSortMode(event.target.value as "recent" | "az" | "za")
            }
            value={sortMode}
          >
            <option value="az">Ordem alfabética A-Z</option>
            <option value="za">Ordem alfabética Z-A</option>
            <option value="recent">Mais recentes</option>
          </select>
        </div>
      </div>
      <div className="confirmed-table">
        {filteredRows.length === 0 ? (
          <p className="empty-state">Nenhuma confirmação recebida ainda.</p>
        ) : (
          <>
            <div className="confirmed-row confirmed-head">
              <span>Nome</span>
              <span>Titular do convite</span>
              <span>Status</span>
              <span>Data</span>
            </div>
            {filteredRows.map((row) => (
              <div
                className={`confirmed-row ${row.status} ${
                  duplicatedNames.has(getComparableName(row.name)) ? "duplicate" : ""
                }`}
                key={row.id}
              >
                <strong>
                  {row.name}
                  {duplicatedNames.has(getComparableName(row.name)) ? (
                    <small>Duplicado</small>
                  ) : null}
                </strong>
                <span>{row.holder}</span>
                <em>{getStatusLabel(row.status)}</em>
                <span>
                  {row.createdAt
                    ? new Intl.DateTimeFormat("pt-BR").format(new Date(row.createdAt))
                    : "-"}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </article>
  );
}

function RsvpManagementPanel({
  onDelete,
  onUpdate,
  query,
  rsvps,
  setQuery,
  setStatus,
  status,
}: {
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (
    id: string,
    payload: {
      name: string;
      phone: string;
      people: string[];
      status: OpenRsvpRecord["status"];
    },
  ) => void | Promise<void>;
  query: string;
  rsvps: OpenRsvpRecord[];
  setQuery: (value: string) => void;
  setStatus: (value: string) => void;
  status: string;
}) {
  const [cardFilter, setCardFilter] = useState<"recent" | "az" | "mostPeople">(
    "recent",
  );
  const filteredRsvps = rsvps
    .filter((rsvp) => {
      const matchesQuery = `${rsvp.name} ${rsvp.phone} ${rsvp.people.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = status === "all" || rsvp.status === status;
      return matchesQuery && matchesStatus;
    })
    .sort((firstRsvp, secondRsvp) => {
      if (cardFilter === "az") {
        return firstRsvp.name.localeCompare(secondRsvp.name, "pt-BR", {
          sensitivity: "base",
        });
      }

      if (cardFilter === "mostPeople") {
        return (
          getRsvpListedPeople(secondRsvp).length - getRsvpListedPeople(firstRsvp).length
        );
      }

      return 0;
    });

  return (
    <article className="admin-panel rsvp-management-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Convidados</h2>
          <p>Edite confirmações, vincule acompanhantes e atualize desistências.</p>
        </div>
        <div className="admin-controls">
          <label>
            <Search size={16} />
            <input
              aria-label="Buscar convidados confirmados"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome"
              value={query}
            />
          </label>
          <select
            aria-label="Filtrar status"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="all">Todos</option>
            <option value="confirmed">Presentes</option>
            <option value="declined">Recusados</option>
            <option value="no_show">Não compareceu</option>
          </select>
          <select
            aria-label="Ordenar cards"
            onChange={(event) =>
              setCardFilter(event.target.value as "recent" | "az" | "mostPeople")
            }
            value={cardFilter}
          >
            <option value="recent">Mais recentes</option>
            <option value="az">Ordem alfabética</option>
            <option value="mostPeople">Mais pessoas</option>
          </select>
        </div>
      </div>

      <div className="rsvp-editor-list">
        {filteredRsvps.length === 0 ? (
          <p className="empty-state">Nenhuma resposta encontrada.</p>
        ) : (
          filteredRsvps.map((rsvp) => (
            <RsvpEditorCard
              key={rsvp.id}
              onDelete={onDelete}
              onUpdate={onUpdate}
              rsvp={rsvp}
            />
          ))
        )}
      </div>
    </article>
  );
}

function RsvpEditorCard({
  onDelete,
  onUpdate,
  rsvp,
}: {
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (
    id: string,
    payload: {
      name: string;
      phone: string;
      people: string[];
      status: OpenRsvpRecord["status"];
    },
  ) => void | Promise<void>;
  rsvp: OpenRsvpRecord;
}) {
  const [name, setName] = useState(rsvp.name);
  const [phone, setPhone] = useState(rsvp.phone ?? "");
  const [peopleText, setPeopleText] = useState(
    getRsvpListedPeople(rsvp).join("\n"),
  );
  const [nextStatus, setNextStatus] = useState<OpenRsvpRecord["status"]>(
    rsvp.status,
  );

  useEffect(() => {
    setName(rsvp.name);
    setPhone(rsvp.phone ?? "");
    setPeopleText(getRsvpListedPeople(rsvp).join("\n"));
    setNextStatus(rsvp.status);
  }, [rsvp]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onUpdate(rsvp.id, {
      name,
      phone,
      people: peopleText
        .split("\n")
        .map((person) => person.trim())
        .filter(Boolean),
      status: nextStatus,
    });
  }

  function deleteRecord() {
    if (!window.confirm(`Excluir o registro de ${rsvp.name}?`)) return;
    onDelete(rsvp.id);
  }

  return (
    <form className={`rsvp-editor-card ${nextStatus}`} onSubmit={submit}>
      <div className="rsvp-editor-summary">
        <div className="rsvp-editor-title-box">
          <span>{getStatusLabel(nextStatus)}</span>
          <strong>{rsvp.name}</strong>
        </div>
        <div className="rsvp-editor-actions">
          <small>
            {rsvp.status === "confirmed" ? getRsvpListedPeople(rsvp).length : 0} pessoa(s)
          </small>
          <button
            aria-label={`Excluir registro de ${rsvp.name}`}
            onClick={deleteRecord}
            title="Excluir registro"
            type="button"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="rsvp-editor-fields">
        <label className="rsvp-field-box">
          Titular
          <input onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <label className="rsvp-field-box">
          Telefone
          <input onChange={(event) => setPhone(event.target.value)} value={phone} />
        </label>
        <label className="rsvp-field-box">
          Status
          <select
            onChange={(event) =>
              setNextStatus(event.target.value as OpenRsvpRecord["status"])
            }
            value={nextStatus}
          >
            <option value="confirmed">Presente</option>
            <option value="declined">Desistência / recusado</option>
            <option value="no_show">Não compareceu</option>
          </select>
        </label>
      </div>

      <label className="companions-editor rsvp-field-box">
        Titular e acompanhantes
        <textarea
          onChange={(event) => setPeopleText(event.target.value)}
          rows={3}
          value={peopleText}
        />
        <small>Uma pessoa por linha.</small>
      </label>

      <button className="primary-button compact-button" type="submit">
        Salvar alteração
      </button>
    </form>
  );
}

function InviteDeliveryPanel({
  copyInviteLink,
  getInviteLink,
  getInviteMessage,
}: {
  copyInviteLink: () => void;
  getInviteLink: () => string;
  getInviteMessage: () => string;
}) {
  const [email, setEmail] = useState("");
  const [chatPhone, setChatPhone] = useState("");
  const cleanPhone = chatPhone.replace(/\D/g, "");

  return (
    <article className="admin-panel route-form delivery-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Envio do link</h2>
          <p>Envie o convite único por e-mail ou chat.</p>
        </div>
        <MessageCircle size={18} />
      </div>
      <label>
        E-mail
        <input
          onChange={(event) => setEmail(event.target.value)}
          placeholder="convidado@email.com"
          type="email"
          value={email}
        />
      </label>
      <a
        className="delivery-button"
        href={`mailto:${email}?subject=${encodeURIComponent(
          "Convite Juliane 15 anos",
        )}&body=${encodeURIComponent(getInviteMessage())}`}
      >
        <Mail size={16} />
        Enviar por e-mail
      </a>
      <label>
        Telefone para chat
        <input
          onChange={(event) => setChatPhone(event.target.value)}
          placeholder="DDD + número"
          value={chatPhone}
        />
      </label>
      <a
        className="delivery-button"
        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
          getInviteMessage(),
        )}`}
        rel="noreferrer"
        target="_blank"
      >
        <MessageCircle size={16} />
        Enviar por WhatsApp
      </a>
      <button className="ghost-button delivery-copy" onClick={copyInviteLink}>
        <Copy size={16} />
        Copiar link único
      </button>
      <p className="delivery-link">{getInviteLink()}</p>
    </article>
  );
}

function GuestForm({
  handleCreateGuest,
}: {
  handleCreateGuest: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form className="admin-panel route-form" action={handleCreateGuest}>
      <div className="admin-panel-header">
        <h2>Adicionar convite</h2>
        <Plus size={18} />
      </div>
      <label>
        Titular
        <input name="name" placeholder="Nome do titular" required />
      </label>
      <label>
        Telefone
        <input name="phone" placeholder="Opcional" />
      </label>
      <label>
        Acompanhantes
        <textarea
          name="companions"
          placeholder="Digite um acompanhante por linha"
          rows={5}
        />
      </label>
      <button className="primary-button" type="submit">
        Incluir titular e acompanhantes
      </button>
    </form>
  );
}

function GiftForm({
  handleCreateGift,
}: {
  handleCreateGift: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form className="admin-panel route-form" action={handleCreateGift}>
      <div className="admin-panel-header">
        <h2>Novo presente</h2>
        <Gift size={18} />
      </div>
      <label>
        Categoria
        <input
          name="category"
          placeholder="Ex.: Maquiagem e Beleza"
          required
        />
      </label>
      <label>
        Nome do produto
        <input name="name" placeholder="Ex.: Gloss" required />
      </label>
      <button className="primary-button" type="submit">
        Salvar presente
      </button>
    </form>
  );
}

function GiftsList({
  gifts,
  onDelete,
}: {
  gifts: AdminGift[];
  onDelete: (id: string) => void;
}) {
  return (
    <article className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Sugestões de presentes</h2>
          <p>Catalogue itens para incluir na lista do convite.</p>
        </div>
      </div>
      <div className="gift-admin-list">
        {gifts.length === 0 ? (
          <p className="empty-state">Nenhum presente cadastrado ainda.</p>
        ) : (
          gifts.map((gift) => (
            <div className="gift-admin-card" key={gift.id}>
              <div>
                <span>{gift.category}</span>
                <strong>{gift.name}</strong>
              </div>
              <button onClick={() => onDelete(gift.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function SettingsForm({
  content,
  handleSaveContent,
}: {
  content: AdminContent;
  handleSaveContent: (formData: FormData) => void;
}) {
  return (
    <form className="admin-panel route-form settings-form" action={handleSaveContent}>
      <div className="admin-panel-header">
        <div>
          <h2>Configurações e textos</h2>
          <p>Campos preparados para as edicoes propostas no convite.</p>
        </div>
        <Save size={18} />
      </div>
      <label>
        Nome/titulo principal
        <input defaultValue={content.heroTitle} name="heroTitle" />
      </label>
      <label>
        Frase principal
        <textarea defaultValue={content.heroSubtitle} name="heroSubtitle" rows={2} />
      </label>
      <label>
        Texto do convite
        <textarea defaultValue={content.inviteText} name="inviteText" rows={4} />
      </label>
      <label>
        Texto O universo da Juliane
        <textarea defaultValue={content.aboutText} name="aboutText" rows={5} />
      </label>
      <label>
        Mensagem final
        <textarea defaultValue={content.finalText} name="finalText" rows={4} />
      </label>
      <label>
        Traje sugerido
        <input defaultValue={content.dressCode} name="dressCode" />
      </label>
      <label>
        Estacionamento
        <input defaultValue={content.parking} name="parking" />
      </label>
      <label>
        Regras para criancas
        <input defaultValue={content.childrenRules} name="childrenRules" />
      </label>
      <label>
        Horario recomendado de chegada
        <input defaultValue={content.arrivalTime} name="arrivalTime" />
      </label>
      <label>
        Telefone de contato
        <input defaultValue={content.contactPhone} name="contactPhone" />
      </label>
      <button className="primary-button" type="submit">
        Salvar edicoes
      </button>
    </form>
  );
}

function SharePanel({
  getInviteLink,
  getInviteMessage,
  copyInviteLink,
  copyInviteMessage,
  setMessage,
}: {
  getInviteLink: () => string;
  getInviteMessage: () => string;
  copyInviteLink: () => void;
  copyInviteMessage: () => void;
  setMessage: (message: string) => void;
}) {
  return (
    <article className="admin-panel share-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Convite para enviar</h2>
          <p>O link e igual para todos. Copie o texto pronto e envie pelo WhatsApp.</p>
        </div>
        <MessageCircle size={22} />
      </div>
      <div className="theme-preview">
        <div>
          <span>Cartão clicável</span>
          <strong>Abrir Convite</strong>
          <p>Use este cartão virtual como imagem de preview do link do convite.</p>
          <div className="share-actions">
            <a href="/images/cartao-abrir-convite-juliane-v1.png" target="_blank">
              Abrir cartão
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/images/cartao-abrir-convite-juliane-v1.png`,
                );
                setMessage("Link do cartão virtual copiado.");
              }}
            >
              <Copy size={15} />
              Copiar link do cartão
            </button>
          </div>
        </div>
      </div>
      <div className="share-grid">
        <div className="share-card">
          <div>
            <strong>Convite único da Juliane</strong>
            <span>{getInviteLink()}</span>
          </div>
          <div className="share-actions">
            <button onClick={copyInviteLink}>
              <LinkIcon size={15} />
              Link
            </button>
            <button onClick={copyInviteMessage}>
              <MessageCircle size={15} />
              Texto
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(getInviteMessage())}`}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
