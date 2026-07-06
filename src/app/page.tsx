"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Gift, MapPin, Plus, Sparkles, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { type AdminGift } from "@/lib/admin-store";
import { listGifts } from "@/lib/gift-service";
import { submitOpenRsvp } from "@/lib/open-rsvp-service";

const eventDate = new Date("2026-09-04T20:00:00-03:00").getTime();
const mapsUrl = "https://maps.app.goo.gl/DxDRcY8edMxiECuA6";

const fallbackGifts: AdminGift[] = [
  {
    id: "gift-perfume",
    category: "Beleza",
    name: "Perfume",
    description: "Sugestao delicada para marcar esta nova fase.",
    imageUrl: "",
    linkUrl: "",
    size: "",
    color: "",
    notes: "",
    priority: "Alta",
    active: true,
  },
  {
    id: "gift-joia",
    category: "Acessorios",
    name: "Joia ou semijoia",
    description: "Pecas em dourado, prata ou pontos de luz combinam com o tema.",
    imageUrl: "",
    linkUrl: "",
    size: "",
    color: "",
    notes: "",
    priority: "Media",
    active: true,
  },
  {
    id: "gift-experiencia",
    category: "Experiencias",
    name: "Presente livre",
    description: "Uma lembranca especial escolhida com carinho.",
    imageUrl: "",
    linkUrl: "",
    size: "",
    color: "",
    notes: "",
    priority: "Opcional",
    active: true,
  },
];

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
      initial={reducedMotion ? false : { opacity: 0, y: 22 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function OpeningScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.section
      className="opening-screen"
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="shooting-star" />
      <p className="opening-kicker">
        Uma noite especial esta prestes a comecar...
      </p>
      <div className="opening-title">
        <span>Juliane</span>
        <strong>15 anos</strong>
      </div>
      <button
        className="primary-button opening-button"
        onClick={onOpen}
      >
        Abrir convite
      </button>
    </motion.section>
  );
}

function InlineCountdown() {
  const values = useCountdown();

  return (
    <div className="inline-countdown" aria-label="Contagem regressiva">
      <span>Faltam</span>
      <strong>{values.days} dias</strong>
      <strong>{values.hours}h</strong>
      <strong>{values.minutes}m</strong>
      <strong>{values.seconds}s</strong>
    </div>
  );
}

