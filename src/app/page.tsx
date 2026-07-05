"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Gift,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  Menu,
  Moon,
  Music2,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { submitOpenRsvp } from "@/lib/open-rsvp-service";

const eventDate = new Date("2026-09-04T20:00:00-03:00").getTime();
const mapsUrl = "https://maps.app.goo.gl/DxDRcY8edMxiECuA6";

const privateNav = [
  { label: "Inicio", target: "universo", icon: Star },
  { label: "Juliane", target: "perfil", icon: Heart },
  { label: "Memorias", target: "memorias", icon: ImageIcon },
  { label: "Presentes", target: "presentes", icon: Gift },
  { label: "Festa", target: "festa", icon: MapPin },
];

const giftItems = [
  {
    category: "Beleza",
    name: "Perfume especial",
    detail: "Sugestao elegante para uma nova fase.",
    meta: "Prioridade alta",
  },
  {
    category: "Acessorios",
    name: "Joia delicada",
    detail: "Tons dourados ou prata clara combinam com o tema.",
    meta: "Sem preco obrigatorio",
  },
  {
    category: "Experiencias",
    name: "Dia de passeio",
    detail: "Uma lembranca vivida tambem pode virar estrela.",
    meta: "Opcional",
  },
];

const timeline = [
  "Uma pequena estrela nasceu",
  "Primeiros passos",
  "Primeiros sonhos",
  "Momentos inesqueciveis",
  "Amigos e familia",
  "Chegaram os 15 anos",
];

const adminMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Convidados", icon: Users },
  { label: "Galeria", icon: ImageIcon },
  { label: "Presentes", icon: Gift },
  { label: "Seguranca", icon: ShieldCheck },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function useCountdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    if (!now) {
      return { days: "--", hours: "--", minutes: "--", seconds: "--" };
    }

    const diff = Math.max(eventDate - now, 0);
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff / 3_600_000) % 24);
    const minutes = Math.floor((diff / 60_000) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  }, [now]);
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.75, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Countdown({ compact = false }: { compact?: boolean }) {
  const values = useCountdown();
  const items = [
    ["DIAS", values.days],
    ["HORAS", values.hours],
    ["MINUTOS", values.minutes],
    ["SEGUNDOS", values.seconds],
  ];

  return (
    <div className={compact ? "countdown countdown-compact" : "countdown"}>
      {items.map(([label, value]) => (
        <div className="countdown-card" key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function OpeningScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.section
      className="opening-screen"
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
    >
      <div className="shooting-star" />
      <motion.p
        className="opening-kicker"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.8 }}
      >
        Uma noite especial esta prestes a comecar...
      </motion.p>
      <motion.div
        className="opening-title"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.35, duration: 1 }}
      >
        <span>Juliane</span>
        <strong>15 anos</strong>
      </motion.div>
      <motion.button
        className="primary-button opening-button"
        onClick={onOpen}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.05, duration: 0.7 }}
      >
        Abrir convite
      </motion.button>
    </motion.section>
  );
}

