"use client";

import {
  Copy,
  Download,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { eventInfo } from "@/lib/event";
import {
  calculateDashboardStats,
  createLocalGuest,
  listLocalGuests,
} from "@/lib/guest-service";
import { listOpenRsvps } from "@/lib/open-rsvp-service";
import type { Guest, OpenRsvpRecord } from "@/lib/types";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvps, setRsvps] = useState<OpenRsvpRecord[]>([]);
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
      const matchesQuery = `${guest.mainGuestName} ${guest.phone} ${guest.inviteCode}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = status === "all" || guest.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [guests, query, status]);

  const guestStats = calculateDashboardStats(guests);
  const confirmedRsvps = rsvps.filter((rsvp) => rsvp.status === "confirmed");
  const declinedRsvps = rsvps.filter((rsvp) => rsvp.status === "declined");
  const confirmedPeople = confirmedRsvps.reduce(
    (total, rsvp) => total + rsvp.totalPeople,
    0,
  );

  async function loadAdminData() {
    setGuests(listLocalGuests());
    try {
      setRsvps(await listOpenRsvps());
    } catch {
      setRsvps([]);
      setMessage(
        "Firebase ativo: as confirmacoes sao salvas em rsvps. Para listar no painel sem login, crie uma API administrativa server-side; por enquanto consulte no Firebase Console.",
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
      createLocalGuest({
        mainGuestName: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        maxCompanions: 999,
        active: true,
        notes: String(formData.get("notes") ?? ""),
        origin: "admin-code",
      });

      setMessage("Pessoa adicionada a lista.");
      await loadAdminData();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Nao foi possivel cadastrar o convidado.",
      );
    }
  }

  function exportCsv() {
    const header = "tipo,nome,telefone,status,total_pessoas,pessoas\n";
    const rsvpRows = rsvps
      .map((rsvp) =>
        [
          "confirmacao",
          rsvp.name,
          rsvp.phone,
          rsvp.status,
          rsvp.totalPeople,
          rsvp.people.join("|"),
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const guestRows = filteredGuests
      .map((guest) =>
        [
          "controle",
          guest.mainGuestName,
          guest.phone,
          guest.status,
          "",
          "",
        ]
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

  function getInviteLink() {
    return `${window.location.origin}/convite`;
  }

  function getInviteMessage() {
    return `Ola! Voce esta convidado(a) para celebrar os 15 anos da Juliane em uma noite muito especial.

Data: ${eventInfo.dateLabel}
Horario: ${eventInfo.timeLabel}
Local: ${eventInfo.venueName}

Confirme sua presenca pelo convite digital:
${getInviteLink()}

Esperamos voce sob as estrelas.`;
  }

  async function copyInviteLink() {
    await navigator.clipboard.writeText(getInviteLink());
    setMessage("Link unico do convite copiado.");
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
            <span className="section-eyebrow">Area restrita</span>
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
        <button className="active">
          <LayoutDashboard size={17} />
          Dashboard
        </button>
        <button>
          <Users size={17} />
          Convidados
        </button>
        <button>
          <ShieldCheck size={17} />
          Configuracoes
        </button>
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
              Modo por codigo ativo. O convite usa um unico link para todos, e a
              lista abaixo serve apenas para controle dos nomes.
            </p>
          </div>
          <button className="ghost-button" onClick={exportCsv}>
            <Download size={16} />
            Exportar CSV
          </button>
        </header>

        <div className="admin-metrics">
          {[
            ["Total", guestStats.totalGuests],
            ["Confirmacoes", confirmedRsvps.length],
            ["Pendentes", guestStats.pending],
            ["Recusados", declinedRsvps.length],
            ["Pessoas", confirmedPeople],
            ["Lista controle", guestStats.totalGuests],
            ["Confirmacao", `${guestStats.confirmationRate}%`],
            ["Prazo", eventInfo.rsvpDeadlineLabel],
          ].map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <article className="admin-panel rsvp-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Confirmacoes recebidas</h2>
              <p>
                Respostas enviadas pelo link unico do convite. Cada resposta pode
                conter quantas pessoas forem informadas no formulario.
              </p>
            </div>
          </div>
          <div className="rsvp-list">
            {rsvps.length === 0 ? (
              <p className="empty-state">Nenhuma confirmacao recebida ainda.</p>
            ) : (
              rsvps.map((rsvp) => (
                <div className="rsvp-card" key={rsvp.id}>
                  <div>
                    <strong>{rsvp.name}</strong>
                    <span>{rsvp.phone}</span>
                  </div>
                  <em className={rsvp.status}>{rsvp.status}</em>
                  <p>{rsvp.people.join(", ") || "Nao comparecera"}</p>
                  <small>{rsvp.totalPeople} pessoa(s)</small>
                </div>
              ))
            )}
          </div>
        </article>

        <div className="admin-two-columns">
          <article className="admin-panel">
            <div className="admin-panel-header">
              <h2>Convidados</h2>
              <div className="admin-controls">
                <label>
                  <Search size={16} />
                  <input
                    aria-label="Buscar convidados"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar"
                    value={query}
                  />
                </label>
                <select
                  aria-label="Filtrar status"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="declined">Recusados</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>
            </div>
            <div className="admin-table admin-live-table">
              {filteredGuests.map((guest) => (
                <div className="admin-row" key={guest.id}>
                  <span>{guest.mainGuestName}</span>
                  <em className={guest.status}>{guest.status}</em>
                  <span>Convite unico</span>
                  <button onClick={() => copyInviteLink()} title="Copiar link">
                    <Copy size={15} />
                  </button>
                </div>
              ))}
            </div>
          </article>

          <form className="admin-panel route-form" action={handleCreateGuest}>
            <div className="admin-panel-header">
              <h2>Adicionar pessoa</h2>
              <Plus size={18} />
            </div>
            <label>
              Nome
              <input name="name" required />
            </label>
            <label>
              Telefone
              <input name="phone" />
            </label>
            <label>
              Observacoes
              <input name="notes" />
            </label>
            {message ? <p className="form-success">{message}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button" type="submit">
              Adicionar pessoa
            </button>
          </form>
        </div>

        <article className="admin-panel share-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Convite para enviar</h2>
              <p>
                O link e igual para todos. Copie o texto pronto e envie pelo
                WhatsApp para quem quiser convidar.
              </p>
            </div>
            <MessageCircle size={22} />
          </div>
          <div className="theme-preview">
            <div>
              <span>Imagem do tema</span>
              <strong>Uma Noite Estrelada</strong>
              <p>
                Use esta imagem como capa visual junto com o link unico do convite.
              </p>
              <div className="share-actions">
                <a href="/images/starry-night-hero.png" target="_blank">
                  Abrir imagem
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/images/starry-night-hero.png`,
                    );
                    setMessage("Link da imagem do tema copiado.");
                  }}
                >
                  <Copy size={15} />
                  Copiar link da imagem
                </button>
              </div>
            </div>
          </div>
          <div className="share-grid">
            <div className="share-card">
              <div>
                <strong>Convite unico da Juliane</strong>
                <span>{getInviteLink()}</span>
              </div>
              <div className="share-actions">
                <button onClick={() => copyInviteLink()}>
                  <LinkIcon size={15} />
                  Link
                </button>
                <button onClick={() => copyInviteMessage()}>
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
      </section>
    </main>
  );
}
