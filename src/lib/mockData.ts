import type { EventDetails, Gift, Invitation, Photo, SiteContent } from "./types";

export const defaultContent: SiteContent = {
  id: "main",
  couple_names: "N & G",
  hero_title: "Uma nova aliança será celebrada",
  hero_subtitle:
    "Entre oliveiras, cartas antigas e uma promessa de casa, convidamos você para atravessar este capítulo conosco.",
  story_title: "Nossa história",
  story_text:
    "Aqui entra a história de vocês: o primeiro encontro, os pequenos sinais, as viagens, as escolhas e os capítulos que trouxeram todos até este dia. O painel admin permite trocar este texto quando quiser.",
  closing_note:
    "Prepare o coração, escolha bons sapatos e venha celebrar como quem chega a um salão iluminado depois de uma longa jornada.",
};

export const defaultEvent: EventDetails = {
  id: "main",
  date_label: "Sábado, 18 de outubro de 2026",
  time_label: "16h30",
  venue_name: "Local a confirmar",
  venue_address: "Endereço completo será inserido no painel admin",
  map_url: "",
  dress_code: "Traje passeio completo em tons terrosos, verdes, lavanda ou neutros",
  notes:
    "Chegue com alguns minutos de antecedência para encontrar seu lugar com calma. Novas informações podem ser atualizadas aqui.",
};

export const defaultPhotos: Photo[] = [];

export const defaultGifts: Gift[] = [
  {
    id: "gift-1",
    title: "Uma rodada na taverna",
    description: "Ajude os noivos a brindarem a primeira noite da jornada.",
    amount_label: "R$ 80",
    pix_code: "Cole aqui a chave ou código Pix no painel admin",
    pix_qr_url: "",
    mercado_pago_url: "",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "gift-2",
    title: "Mapa para a próxima aventura",
    description: "Contribuição para a lua de mel, com direito a histórias exageradas depois.",
    amount_label: "R$ 180",
    pix_code: "Cole aqui a chave ou código Pix no painel admin",
    pix_qr_url: "",
    mercado_pago_url: "",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "gift-3",
    title: "Reforço para o tesouro do reino",
    description: "Um presente livre para equipar a nova casa.",
    amount_label: "Valor livre",
    pix_code: "Cole aqui a chave ou código Pix no painel admin",
    pix_qr_url: "",
    mercado_pago_url: "",
    is_active: true,
    sort_order: 3,
  },
];

export const defaultInvitations: Invitation[] = [
  {
    id: "invite-1",
    display_name: "Família Exemplo",
    contact_name: "Convidado Exemplo",
    notes: "Grupo de demonstração",
    guests: [
      {
        id: "guest-1",
        invitation_id: "invite-1",
        full_name: "Convidado Exemplo",
        is_primary: true,
        rsvp_status: "pending",
        dietary_notes: "",
        accessibility_notes: "",
      },
      {
        id: "guest-2",
        invitation_id: "invite-1",
        full_name: "Acompanhante Exemplo",
        is_primary: false,
        rsvp_status: "pending",
        dietary_notes: "",
        accessibility_notes: "",
      },
    ],
  },
];
