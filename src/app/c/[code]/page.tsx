"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { eventInfo } from "@/lib/event";
import { findGuestByCode, submitRsvp } from "@/lib/guest-service";
import type { Guest } from "@/lib/types";

type Props = {
  params: Promise<{ code: string }>;
};

export default function InvitePage({ params }: Props) {
  const [code, setCode] = useState("");
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"confirmed" | "declined" | null>(null);
  const [willAttend, setWillAttend] = useState(true);

  useEffect(() => {
    params.then(({ code: inviteCode }) => {
      setCode(inviteCode.toUpperCase());
      findGuestByCode(inviteCode.toUpperCase())
        .then(setGuest)
        .catch((reason: unknown) =>
          setError(reason instanceof Error ? reason.message : "Erro ao carregar."),
        )
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError("");

    try {
      const companions = [1, 2, 3, 4, 5]
        .map((index) => String(formData.get(`companion-${index}`) ?? "").trim())
        .filter(Boolean);

      const result = await submitRsvp({
        inviteCode: code,
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        willAttend,
        companions,
        reviewed: formData.get("reviewed") === "on",
      });

      setSuccess(result.status as "confirmed" | "declined");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="route-shell">
        <div className="stars-layer" />
        <section className="route-center">
          <div className="route-card">Carregando convite...</div>
        </section>
      </main>
    );
  }

  if (!guest) {
    return (
      <main className="route-shell">
        <div className="stars-layer" />
        <section className="route-center">
          <div className="route-card">
            <h1>Convite nao encontrado</h1>
            <p>Nao conseguimos localizar este convite. Verifique o link recebido.</p>
            <Link className="primary-button" href="/">
              Voltar
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="route-shell">
      <div className="stars-layer" />
      <section className="invite-route-grid">
        <motion.article
          className="route-card invite-summary"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="section-eyebrow">Convite individual</span>
          <h1>Juliane</h1>
          <strong>15 anos</strong>
          <p>
            {guest.mainGuestName}, voce faz parte desta historia. Confirme sua
            presenca ate {eventInfo.rsvpDeadlineLabel}.
          </p>
          <div className="info-grid">
            <div>
              <CalendarDays size={20} />
              <span>{eventInfo.dateLabel}</span>
            </div>
            <div>
              <Clock size={20} />
              <span>{eventInfo.timeLabel}</span>
            </div>
            <div>
              <MapPin size={20} />
              <span>{eventInfo.venueName}</span>
            </div>
          </div>
          <a className="ghost-button" href={eventInfo.mapsUrl} target="_blank">
            Ver localizacao
          </a>
        </motion.article>

        <motion.form
          className="route-card route-form"
          action={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {success === "confirmed" ? (
            <div className="route-success">
              <Sparkles size={34} />
              <h2>Presenca confirmada</h2>
              <p>Que alegria saber que voce estara conosco.</p>
              <Link className="primary-button" href={`/c/${code}/universo`}>
                Entrar no universo da Juliane
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : success === "declined" ? (
            <div className="route-success">
              <h2>Sentiremos sua falta.</h2>
              <p>Obrigado por nos informar e por fazer parte desta historia.</p>
              <Link className="ghost-button" href="/">
                Voltar ao convite
              </Link>
            </div>
          ) : (
            <>
              <span className="section-eyebrow">RSVP</span>
              <h2>Voce estara presente?</h2>
              <label>
                Nome do convidado
                <input name="name" defaultValue={guest.mainGuestName} required />
              </label>
              <label>
                Telefone ou WhatsApp
                <input name="phone" defaultValue={guest.phone} required />
              </label>
              <div className="choice-grid">
                <button
                  type="button"
                  className={willAttend ? "choice active" : "choice"}
                  onClick={() => setWillAttend(true)}
                >
                  Sim, estarei presente
                </button>
                <button
                  type="button"
                  className={!willAttend ? "choice active" : "choice"}
                  onClick={() => setWillAttend(false)}
                >
                  Infelizmente nao poderei comparecer
                </button>
              </div>
              {willAttend && guest.maxCompanions > 0 ? (
                <div className="companions">
                  <p>Seu convite permite ate {guest.maxCompanions} acompanhantes.</p>
                  {Array.from({ length: guest.maxCompanions }).map((_, index) => (
                    <input
                      key={index}
                      name={`companion-${index + 1}`}
                      placeholder={`Nome do acompanhante ${index + 1}`}
                    />
                  ))}
                </div>
              ) : null}
              <label className="checkbox-row">
                <input name="reviewed" type="checkbox" required />
                <span>Revisei os dados informados.</span>
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button className="primary-button" disabled={submitting} type="submit">
                {submitting ? "Enviando..." : "Enviar confirmacao"}
              </button>
            </>
          )}
        </motion.form>
      </section>
    </main>
  );
}
