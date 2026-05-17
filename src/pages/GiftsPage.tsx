import { Copy, ExternalLink, Gift as GiftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingBlock } from "../components/LoadingBlock";
import { PageHeader } from "../components/PageHeader";
import { getSiteData } from "../lib/api";
import type { Gift } from "../lib/types";

export function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSiteData()
      .then((data) => setGifts(data.gifts))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function copyPix(gift: Gift) {
    await navigator.clipboard.writeText(gift.pix_code);
    setCopied(gift.id);
    window.setTimeout(() => setCopied(""), 1800);
  }

  if (error) return <div className="notice error">Não foi possível carregar presentes: {error}</div>;

  return (
    <>
      <PageHeader
        eyebrow="Tesouro compartilhado"
        title="Lista de presentes"
        description="Opções leves, temáticas e sem cerimônia. Escolha uma contribuição e use Pix ou Mercado Pago."
      />

      {loading ? (
        <LoadingBlock label="Organizando o tesouro..." />
      ) : (
        <section className="gift-grid">
          {gifts.map((gift) => (
            <article className="gift-card" key={gift.id}>
              <div className="gift-icon">
                <GiftIcon aria-hidden />
              </div>
              <p className="eyebrow">{gift.amount_label}</p>
              <h2>{gift.title}</h2>
              <p>{gift.description}</p>
              {gift.pix_qr_url && <img className="qr-code" src={gift.pix_qr_url} alt={`QR code Pix para ${gift.title}`} />}
              <div className="gift-actions">
                {gift.pix_code && (
                  <button type="button" onClick={() => copyPix(gift)}>
                    <Copy aria-hidden />
                    {copied === gift.id ? "Pix copiado" : "Copiar Pix"}
                  </button>
                )}
                {gift.mercado_pago_url && (
                  <a href={gift.mercado_pago_url} target="_blank" rel="noreferrer">
                    Mercado Pago <ExternalLink aria-hidden />
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
