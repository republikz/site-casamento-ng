import {
  ArrowLeft,
  Download,
  ImagePlus,
  Lock,
  LogOut,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import crest from "../assets/brasao-ng.svg";
import { LoadingBlock } from "../components/LoadingBlock";
import {
  createInvitation,
  deleteGift,
  getAdminSnapshot,
  getCurrentAdmin,
  saveContent,
  saveEvent,
  saveGift,
  signInAdmin,
  signOutAdmin,
  uploadPhoto,
} from "../lib/api";
import { buildConfirmedGuestsCsv, downloadCsv } from "../lib/csv";
import { isSupabaseConfigured } from "../lib/supabase";
import type { EventDetails, Gift, Invitation, Photo, SiteContent } from "../lib/types";

type Snapshot = {
  content: SiteContent;
  event: EventDetails;
  photos: Photo[];
  gifts: Gift[];
  invitations: Invitation[];
};

type AdminTab = "conteudo" | "evento" | "convidados" | "presentes" | "fotos";

const tabs: { id: AdminTab; label: string }[] = [
  { id: "conteudo", label: "Conteúdo" },
  { id: "evento", label: "Evento" },
  { id: "convidados", label: "Convidados" },
  { id: "presentes", label: "Presentes" },
  { id: "fotos", label: "Fotos" },
];

export function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("conteudo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function boot() {
      try {
        if (!isSupabaseConfigured) return;
        const user = await getCurrentAdmin();
        setAuthed(Boolean(user));
        if (user) setSnapshot(await getAdminSnapshot());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar admin.");
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, []);

  const confirmedCount = useMemo(() => {
    return (
      snapshot?.invitations.reduce(
        (total, invitation) =>
          total + invitation.guests.filter((guest) => guest.rsvp_status === "yes").length,
        0,
      ) ?? 0
    );
  }, [snapshot]);

  async function refresh() {
    setSnapshot(await getAdminSnapshot());
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setFeedback("");
    setSaving(true);
    try {
      await signInAdmin(email, password);
      setAuthed(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await signOutAdmin();
    setAuthed(false);
    setSnapshot(null);
  }

  async function runAction(action: () => Promise<void>, success: string) {
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      await action();
      await refresh();
      setFeedback(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "A ação não pôde ser concluída.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Abrindo painel..." />;

  if (!authed) {
    return (
      <main className="admin-login">
        <form onSubmit={handleLogin}>
          <img src={crest} alt="" />
          <p className="eyebrow">Painel dos noivos</p>
          <h1>Entrar no admin</h1>
          {!isSupabaseConfigured && (
            <div className="notice error">
              O admin está bloqueado. Configure o Supabase e crie seu usuário por e-mail antes de usar este painel.
            </div>
          )}
          <label>
            E-mail
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Senha
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          {error && <div className="notice error">{error}</div>}
          <button className="primary-action" type="submit" disabled={saving}>
            <Lock aria-hidden />
            {saving ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  if (!snapshot) return <LoadingBlock label="Carregando dados..." />;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <img src={crest} alt="" />
          <div>
            <p className="eyebrow">Painel dos noivos</p>
            <h1>Editar site</h1>
          </div>
        </div>
        <div className="admin-actions">
          <Link className="secondary-action" to="/">
            <ArrowLeft aria-hidden />
            Ver site
          </Link>
          <button type="button" onClick={handleLogout}>
            <LogOut aria-hidden />
            Sair
          </button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Seções do painel">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && <div className="notice error">{error}</div>}
      {feedback && <div className="notice success">{feedback}</div>}

      {activeTab === "conteudo" && (
        <ContentEditor
          content={snapshot.content}
          disabled={saving}
          onChange={(content) => setSnapshot({ ...snapshot, content })}
          onSave={() => runAction(() => saveContent(snapshot.content), "Conteúdo salvo.")}
        />
      )}

      {activeTab === "evento" && (
        <EventEditor
          event={snapshot.event}
          disabled={saving}
          onChange={(event) => setSnapshot({ ...snapshot, event })}
          onSave={() => runAction(() => saveEvent(snapshot.event), "Evento salvo.")}
        />
      )}

      {activeTab === "convidados" && (
        <GuestsEditor
          invitations={snapshot.invitations}
          confirmedCount={confirmedCount}
          disabled={saving}
          onCreate={(displayName, guestNames) =>
            runAction(() => createInvitation(displayName, guestNames), "Convite cadastrado.")
          }
          onExport={() => downloadCsv("convidados-confirmados.csv", buildConfirmedGuestsCsv(snapshot.invitations))}
        />
      )}

      {activeTab === "presentes" && (
        <GiftsEditor
          gifts={snapshot.gifts}
          disabled={saving}
          onSave={(gift) => runAction(() => saveGift(gift), "Presente salvo.")}
          onDelete={(id) => runAction(() => deleteGift(id), "Presente removido.")}
        />
      )}

      {activeTab === "fotos" && (
        <PhotosEditor
          photos={snapshot.photos}
          disabled={saving}
          onUpload={(file, title) => runAction(() => uploadPhoto(file, title).then(() => undefined), "Foto enviada.")}
        />
      )}
    </main>
  );
}

function ContentEditor({
  content,
  disabled,
  onChange,
  onSave,
}: {
  content: SiteContent;
  disabled: boolean;
  onChange: (content: SiteContent) => void;
  onSave: () => void;
}) {
  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <h2>História e textos principais</h2>
        <button type="button" onClick={onSave} disabled={disabled}>
          <Save aria-hidden />
          Salvar
        </button>
      </div>
      <div className="form-grid">
        <label>
          Nomes/monograma
          <input value={content.couple_names} onChange={(event) => onChange({ ...content, couple_names: event.target.value })} />
        </label>
        <label>
          Título da capa
          <input value={content.hero_title} onChange={(event) => onChange({ ...content, hero_title: event.target.value })} />
        </label>
        <label className="wide">
          Subtítulo da capa
          <textarea
            rows={3}
            value={content.hero_subtitle}
            onChange={(event) => onChange({ ...content, hero_subtitle: event.target.value })}
          />
        </label>
        <label>
          Título da história
          <input value={content.story_title} onChange={(event) => onChange({ ...content, story_title: event.target.value })} />
        </label>
        <label className="wide">
          História
          <textarea
            rows={7}
            value={content.story_text}
            onChange={(event) => onChange({ ...content, story_text: event.target.value })}
          />
        </label>
        <label className="wide">
          Nota final
          <textarea
            rows={4}
            value={content.closing_note}
            onChange={(event) => onChange({ ...content, closing_note: event.target.value })}
          />
        </label>
      </div>
    </section>
  );
}

function EventEditor({
  event,
  disabled,
  onChange,
  onSave,
}: {
  event: EventDetails;
  disabled: boolean;
  onChange: (event: EventDetails) => void;
  onSave: () => void;
}) {
  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <h2>Informações do evento</h2>
        <button type="button" onClick={onSave} disabled={disabled}>
          <Save aria-hidden />
          Salvar
        </button>
      </div>
      <div className="form-grid">
        <label>
          Data
          <input value={event.date_label} onChange={(input) => onChange({ ...event, date_label: input.target.value })} />
        </label>
        <label>
          Horário
          <input value={event.time_label} onChange={(input) => onChange({ ...event, time_label: input.target.value })} />
        </label>
        <label>
          Local
          <input value={event.venue_name} onChange={(input) => onChange({ ...event, venue_name: input.target.value })} />
        </label>
        <label>
          Link do mapa
          <input value={event.map_url} onChange={(input) => onChange({ ...event, map_url: input.target.value })} />
        </label>
        <label className="wide">
          Endereço
          <textarea rows={3} value={event.venue_address} onChange={(input) => onChange({ ...event, venue_address: input.target.value })} />
        </label>
        <label className="wide">
          Traje
          <textarea rows={3} value={event.dress_code} onChange={(input) => onChange({ ...event, dress_code: input.target.value })} />
        </label>
        <label className="wide">
          Notas
          <textarea rows={4} value={event.notes} onChange={(input) => onChange({ ...event, notes: input.target.value })} />
        </label>
      </div>
    </section>
  );
}

function GuestsEditor({
  invitations,
  confirmedCount,
  disabled,
  onCreate,
  onExport,
}: {
  invitations: Invitation[];
  confirmedCount: number;
  disabled: boolean;
  onCreate: (displayName: string, guestNames: string[]) => void;
  onExport: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [guestNames, setGuestNames] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const names = guestNames
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);
    if (!displayName.trim() || !names.length) return;
    onCreate(displayName.trim(), names);
    setDisplayName("");
    setGuestNames("");
  }

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>Convidados</h2>
          <p>{confirmedCount} presença(s) confirmada(s)</p>
        </div>
        <button type="button" onClick={onExport}>
          <Download aria-hidden />
          Exportar CSV
        </button>
      </div>

      <form className="inline-create" onSubmit={submit}>
        <label>
          Nome do convite
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ex.: Família Silva" />
        </label>
        <label>
          Convidados, um por linha
          <textarea
            rows={4}
            value={guestNames}
            onChange={(event) => setGuestNames(event.target.value)}
            placeholder={"Maria Silva\nJoão Silva"}
          />
        </label>
        <button type="submit" disabled={disabled}>
          <Plus aria-hidden />
          Cadastrar convite
        </button>
      </form>

      <div className="admin-list">
        {invitations.map((invitation) => (
          <article key={invitation.id}>
            <h3>{invitation.display_name}</h3>
            <ul>
              {invitation.guests.map((guest) => (
                <li key={guest.id}>
                  <span>{guest.full_name}</span>
                  <small>{guest.rsvp_status === "yes" ? "confirmado" : guest.rsvp_status === "no" ? "não vem" : "pendente"}</small>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function GiftsEditor({
  gifts,
  disabled,
  onSave,
  onDelete,
}: {
  gifts: Gift[];
  disabled: boolean;
  onSave: (gift: Gift) => void;
  onDelete: (id: string) => void;
}) {
  const blankGift: Gift = {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    amount_label: "",
    pix_code: "",
    pix_qr_url: "",
    mercado_pago_url: "",
    is_active: true,
    sort_order: gifts.length + 1,
  };

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <h2>Lista de presentes</h2>
      </div>
      <GiftForm gift={blankGift} disabled={disabled} onSave={onSave} />
      <div className="gift-admin-list">
        {gifts.map((gift) => (
          <GiftForm key={gift.id} gift={gift} disabled={disabled} onSave={onSave} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

function GiftForm({
  gift,
  disabled,
  onSave,
  onDelete,
}: {
  gift: Gift;
  disabled: boolean;
  onSave: (gift: Gift) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState(gift);

  useEffect(() => setDraft(gift), [gift]);

  return (
    <form className="gift-editor" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
      <div className="form-grid">
        <label>
          Título
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
        </label>
        <label>
          Valor
          <input value={draft.amount_label} onChange={(event) => setDraft({ ...draft, amount_label: event.target.value })} />
        </label>
        <label className="wide">
          Descrição
          <textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </label>
        <label className="wide">
          Pix copia-e-cola
          <textarea rows={3} value={draft.pix_code} onChange={(event) => setDraft({ ...draft, pix_code: event.target.value })} />
        </label>
        <label>
          URL do QR code Pix
          <input value={draft.pix_qr_url} onChange={(event) => setDraft({ ...draft, pix_qr_url: event.target.value })} />
        </label>
        <label>
          Link Mercado Pago
          <input value={draft.mercado_pago_url} onChange={(event) => setDraft({ ...draft, mercado_pago_url: event.target.value })} />
        </label>
        <label className="checkbox-line compact">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })}
          />
          <span>Presente ativo</span>
        </label>
      </div>
      <div className="button-row">
        <button type="submit" disabled={disabled}>
          <Save aria-hidden />
          Salvar presente
        </button>
        {onDelete && (
          <button type="button" className="danger" disabled={disabled} onClick={() => onDelete(draft.id)}>
            <Trash2 aria-hidden />
            Remover
          </button>
        )}
      </div>
    </form>
  );
}

function PhotosEditor({
  photos,
  disabled,
  onUpload,
}: {
  photos: Photo[];
  disabled: boolean;
  onUpload: (file: File, title: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || !title.trim()) return;
    onUpload(file, title.trim());
    setTitle("");
    setFile(null);
  }

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <h2>Fotos da página inicial</h2>
      </div>
      <form className="inline-create" onSubmit={submit}>
        <label>
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Arquivo
          <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>
        <button type="submit" disabled={disabled || !file}>
          <ImagePlus aria-hidden />
          Enviar foto
        </button>
      </form>

      <div className="photo-admin-grid">
        {photos.map((photo) => (
          <figure key={photo.id}>
            <img src={photo.image_url} alt={photo.alt_text || photo.title} />
            <figcaption>{photo.title}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
