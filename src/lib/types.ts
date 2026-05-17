export type RsvpStatus = "pending" | "yes" | "no";

export interface SiteContent {
  id: "main";
  couple_names: string;
  hero_title: string;
  hero_subtitle: string;
  story_title: string;
  story_text: string;
  closing_note: string;
}

export interface EventDetails {
  id: "main";
  date_label: string;
  time_label: string;
  venue_name: string;
  venue_address: string;
  map_url: string;
  dress_code: string;
  notes: string;
}

export interface Photo {
  id: string;
  title: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
}

export interface Guest {
  id: string;
  invitation_id: string;
  full_name: string;
  is_primary: boolean;
  rsvp_status: RsvpStatus;
  dietary_notes: string;
  accessibility_notes: string;
}

export interface Invitation {
  id: string;
  display_name: string;
  contact_name: string;
  notes: string;
  guests: Guest[];
}

export interface RsvpGuestSelection {
  guest_id: string;
  will_attend: boolean;
  dietary_notes: string;
  accessibility_notes: string;
}

export interface RsvpSubmission {
  invitation_id: string;
  guests: RsvpGuestSelection[];
  message: string;
}

export interface RsvpMessage {
  id: string;
  invitation_id: string;
  message: string;
  created_at: string;
}

export interface Gift {
  id: string;
  title: string;
  description: string;
  amount_label: string;
  pix_code: string;
  pix_qr_url: string;
  mercado_pago_url: string;
  is_active: boolean;
  sort_order: number;
}

export interface SiteData {
  content: SiteContent;
  event: EventDetails;
  photos: Photo[];
  gifts: Gift[];
}
