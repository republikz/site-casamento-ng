import { Check, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { LoadingBlock } from "../components/LoadingBlock";
import { PageHeader } from "../components/PageHeader";
import { searchInvitations, submitRsvp } from "../lib/api";
import type { Invitation, RsvpGuestSelection } from "../lib/types";

export function RSVPPage() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Invitation[]>([]);
  const [selected, setSelected] = useState<Invitation | null>(null);
  const [selections, setSelections] = useState<RsvpGuestSelection[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setFeedback("");
    setError("");
    setSelected(null);
    if (term.trim().length < 3) {
      setError("Digite pelo menos 3 letras do seu nome.");
      return;
    }
    setLoading(true);
    try {
      const matches = await searchInvitations(term);
      setResults(matches);
      if (!matches.length) setFeedback("Não encontramos esse nome. Confira a grafia ou fale com os noivos.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar convite.");
    } finally {
      setLoading(false);
    }
  }

  function chooseInvitation(invitation: Invitation) {
    setSelected(invitation);
    setMessage(invitation.notes ?? "");
    setSelections(
      invitation.guests.map((guest) => ({
        guest_id: guest.id,
        will_attend: guest.rsvp_status === "yes",
        dietary_notes: guest.dietary_notes,
        accessibility_notes: guest.accessibility_notes,
      })),
    );
  }

  function updateGuest(guestId: string, patch: Partial<RsvpGuestSelection>) {
    setSelections((current) =>
      current.map((selection) =>
        selection.guest_id === guestId ? { ...selection, ...patch } : selection,
      ),
    );
  }

  async function saveRsvp(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      await submitRsvp({
        invitation_id: selected.id,
        guests: selections,
        message,
      });
      setFeedback("Confirmação salva. Obrigado por responder com carinho.");
      const refreshed = await searchInvitations(term);
      setResults(refreshed);
      const updated = refreshed.find((item) => item.id === selected.id);
      if (updated) chooseInvitation(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar confirmação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Confirmação"
        title="Diga se você vem"
        description="Pesquise seu nome, confira os acompanhantes cadastrados e marque quem estará presente."
      />

      <section className="rsvp-layout">
        <form className="search-panel" onSubmit={handleSearch}>
          <label htmlFor="guest-search">Nome do convidado</label>
          <div className="search-row">
            <input
              id="guest-search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Digite ao menos 3 letras"
              autoComplete="name"
            />
            <button type="submit">
              <Search aria-hidden />
              Buscar
            </button>
          </div>
          <p>Seu convite pode aparecer pelo seu nome, pelo nome da família ou pelo nome de um acompanhante.</p>
        </form>

        {loading && <LoadingBlock label="Procurando na lista..." />}
        {error && <div className="notice error">{error}</div>}
        {feedback && <div className="notice success">{feedback}</div>}

        {!!results.length && !selected && (
          <div className="result-list" aria-label="Convites encontrados">
            {results.map((invitation) => (
              <button type="button" key={invitation.id} onClick={() => chooseInvitation(invitation)}>
                <span>{invitation.display_name}</span>
                <small>{invitation.guests.map((guest) => guest.full_name).join(", ")}</small>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <form className="rsvp-form" onSubmit={saveRsvp}>
            <div className="form-heading">
              <p className="eyebrow">Convite encontrado</p>
              <h2>{selected.display_name}</h2>
            </div>

            {selected.guests.map((guest) => {
              const selection = selections.find((item) => item.guest_id === guest.id);
              return (
                <fieldset className="guest-fieldset" key={guest.id}>
                  <label className="checkbox-line">
                    <input
                      type="checkbox"
                      checked={selection?.will_attend ?? false}
                      onChange={(event) => updateGuest(guest.id, { will_attend: event.target.checked })}
                    />
                    <span>
                      <Check aria-hidden />
                      {guest.full_name}
                    </span>
                  </label>
                  <label>
                    Restrição alimentar
                    <input
                      value={selection?.dietary_notes ?? ""}
                      onChange={(event) => updateGuest(guest.id, { dietary_notes: event.target.value })}
                      placeholder="Ex.: vegetariano, alergia, sem restrição"
                    />
                  </label>
                  <label>
                    Acessibilidade
                    <input
                      value={selection?.accessibility_notes ?? ""}
                      onChange={(event) => updateGuest(guest.id, { accessibility_notes: event.target.value })}
                      placeholder="Ex.: cadeira de rodas, assento reservado"
                    />
                  </label>
                </fieldset>
              );
            })}

            <label>
              Recado para os noivos
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="Opcional, mas será guardado com carinho."
              />
            </label>

            <div className="button-row">
              <button className="primary-action" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar confirmação"}
              </button>
              <button type="button" className="secondary-action" onClick={() => setSelected(null)}>
                Voltar aos resultados
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