function InvitationCard({
  onGifts,
  onRsvp,
}: {
  onGifts: () => void;
  onRsvp: () => void;
}) {
  return (
    <section className="single-invite-section" aria-label="Convite Juliane 15 anos">
      <Reveal className="single-invite-card">
        <div className="invite-ornament">
          <Sparkles size={18} />
          <span>Convite Especial</span>
          <Sparkles size={18} />
        </div>

        <div className="invite-title-block">
          <h1>Juliane</h1>
          <strong>15 anos</strong>
        </div>

        <p className="invite-phrase">
          Para viver as emocoes deste dia tao importante, quero estar ao lado de
          pessoas como voce!
        </p>

        <div className="invite-date-grid">
          <span className="invite-weekday">Sexta-feira</span>
          <strong className="invite-day">04</strong>
          <span className="invite-month">de setembro</span>
          <span className="invite-time">as 20:00</span>
        </div>

        <div className="invite-local">
          <span>Local</span>
          <strong>Cerimonial Palace</strong>
        </div>

        <InlineCountdown />

        <p className="invite-hint">Clique nos icones para interagir</p>

        <div className="invite-actions" aria-label="Acoes do convite">
          <button className="invite-action" onClick={onGifts} type="button">
            <Gift size={30} />
            <span>Sugestoes de presentes</span>
          </button>
          <button className="invite-action" onClick={onRsvp} type="button">
            <CheckCircle2 size={32} />
            <span>Confirme sua presenca</span>
          </button>
          <a className="invite-action" href={mapsUrl} target="_blank">
            <MapPin size={31} />
            <span>Localizacao</span>
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function GiftModal({
  gifts,
  open,
  onClose,
}: {
  gifts: AdminGift[];
  open: boolean;
  onClose: () => void;
}) {
  const activeGifts = gifts.filter((gift) => gift.active);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="rsvp-modal gift-modal"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
          >
            <button
              className="icon-button modal-close"
              type="button"
              aria-label="Fechar sugestoes"
              onClick={onClose}
            >
              <X size={18} />
            </button>
            <span className="section-eyebrow">Sugestoes de presentes</span>
            <h2>Lista da Juliane</h2>
            <p>
              Sua presenca e o maior presente. Para quem desejar presentear,
              estas sao algumas sugestoes cadastradas.
            </p>
            <div className="gift-modal-list">
              {activeGifts.map((gift) => (
                <article className="gift-modal-card" key={gift.id}>
                  <span>{gift.category || "Sugestao"}</span>
                  <h3>{gift.name}</h3>
                  {gift.description ? <p>{gift.description}</p> : null}
                  <div className="gift-meta-row">
                    {gift.size ? <small>Tamanho: {gift.size}</small> : null}
                    {gift.color ? <small>Cor: {gift.color}</small> : null}
                    {gift.priority ? <small>{gift.priority}</small> : null}
                  </div>
                  {gift.linkUrl ? (
                    <a href={gift.linkUrl} target="_blank">
                      Ver sugestao
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
  const [people, setPeople] = useState([""]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent(true);

    try {
      await submitOpenRsvp({
        name,
        phone: "",
        willAttend: answer === "yes",
        people: answer === "yes" ? people : [],
        reviewed: true,
      });

      if (answer === "yes") onSuccess();
      else onClose();
    } catch (reason) {
      setError(getFriendlyRsvpError(reason));
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
            <h2>Confirme sua presenca</h2>
            <p>
              Informe seu nome e adicione todos os acompanhantes que irao com
              voce. Se nao puder comparecer, basta marcar a opcao de recusa.
            </p>
            <label>
              Nome
              <input
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Digite seu nome"
                value={name}
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
                <p>Adicione todos os acompanhantes abaixo.</p>
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
                  Adicionar pessoa
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

function getFriendlyRsvpError(reason: unknown) {
  if (
    typeof reason === "object" &&
    reason &&
    "issues" in reason &&
    Array.isArray(reason.issues)
  ) {
    return reason.issues
      .map((issue: { path?: Array<string | number>; message?: string }) => {
        if (issue.path?.includes("people")) {
          return "Informe pelo menos um nome na lista de pessoas ou escolha que nao podera comparecer.";
        }
        return issue.message ?? "Verifique os dados informados.";
      })
      .join(" ");
  }

  return reason instanceof Error
    ? reason.message
    : "Nao foi possivel concluir sua confirmacao.";
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
            <p>Que alegria saber que voce estara conosco nesta noite especial.</p>
            <button className="primary-button" onClick={onEnter}>
              Voltar ao convite
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function Home() {
  const [opened, setOpened] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [giftsOpen, setGiftsOpen] = useState(false);
  const [gifts, setGifts] = useState<AdminGift[]>(fallbackGifts);

  useEffect(() => {
    listGifts()
      .then((savedGifts) => {
        const activeGifts = savedGifts.filter((gift) => gift.active);
        if (activeGifts.length > 0) setGifts(activeGifts);
      })
      .catch(() => setGifts(fallbackGifts));
  }, []);

  return (
    <main className="invite-page">
      <Image
        className="site-background"
        src="/images/convite-estrelado-mobile.png"
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

      <AnimatePresence>
        {!opened ? <OpeningScreen onOpen={() => setOpened(true)} /> : null}
      </AnimatePresence>

      <div className={opened ? "page-content visible" : "page-content"}>
        <InvitationCard
          onGifts={() => setGiftsOpen(true)}
          onRsvp={() => setRsvpOpen(true)}
        />
      </div>

      <GiftModal
        gifts={gifts.length > 0 ? gifts : fallbackGifts}
        open={giftsOpen}
        onClose={() => setGiftsOpen(false)}
      />
      <RsvpModal
        open={rsvpOpen}
        onClose={() => setRsvpOpen(false)}
        onSuccess={() => {
          setRsvpOpen(false);
          setSuccessOpen(true);
        }}
      />
      <SuccessOverlay open={successOpen} onEnter={() => setSuccessOpen(false)} />
    </main>
  );
}