function Header({
  onRsvp,
  opened,
}: {
  onRsvp: () => void;
  opened: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    ["Convite", "convite"],
    ["Contagem", "contagem"],
    ["Universo", "universo"],
    ["Admin", "admin"],
  ];

  if (!opened) return null;

  return (
    <header className="site-header">
      <button className="brand-button" onClick={() => scrollToId("convite")}>
        Juliane <span>15</span>
      </button>
      <nav className="desktop-nav" aria-label="Navegacao principal">
        {links.map(([label, target]) => (
          <button key={target} onClick={() => scrollToId(target)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button className="icon-button" aria-label="Musica">
          <Music2 size={18} />
        </button>
        <button className="small-gold-button" onClick={onRsvp}>
          Confirmar
        </button>
        <button
          className="icon-button mobile-only"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mobile-menu-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ ease: "easeOut", duration: 0.28 }}
            >
              <button
                className="icon-button menu-close"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} />
              </button>
              {links.map(([label, target]) => (
                <button
                  key={target}
                  onClick={() => {
                    setMobileOpen(false);
                    scrollToId(target);
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                className="primary-button"
                onClick={() => {
                  setMobileOpen(false);
                  onRsvp();
                }}
              >
                Confirmar minha presenca
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function RsvpModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [answer, setAnswer] = useState<"yes" | "no">("yes");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState([""]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent(true);

    try {
      await submitOpenRsvp({
        name,
        phone,
        willAttend: answer === "yes",
        people,
        reviewed: true,
      });

      if (answer === "yes") onSuccess();
      else onClose();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Nao foi possivel concluir sua confirmacao.",
      );
    } finally {
      setSent(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.form
            className="rsvp-modal"
            onSubmit={submit}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
          >
            <button
              className="icon-button modal-close"
              type="button"
              aria-label="Fechar confirmacao"
              onClick={onClose}
            >
              <X size={18} />
            </button>
            <span className="section-eyebrow">RSVP</span>
            <h2>Voce faz parte desta historia.</h2>
            <p>
              A Juliane esta preparando uma noite muito especial e ficara muito
              feliz em compartilhar este momento com voce. Confirme ate 20 de
              agosto de 2026.
            </p>
            <label>
              Nome do convidado
              <input
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Digite seu nome"
                value={name}
              />
            </label>
            <label>
              Telefone ou WhatsApp
              <input
                onChange={(event) => setPhone(event.target.value)}
                required
                placeholder="(00) 00000-0000"
                value={phone}
              />
            </label>
            <div className="choice-grid" role="radiogroup" aria-label="Presenca">
              <button
                type="button"
                className={answer === "yes" ? "choice active" : "choice"}
                onClick={() => setAnswer("yes")}
              >
                Sim, estarei presente
              </button>
              <button
                type="button"
                className={answer === "no" ? "choice active" : "choice"}
                onClick={() => setAnswer("no")}
              >
                Infelizmente nao poderei comparecer
              </button>
            </div>
            {answer === "yes" ? (
              <div className="companions">
                <p>Adicione abaixo todas as pessoas que irao junto com voce.</p>
                {people.map((person, index) => (
                  <div className="person-row" key={index}>
                    <input
                      onChange={(event) => {
                        const nextPeople = [...people];
                        nextPeople[index] = event.target.value;
                        setPeople(nextPeople);
                      }}
                      placeholder={`Nome da pessoa ${index + 1}`}
                      value={person}
                    />
                    {people.length > 1 ? (
                      <button
                        aria-label="Remover pessoa"
                        className="mini-icon-button"
                        onClick={() =>
                          setPeople(people.filter((_, itemIndex) => itemIndex !== index))
                        }
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  className="add-person-button"
                  onClick={() => setPeople([...people, ""])}
                  type="button"
                >
                  <Plus size={16} />
                  Adicionar mais pessoa
                </button>
              </div>
            ) : null}
            <label className="checkbox-row">
              <input type="checkbox" required />
              <span>Revisei os dados informados.</span>
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button" disabled={sent} type="submit">
              {sent ? "Enviando..." : "Enviar confirmacao"}
            </button>
            <small>
              Os dados informados serao utilizados exclusivamente para
              organizacao e controle de presenca deste evento.
            </small>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SuccessOverlay({
  open,
  onEnter,
}: {
  open: boolean;
  onEnter: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="success-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="success-card"
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
          >
            <Sparkles size={32} />
            <h2>Presenca confirmada</h2>
            <p>
              Que alegria saber que voce estara conosco. Agora queremos
              compartilhar um pouco mais desse momento especial com voce.
            </p>
            <button className="primary-button" onClick={onEnter}>
              Entrar no universo da Juliane
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function AdminPreview() {
  const rows = [
    ["Ana Clara", "Confirmado", "2", "04/07/2026"],
    ["Familia Martins", "Pendente", "4", "-"],
    ["Lucas Ribeiro", "Recusado", "1", "02/07/2026"],
  ];

  return (
    <section className="admin-preview" id="admin">
      <Reveal className="section-heading admin-heading">
        <span className="section-eyebrow">Painel administrativo</span>
        <h2>Controle claro para os organizadores.</h2>
        <p>
          Uma area protegida por autenticacao, preparada para convidados,
          conteudo, galeria, presentes, configuracoes e relatorios.
        </p>
      </Reveal>
      <Reveal className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-logo">Juliane 15</div>
          {adminMenuItems.map(({ label, icon: Icon }) => (
            <button className={label === "Dashboard" ? "active" : ""} key={label}>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </aside>
        <div className="admin-main">
          <header className="admin-topbar">
            <div>
              <span>Dashboard</span>
              <strong>Resumo da festa</strong>
            </div>
            <div className="admin-search">
              <Search size={16} />
              <span>Buscar convidado</span>
            </div>
          </header>
          <div className="admin-metrics">
            {[
              ["Convites", "128"],
              ["Confirmados", "86"],
              ["Pendentes", "31"],
              ["Pessoas estimadas", "214"],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <div className="admin-content-grid">
            <article className="admin-panel">
              <h3>Confirmacoes recentes</h3>
              <div className="admin-table">
                {rows.map(([name, status, total, date]) => (
                  <div className="admin-row" key={name}>
                    <span>{name}</span>
                    <em className={status.toLowerCase()}>{status}</em>
                    <span>{total}</span>
                    <span>{date}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="admin-panel invite-card">
              <h3>Link unico</h3>
              <p>/convite</p>
              <button>
                <Copy size={16} />
                Copiar convite
              </button>
            </article>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function Home() {
  const [opened, setOpened] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const gallery = [
    { label: "Sonhos", gradient: "linear-gradient(135deg,#d8c07b,#635090)" },
    { label: "Familia", gradient: "linear-gradient(135deg,#b9d5ff,#182f63)" },
    { label: "Amigos", gradient: "linear-gradient(135deg,#f2d6a2,#3b1749)" },
    { label: "Memorias", gradient: "linear-gradient(135deg,#a8fff1,#101b47)" },
  ];

  return (
    <main>
      <Image
        className="site-background"
        src="/images/starry-night-hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className="stars-layer" />
      <div className="shooting-stars-layer" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <Header opened={opened} onRsvp={() => setRsvpOpen(true)} />
      <AnimatePresence>
        {!opened ? <OpeningScreen onOpen={() => setOpened(true)} /> : null}
      </AnimatePresence>

      <div className={opened ? "page-content visible" : "page-content"}>
        <section className="hero-section" id="convite">
          <Reveal className="hero-copy">
            <span className="section-eyebrow">Uma noite estrelada</span>
            <h1>Juliane</h1>
            <strong>15 anos</strong>
            <p className="hero-lead">
              Sob a luz das estrelas, um sonho esta prestes a se tornar
              realidade.
            </p>
            <p>
              Existem momentos que ficam guardados para sempre em nossa memoria.
              E este sera um deles. Com muita alegria, convidamos voce para
              celebrar uma noite muito especial.
            </p>
            <div className="event-pills">
              <span>04 de setembro de 2026</span>
              <span>20h00</span>
              <span>Cerimonial Palace</span>
            </div>
            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => setRsvpOpen(true)}
              >
                Confirmar minha presenca
              </button>
              <a className="ghost-button" href={mapsUrl} target="_blank">
                Ver localizacao
              </a>
            </div>
          </Reveal>
        </section>

        <section className="countdown-section" id="contagem">
          <Reveal className="section-heading">
            <span className="section-eyebrow">Contagem regressiva</span>
            <h2>O ceu ja comeca a se preparar.</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <Countdown />
          </Reveal>
        </section>

        <section className="story-section" id="universo">
          <Reveal className="section-heading">
            <span className="section-eyebrow">Capitulo 3</span>
            <h2>O universo da Juliane</h2>
            <p>
              Cada pessoa e feita de historias, sonhos, encontros e momentos
              inesqueciveis. A Juliane cresceu cercada de amor, construindo
              memorias, descobrindo sonhos e iluminando a vida das pessoas que
              caminham ao seu lado.
            </p>
          </Reveal>
        </section>

        <section className="profile-section" id="perfil">
          <Reveal className="profile-card">
            <div className="profile-photo">
              <Moon size={54} />
            </div>
            <div>
              <span className="section-eyebrow">Conheca nossa estrela</span>
              <h2>Juliane</h2>
              <p>
                Aos 15 anos, uma nova fase comeca. Esta festa representa mais
                do que uma comemoracao: e a celebracao de tudo o que ja foi
                vivido e de todos os sonhos que ainda estao por vir.
              </p>
            </div>
          </Reveal>
          <div className="detail-grid">
            {[
              "Hobbies",
              "Musicas favoritas",
              "Filmes e series",
              "Comida favorita",
              "Lugares dos sonhos",
              "Curiosidades",
            ].map((item, index) => (
              <Reveal className="detail-card" delay={index * 0.04} key={item}>
                <Sparkles size={18} />
                <h3>{item}</h3>
                <p>Placeholder editavel no painel administrativo.</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="timeline-section" id="memorias">
          <Reveal className="section-heading">
            <span className="section-eyebrow">Memorias</span>
            <h2>Uma historia desenhada em constelacoes.</h2>
          </Reveal>
          <div className="timeline">
            {timeline.map((item, index) => (
              <Reveal className="timeline-item" delay={index * 0.05} key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item}</h3>
                <p>Data, foto e descricao cadastraveis pelo painel.</p>
              </Reveal>
            ))}
          </div>
          <div className="gallery-grid">
            {gallery.map((photo, index) => (
              <button
                className="photo-tile"
                key={photo.label}
                style={{ background: photo.gradient }}
                onClick={() => setLightboxIndex(index)}
              >
                <span>{photo.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="gifts-section" id="presentes">
          <Reveal className="section-heading">
            <span className="section-eyebrow">Sonhos e presentes</span>
            <h2>Sua presenca e o nosso maior presente.</h2>
            <p>
              Para quem deseja presentear a Juliane, estas sugestoes podem ser
              cadastradas e organizadas por categoria.
            </p>
          </Reveal>
          <div className="gift-grid">
            {giftItems.map((gift) => (
              <Reveal className="gift-card" key={gift.name}>
                <span>{gift.category}</span>
                <h3>{gift.name}</h3>
                <p>{gift.detail}</p>
                <small>{gift.meta}</small>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="event-section" id="festa">
          <Reveal className="event-card">
            <span className="section-eyebrow">Informacoes importantes</span>
            <h2>Nos encontraremos sob as estrelas.</h2>
            <div className="info-grid">
              <div>
                <CalendarDays size={20} />
                <span>04 de setembro de 2026</span>
              </div>
              <div>
                <Clock size={20} />
                <span>20h00</span>
              </div>
              <div>
                <MapPin size={20} />
                <span>
                  Cerimonial Palace, Rodovia Cachoeiro x Alegre, Km 3,8,
                  Cachoeiro de Itapemirim - ES
                </span>
              </div>
            </div>
            <a className="primary-button" href={mapsUrl} target="_blank">
              Abrir no Google Maps
            </a>
          </Reveal>
          <Reveal className="final-message">
            <h2>Nos encontraremos sob as estrelas</h2>
            <p>
              Algumas noites passam. Outras se tornam lembrancas para toda a
              vida. Esperamos voce para celebrar conosco uma noite de sonhos,
              alegria e muitas estrelas.
            </p>
            <Countdown compact />
          </Reveal>
        </section>

        <AdminPreview />
      </div>

      <nav className="bottom-nav" aria-label="Navegacao da area privada">
        {privateNav.map(({ label, target, icon: Icon }) => (
          <button key={target} onClick={() => scrollToId(target)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <RsvpModal
        open={rsvpOpen}
        onClose={() => setRsvpOpen(false)}
        onSuccess={() => {
          setRsvpOpen(false);
          setSuccessOpen(true);
        }}
      />
      <SuccessOverlay
        open={successOpen}
        onEnter={() => {
          setSuccessOpen(false);
          scrollToId("universo");
        }}
      />

      <AnimatePresence>
        {lightboxIndex !== null ? (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="icon-button modal-close"
              aria-label="Fechar galeria"
              onClick={() => setLightboxIndex(null)}
            >
              <X size={20} />
            </button>
            <button
              className="icon-button lightbox-prev"
              aria-label="Foto anterior"
              onClick={() =>
                setLightboxIndex(
                  (lightboxIndex - 1 + gallery.length) % gallery.length,
                )
              }
            >
              <ChevronLeft />
            </button>
            <div
              className="lightbox-image"
              style={{ background: gallery[lightboxIndex].gradient }}
            >
              <span>{gallery[lightboxIndex].label}</span>
            </div>
            <button
              className="icon-button lightbox-next"
              aria-label="Proxima foto"
              onClick={() => setLightboxIndex((lightboxIndex + 1) % gallery.length)}
            >
              <ChevronRight />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
