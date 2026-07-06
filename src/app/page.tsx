"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Gift,
  MapPin,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { type AdminGift } from "@/lib/admin-store";
import { defaultGiftSuggestions } from "@/lib/gift-catalog";
import { listGifts } from "@/lib/gift-service";
import { submitOpenRsvp } from "@/lib/open-rsvp-service";

const eventDate = new Date("2026-09-04T20:00:00-03:00").getTime();
const mapsUrl = "https://maps.app.goo.gl/DxDRcY8edMxiECuA6";

const fallbackGifts = defaultGiftSuggestions;

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
        Uma noite especial, prestes a começar...
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
          Para viver as emoções deste dia tão importante, quero estar ao lado de
          pessoas como você!
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

        <p className="invite-deadline">Confirme sua presença até 20/08/2026</p>

        <p className="invite-hint">Clique nos ícones para interagir</p>

        <div className="invite-actions" aria-label="Acoes do convite">
          <button className="invite-action" onClick={onGifts} type="button">
            <Gift size={30} />
            <span>Sugestões de presentes</span>
          </button>
          <button className="invite-action" onClick={onRsvp} type="button">
            <CheckCircle2 size={32} />
            <span>Confirme sua presença</span>
          </button>
          <a className="invite-action" href={mapsUrl} target="_blank">
            <MapPin size={31} />
            <span>Localização</span>
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reminders, setReminders] = useState<string[]>([]);
  const groupedGifts = useMemo(() => {
    return activeGifts.reduce<Record<string, AdminGift[]>>((groups, gift) => {
      const category = gift.category || "Sugestões";
      groups[category] = [...(groups[category] ?? []), gift];
      return groups;
    }, {});
  }, [activeGifts]);
  const categories = Object.keys(groupedGifts).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const markedGifts = useMemo(
    () => activeGifts.filter((gift) => reminders.includes(gift.id)),
    [activeGifts, reminders],
  );
  const visibleCategoryGifts = selectedCategory
    ? [...groupedGifts[selectedCategory]].sort((a, b) => {
        const aMarked = reminders.includes(a.id) ? 0 : 1;
        const bMarked = reminders.includes(b.id) ? 0 : 1;
        return aMarked - bMarked || a.name.localeCompare(b.name, "pt-BR");
      })
    : [];

  useEffect(() => {
    if (!open) return;
    try {
      setReminders(JSON.parse(window.localStorage.getItem("gift-reminders") ?? "[]"));
    } catch {
      setReminders([]);
    }
  }, [open]);

  function toggleReminder(giftId: string) {
    const nextReminders = reminders.includes(giftId)
      ? reminders.filter((id) => id !== giftId)
      : [...reminders, giftId];
    setReminders(nextReminders);
    window.localStorage.setItem("gift-reminders", JSON.stringify(nextReminders));
  }

  function closeModal() {
    setSelectedCategory(null);
    onClose();
  }

  async function shareMarkedGifts() {
    if (markedGifts.length === 0) return;

    const file = await createGiftReminderImage(markedGifts);
    const shareData = {
      title: "Presentes escolhidos para Juliane",
      text: "Lista de presentes marcados como lembrete para a Juliane.",
      files: [file],
    };

    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      return;
    }

    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
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
          <motion.div
            className="rsvp-modal gift-modal"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
          >
            <button
              className="icon-button modal-close"
              type="button"
              aria-label="Fechar sugestões"
              onClick={closeModal}
            >
              <X size={18} />
            </button>
            <div className="gift-modal-heading">
              <div>
                <span className="section-eyebrow">Sugestões de presentes</span>
                <h2>{selectedCategory ?? "Lista da Juliane"}</h2>
              </div>
              <button
                className="gift-share-button"
                disabled={markedGifts.length === 0}
                onClick={shareMarkedGifts}
                type="button"
              >
                <Share2 size={16} />
                Compartilhar marcados
              </button>
            </div>
            {selectedCategory ? (
              <>
                <p>Marque os itens que deseja lembrar ao escolher o presente.</p>
                <button
                  className="gift-back-button"
                  onClick={() => setSelectedCategory(null)}
                  type="button"
                >
                  Voltar para categorias
                </button>
                <div className="gift-check-list">
                  {visibleCategoryGifts.map((gift) => (
                    <label className="gift-check-item" key={gift.id}>
                      <input
                        checked={reminders.includes(gift.id)}
                        onChange={() => toggleReminder(gift.id)}
                        type="checkbox"
                      />
                      <span>{gift.name}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>
                  Sua presença é o nosso maior presente. Para quem deseja
                  presentear a Juliane com uma lembrança especial, reunimos
                  sugestões delicadas para este momento.
                </p>
                <div className="gift-category-grid">
                  {categories.map((category) => (
                    <button
                      className="gift-category-card"
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      type="button"
                    >
                      <span>{groupedGifts[category].length} sugestões</span>
                      <strong>{category}</strong>
                    </button>
                  ))}
                </div>
              </>
            )}
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
              aria-label="Fechar confirmação"
              onClick={onClose}
            >
              <X size={18} />
            </button>
            <span className="section-eyebrow">RSVP</span>
            <h2>Confirme sua presença</h2>
            <p>
              Informe seu nome e adicione todos os acompanhantes que irão com
              você. Se não puder comparecer, basta marcar a opção de recusa.
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
            <div className="choice-grid" role="radiogroup" aria-label="Presença">
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
                Infelizmente não poderei comparecer
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
              {sent ? "Enviando..." : "Enviar confirmação"}
            </button>
            <small>
              Os dados informados serão utilizados exclusivamente para
              organização e controle de presença deste evento.
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
          return "Informe pelo menos um nome na lista de pessoas ou escolha que não poderá comparecer.";
        }
        return issue.message ?? "Verifique os dados informados.";
      })
      .join(" ");
  }

  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir sua confirmação.";
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
            <h2>Presença confirmada</h2>
            <p>Que alegria saber que você estará conosco nesta noite especial.</p>
            <button className="primary-button" onClick={onEnter}>
              Voltar ao convite
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

