"use client";

import {
  Copy,
  Download,
  Gift,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  MessageCircle,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Users,
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
import {
  calculateDashboardStats,
  createLocalGuest,
  listLocalGuests,
} from "@/lib/guest-service";
import { listOpenRsvps } from "@/lib/open-rsvp-service";
import type { Guest, OpenRsvpRecord } from "@/lib/types";
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

  const guestStats = calculateDashboardStats(guests);
  const confirmedRsvps = rsvps.filter((rsvp) => rsvp.status === "confirmed");
  const declinedRsvps = rsvps.filter((rsvp) => rsvp.status === "declined");
  const confirmedPeople = confirmedRsvps.reduce(
    (total, rsvp) => total + rsvp.totalPeople,
    0,
  );

  async function loadAdminData() {
    setGuests(listLocalGuests());
    setContent(getAdminContent());

    try {
      const [savedRsvps, savedGifts] = await Promise.all([
        listOpenRsvps(),
        listGifts(),
      ]);
      setRsvps(savedRsvps);
      setGifts(savedGifts);
    } catch {
      setRsvps([]);
      setGifts([]);
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
      .map((rsvp) =>
        [
          "confirmação",
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
            <div className="admin-metrics">
              {[
                ["Lista controle", guestStats.totalGuests],
                ["Confirmacoes", confirmedRsvps.length],
                ["Recusados", declinedRsvps.length],
                ["Pessoas", confirmedPeople],
                ["Presentes", gifts.length],
                ["Prazo", eventInfo.rsvpDeadlineLabel],
              ].map(([label, value]) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>
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
          <div className="admin-two-columns">
            <GuestsPanel
              copyInviteLink={copyInviteLink}
              filteredGuests={filteredGuests}
              query={query}
              setQuery={setQuery}
              setStatus={setStatus}
              status={status}
            />
            <GuestForm handleCreateGuest={handleCreateGuest} />
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

function RsvpPanel({ rsvps }: { rsvps: OpenRsvpRecord[] }) {
  return (
    <article className="admin-panel rsvp-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Confirmacoes recebidas</h2>
          <p>Respostas enviadas pelo link único do convite.</p>
        </div>
      </div>
      <div className="rsvp-list">
        {rsvps.length === 0 ? (
          <p className="empty-state">Nenhuma confirmação recebida ainda.</p>
        ) : (
          rsvps.map((rsvp) => (
            <div className="rsvp-card" key={rsvp.id}>
              <div>
                <strong>{rsvp.name}</strong>
                <span>{rsvp.phone}</span>
              </div>
              <em className={rsvp.status}>{rsvp.status}</em>
              <p>{rsvp.people.join(", ") || "Não comparecerá"}</p>
              <small>{rsvp.totalPeople} pessoa(s)</small>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function GuestsPanel({
  filteredGuests,
  query,
  status,
  setQuery,
  setStatus,
  copyInviteLink,
}: {
  filteredGuests: Guest[];
  query: string;
  status: string;
  setQuery: (value: string) => void;
  setStatus: (value: string) => void;
  copyInviteLink: () => void;
}) {
  return (
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
        {filteredGuests.length === 0 ? (
          <p className="empty-state">Nenhuma pessoa cadastrada.</p>
        ) : (
          filteredGuests.map((guest) => (
            <div className="admin-row" key={guest.id}>
              <span>{guest.mainGuestName}</span>
              <em className={guest.status}>{guest.status}</em>
              <span>Convite único</span>
              <button onClick={copyInviteLink} title="Copiar link">
                <Copy size={15} />
              </button>
            </div>
          ))
        )}
      </div>
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
      <button className="primary-button" type="submit">
        Adicionar pessoa
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
