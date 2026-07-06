"use client";

import { motion } from "framer-motion";
import { Gift, Heart, Image as ImageIcon, MapPin, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultContent, eventInfo } from "@/lib/event";
import { findGuestByCode } from "@/lib/guest-service";
import type { Guest } from "@/lib/types";

type Props = {
  params: Promise<{ code: string }>;
};

export default function UniversePage({ params }: Props) {
  const [code, setCode] = useState("");
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ code: inviteCode }) => {
      setCode(inviteCode.toUpperCase());
      findGuestByCode(inviteCode.toUpperCase())
        .then(setGuest)
        .finally(() => setLoading(false));
    });
  }, [params]);

  const localRsvp =
    typeof window !== "undefined" && code
      ? window.localStorage.getItem(`rsvp:${code}`)
      : null;
  const localConfirmed = localRsvp ? JSON.parse(localRsvp).status === "confirmed" : false;
  const allowed = guest?.status === "confirmed" || localConfirmed;

  if (loading) {
    return (
      <main className="route-shell">
        <div className="stars-layer" />
        <section className="route-center">
          <div className="route-card">Carregando universo...</div>
        </section>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="route-shell">
        <div className="stars-layer" />
        <section className="route-center">
          <div className="route-card">
            <h1>Área reservada</h1>
            <p>Esta área fica disponível após a confirmação positiva da presença.</p>
            <Link className="primary-button" href={`/c/${code}`}>
              Confirmar presença
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="route-shell universe-route">
      <div className="stars-layer" />
      <nav className="site-header route-header">
        <Link className="brand-button" href={`/c/${code}`}>
          Juliane <span>15</span>
        </Link>
        <div className="desktop-nav">
          {["perfil", "memorias", "presentes", "festa"].map((target) => (
            <button
              key={target}
              onClick={() =>
                document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {target}
            </button>
          ))}
        </div>
      </nav>
      <section className="story-section">
        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="section-eyebrow">Área privada</span>
          <h1>O universo da Juliane</h1>
          <p>{defaultContent.about}</p>
        </motion.div>
      </section>
      <section className="profile-section" id="perfil">
        <div className="detail-grid">
          {defaultContent.profilePlaceholders.map((item) => (
            <article className="detail-card" key={item}>
              <Sparkles size={18} />
              <h3>{item}</h3>
              <p>Conteudo editavel pelo painel administrativo.</p>
            </article>
          ))}
        </div>
      </section>
      <section className="timeline-section" id="memorias">
        <div className="section-heading">
          <span className="section-eyebrow">Memorias</span>
          <h2>Linha do tempo</h2>
        </div>
        <div className="timeline">
          {defaultContent.timeline.map((item, index) => (
            <article className="timeline-item" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item}</h3>
              <p>Data, foto e descricao cadastraveis.</p>
            </article>
          ))}
        </div>
      </section>
      <section className="gifts-section" id="presentes">
        <div className="section-heading">
          <span className="section-eyebrow">Sonhos e presentes</span>
          <h2>Sua presença é o nosso maior presente.</h2>
        </div>
        <div className="gift-grid">
          {defaultContent.gifts.map((gift) => (
            <article className="gift-card" key={gift.name}>
              <span>{gift.category}</span>
              <h3>{gift.name}</h3>
              <p>{gift.detail}</p>
              <small>{gift.meta}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="event-section" id="festa">
        <article className="event-card">
          <span className="section-eyebrow">Informacoes importantes</span>
          <h2>Nos encontraremos sob as estrelas.</h2>
          <div className="info-grid">
            <div>
              <Star size={20} />
              <span>{eventInfo.dateLabel}</span>
            </div>
            <div>
              <Heart size={20} />
              <span>{eventInfo.timeLabel}</span>
            </div>
            <div>
              <MapPin size={20} />
              <span>{eventInfo.address}</span>
            </div>
          </div>
          <a className="primary-button" href={eventInfo.mapsUrl} target="_blank">
            Abrir no Google Maps
          </a>
        </article>
      </section>
      <nav className="bottom-nav">
        {[
          ["Inicio", Star, "top"],
          ["Juliane", Heart, "perfil"],
          ["Memorias", ImageIcon, "memorias"],
          ["Presentes", Gift, "presentes"],
          ["Festa", MapPin, "festa"],
        ].map(([label, Icon, target]) => (
          <button
            key={String(label)}
            onClick={() =>
              target === "top"
                ? window.scrollTo({ top: 0, behavior: "smooth" })
                : document
                    .getElementById(String(target))
                    ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Icon size={18} />
            <span>{String(label)}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
