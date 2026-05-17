import { Clock, MapPin, Shirt, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingBlock } from "../components/LoadingBlock";
import { PageHeader } from "../components/PageHeader";
import { getSiteData } from "../lib/api";
import type { EventDetails } from "../lib/types";

export function EventPage() {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSiteData()
      .then((data) => setEvent(data.event))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="notice error">Não foi possível carregar o evento: {error}</div>;
  if (!event) return <LoadingBlock label="Consultando o mapa..." />;

  return (
    <>
      <PageHeader
        eyebrow="O encontro"
        title="Informações do evento"
        description="Dia, hora, local e detalhes práticos para chegar sem pressa."
      />

      <section className="event-grid">
        <article>
          <CalendarIcon />
          <h2>{event.date_label}</h2>
          <p>{event.time_label}</p>
        </article>
        <article>
          <MapPin aria-hidden />
          <h2>{event.venue_name}</h2>
          <p>{event.venue_address}</p>
          {event.map_url && (
            <a href={event.map_url} target="_blank" rel="noreferrer">
              Abrir mapa
            </a>
          )}
        </article>
        <article>
          <Shirt aria-hidden />
          <h2>Traje</h2>
          <p>{event.dress_code}</p>
        </article>
        <article>
          <ScrollText aria-hidden />
          <h2>Notas</h2>
          <p>{event.notes}</p>
        </article>
      </section>
    </>
  );
}

function CalendarIcon() {
  return <Clock aria-hidden />;
}