async function createGiftReminderImage(gifts: AdminGift[]) {
  const width = 1080;
  const padding = 72;
  const lineHeight = 42;
  const categoryGap = 26;
  const grouped = gifts.reduce<Record<string, AdminGift[]>>((groups, gift) => {
    const category = gift.category || "Sugestões";
    groups[category] = [...(groups[category] ?? []), gift];
    return groups;
  }, {});
  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const estimatedLines =
    8 +
    categories.reduce((total, category) => total + 2 + grouped[category].length, 0);
  const height = Math.max(1350, padding * 2 + estimatedLines * lineHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível gerar a imagem.");
  }

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#06112d");
  gradient.addColorStop(0.55, "#08183a");
  gradient.addColorStop(1, "#020713");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(255, 232, 167, 0.12)";
  for (let index = 0; index < 95; index += 1) {
    const x = (index * 137) % width;
    const y = (index * 211) % height;
    const radius = index % 9 === 0 ? 2.5 : 1.2;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.textAlign = "center";
  context.fillStyle = "#fff8e6";
  context.font = "700 64px Georgia, serif";
  context.fillText("Juliane 15 anos", width / 2, 128);
  context.fillStyle = "#f5dfa0";
  context.font = "800 36px Arial, sans-serif";
  context.fillText("Presentes marcados como lembrete", width / 2, 186);
  context.fillStyle = "rgba(255, 249, 236, 0.78)";
  context.font = "400 30px Arial, sans-serif";
  context.fillText("Sugestões escolhidas com carinho para consultar depois", width / 2, 236);

  let y = 322;
  context.textAlign = "left";

  for (const category of categories) {
    context.fillStyle = "#f5dfa0";
    context.font = "800 34px Arial, sans-serif";
    context.fillText(category, padding, y);
    y += lineHeight + 8;

    context.fillStyle = "#fff9ec";
    context.font = "400 32px Arial, sans-serif";

    for (const gift of grouped[category]) {
      const lines = wrapCanvasText(context, `• ${gift.name}`, width - padding * 2, 32);
      for (const line of lines) {
        context.fillText(line, padding + 18, y);
        y += lineHeight;
      }
    }

    y += categoryGap;
  }

  context.textAlign = "center";
  context.fillStyle = "rgba(255, 249, 236, 0.7)";
  context.font = "400 28px Arial, sans-serif";
  context.fillText("Convite Juliane 15 anos", width / 2, height - 70);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((imageBlob) => {
      if (imageBlob) resolve(imageBlob);
      else reject(new Error("Não foi possível gerar a imagem."));
    }, "image/png");
  });

  return new File([blob], "presentes-marcados-juliane.png", {
    type: "image/png",
  });
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);
  return lines.map((item) => item.slice(0, Math.max(item.length, fontSize)));
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
        src="/images/convite-estrelado-juliane-v2.png"
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
