import { CalendarDays, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import crest from "../assets/brasao-ng.svg";
import { LoadingBlock } from "../components/LoadingBlock";
import { getSiteData } from "../lib/api";
import type { SiteData } from "../lib/types";

export function HomePage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSiteData().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="notice error">Não foi possível carregar o site: {error}</div>;
  }

  if (!data) return <LoadingBlock label="Abrindo o pergaminho..." />;

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Casamento</p>
          <h1>{data.content.hero_title}</h1>
          <p>{data.content.hero_subtitle}</p>
          <div className="hero-actions">
            <Link className="primary-action" to="/confirmar">
              Confirmar presença <ChevronRight aria-hidden />
            </Link>
            <Link className="secondary-action" to="/evento">
              Ver informações <CalendarDays aria-hidden />
            </Link>
          </div>
        </div>
        <div className="hero-mark" aria-hidden>
          <img src={crest} alt="" />
        </div>
      </section>

      <section className="story-section">
        <div>
          <p className="eyebrow">Capítulo I</p>
          <h2>{data.content.story_title}</h2>
        </div>
        <p>{data.content.story_text}</p>
      </section>

      <section className="photo-ribbon" aria-label="Fotos do casal">
        {data.photos.map((photo) => (
          <figure key={photo.id}>
            <img src={photo.image_url} alt={photo.alt_text || photo.title} />
            <figcaption>{photo.title}</figcaption>
          </figure>
        ))}
        {data.photos.length < 3 &&
          Array.from({ length: 3 - data.photos.length }).map((_, index) => (
            <div className="photo-placeholder" key={index}>
              <Sparkles aria-hidden />
              <span>Foto futura</span>
            </div>
          ))}
      </section>

      <section className="closing-note">
        <p>{data.content.closing_note}</p>
        <Link to="/presentes">Ver lista de presentes</Link>
      </section>
    </>
  );
}
