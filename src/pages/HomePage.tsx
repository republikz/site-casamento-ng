import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import bouquet from "../assets/floral-bouquet.svg";
import sprig from "../assets/floral-sprig.svg";
import { LoadingBlock } from "../components/LoadingBlock";
import { getSiteData } from "../lib/api";
import type { Photo, SiteData } from "../lib/types";

export function HomePage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSiteData().then(setData).catch((err) => setError(err.message));
  }, []);

  const photos = useMemo(() => data?.photos ?? [], [data]);

  if (error) return <div className="notice error">Não foi possível carregar o site: {error}</div>;
  if (!data) return <LoadingBlock label="Abrindo o convite..." />;

  return (
    <article className="invitation-page">
      <section className="invite-hero">
        <div className="invite-hero-copy">
          <h1>{formatCoupleNames(data.content.couple_names)}</h1>
          <p className="script-and">e</p>
          <p className="invite-kicker">Vão casar</p>
          <div className="invite-meta">
            <span>{data.event.date_label}</span>
            <i />
            <span>{data.event.time_label}</span>
            <i />
            <span>{data.event.venue_name}</span>
          </div>
        </div>
        <img className="invite-sprig" src={sprig} alt="" />
        <Link className="invite-rsvp" to="/confirmar">
          Confirmar<br />presença
        </Link>
      </section>

      <section className="invite-photos" aria-label="Fotos do casal">
        <OvalPhoto photo={photos[0]} fallback="Foto do casal" />
        <div className="arch-card" aria-hidden>
          <div className="cloud" />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
        </div>
        <OvalPhoto photo={photos[1]} fallback="Foto da cerimônia" />
      </section>

      <section className="journey-section">
        <img src={bouquet} alt="" />
        <h2>Nossa jornada</h2>
        <p className="script-word">Juntos</p>
        <p>{data.content.story_text}</p>
      </section>

      <section className="wedding-section">
        <h2>The wedding</h2>
        <div className="wedding-cards">
          <InfoCard title="The venue" text={data.event.venue_address} photo={photos[2]} />
          <InfoCard
            title="Accommodations"
            text="Hospedagens e recomendações podem ser atualizadas no painel admin."
            photo={photos[3]}
          />
          <InfoCard title="Attire" text={data.event.dress_code} photo={photos[4]} />
        </div>
      </section>

      <section className="event-band">
        <div>
          <h2>Sobre<br /><span>o</span> evento</h2>
          <p>{data.event.date_label}, {data.event.time_label}</p>
        </div>
        <ol>
          <li><span>4:00 PM</span> Cocktails</li>
          <li><span>5:00 PM</span> Wedding ceremony</li>
          <li><span>6:00 PM</span> Reception</li>
          <li><span>8:00 PM</span> Afterparty</li>
        </ol>
      </section>

      <section className="faq-section">
        <h2>FAQs</h2>
        <h3>Is the venue wheelchair-accessible?</h3>
        <p>{data.event.notes}</p>
        <h3>What if I have dietary restrictions?</h3>
        <p>Informe suas restrições ao confirmar presença. Elas ficam salvas para os noivos no painel admin.</p>
        <h3>Can we bring our phones out during the ceremony?</h3>
        <p>Durante a cerimônia, aproveite o momento. Depois, fotos e celebrações são muito bem-vindas.</p>
      </section>

      <section className="contact-band">
        <div>
          <h2>Contact us</h2>
          <div className="contact-grid">
            <address>
              <strong>Nayumi</strong>
              <span>Telefone: adicione no painel</span>
              <span>E-mail: adicione no painel</span>
            </address>
            <address>
              <strong>Gabriel</strong>
              <span>Telefone: adicione no painel</span>
              <span>E-mail: adicione no painel</span>
            </address>
          </div>
        </div>
        <img src={bouquet} alt="" />
      </section>
    </article>
  );
}

function OvalPhoto({ photo, fallback }: { photo?: Photo; fallback: string }) {
  return (
    <figure className="oval-photo">
      {photo ? (
        <img src={photo.image_url} alt={photo.alt_text || photo.title || fallback} />
      ) : (
        <div className="photo-empty">{fallback}</div>
      )}
    </figure>
  );
}

function InfoCard({ title, text, photo }: { title: string; text: string; photo?: Photo }) {
  return (
    <article className="wedding-card">
      <div className="wedding-card-photo">
        {photo ? <img src={photo.image_url} alt={photo.alt_text || photo.title || title} /> : <span />}
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function formatCoupleNames(names: string) {
  const parts = names
    .replace(/&/g, " e ")
    .split(/\s+e\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return (
      <>
        {parts[0]}
        <br />
        {parts[1]}
      </>
    );
  }

  return names;
}
