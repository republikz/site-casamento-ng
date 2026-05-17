import {
  defaultContent,
  defaultEvent,
  defaultGifts,
  defaultInvitations,
  defaultPhotos,
} from "./mockData";
import { isSupabaseConfigured, supabase } from "./supabase";
import type {
  EventDetails,
  Gift,
  Guest,
  Invitation,
  Photo,
  RsvpSubmission,
  SiteContent,
  SiteData,
} from "./types";

const keys = {
  content: "wedding.content",
  event: "wedding.event",
  gifts: "wedding.gifts",
  photos: "wedding.photos",
  invitations: "wedding.invitations",
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function getLocal<T>(key: string, fallback: T): T {
  const saved = window.localStorage.getItem(key);
  return saved ? (JSON.parse(saved) as T) : clone(fallback);
}

function setLocal<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeInvitation(row: any): Invitation {
  return {
    id: row.id,
    display_name: row.display_name,
    contact_name: row.contact_name ?? "",
    notes: row.notes ?? "",
    guests: (row.guests ?? []).map((guest: any) => ({
      id: guest.id,
      invitation_id: guest.invitation_id,
      full_name: guest.full_name,
      is_primary: Boolean(guest.is_primary),
      rsvp_status: guest.rsvp_status ?? "pending",
      dietary_notes: guest.dietary_notes ?? "",
      accessibility_notes: guest.accessibility_notes ?? "",
    })),
  };
}

export async function getSiteData(): Promise<SiteData> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      content: getLocal(keys.content, defaultContent),
      event: getLocal(keys.event, defaultEvent),
      photos: getLocal(keys.photos, defaultPhotos),
      gifts: getLocal(keys.gifts, defaultGifts).filter((gift) => gift.is_active),
    };
  }

  const [content, event, photos, gifts] = await Promise.all([
    supabase.from("site_content").select("*").eq("id", "main").maybeSingle(),
    supabase.from("event_details").select("*").eq("id", "main").maybeSingle(),
    supabase.from("photos").select("*").order("sort_order"),
    supabase.from("gifts").select("*").eq("is_active", true).order("sort_order"),
  ]);

  if (content.error) throw content.error;
  if (event.error) throw event.error;
  if (photos.error) throw photos.error;
  if (gifts.error) throw gifts.error;

  return {
    content: content.data ?? defaultContent,
    event: event.data ?? defaultEvent,
    photos: photos.data?.length ? photos.data : defaultPhotos,
    gifts: gifts.data ?? [],
  };
}

export async function searchInvitations(term: string): Promise<Invitation[]> {
  const query = term.trim().toLocaleLowerCase("pt-BR");
  if (query.length < 3) return [];

  if (!isSupabaseConfigured || !supabase) {
    return getLocal(keys.invitations, defaultInvitations).filter((invitation) => {
      const haystack = [invitation.display_name, invitation.contact_name, ...invitation.guests.map((g) => g.full_name)]
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return haystack.includes(query);
    });
  }

  const { data, error } = await supabase.rpc("public_search_invitations", {
    search_term: query,
  });
  if (error) throw error;
  return (data ?? []).map(normalizeInvitation);
}

export async function submitRsvp(submission: RsvpSubmission) {
  if (!isSupabaseConfigured || !supabase) {
    const invitations = getLocal(keys.invitations, defaultInvitations).map((invitation) => {
      if (invitation.id !== submission.invitation_id) return invitation;
      return {
        ...invitation,
        guests: invitation.guests.map((guest) => {
          const update = submission.guests.find((item) => item.guest_id === guest.id);
          if (!update) return guest;
          return {
            ...guest,
            rsvp_status: update.will_attend ? "yes" : "no",
            dietary_notes: update.dietary_notes,
            accessibility_notes: update.accessibility_notes,
          };
        }),
        notes: submission.message,
      };
    });
    setLocal(keys.invitations, invitations);
    return;
  }

  const { error } = await supabase.rpc("submit_rsvp", {
    input_invitation_id: submission.invitation_id,
    input_guests: submission.guests,
    input_message: submission.message,
  });
  if (error) throw error;
}

export async function getAdminSnapshot() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      content: getLocal(keys.content, defaultContent),
      event: getLocal(keys.event, defaultEvent),
      photos: getLocal(keys.photos, defaultPhotos),
      gifts: getLocal(keys.gifts, defaultGifts),
      invitations: getLocal(keys.invitations, defaultInvitations),
    };
  }

  const [site, event, photos, gifts, invitations] = await Promise.all([
    supabase.from("site_content").select("*").eq("id", "main").maybeSingle(),
    supabase.from("event_details").select("*").eq("id", "main").maybeSingle(),
    supabase.from("photos").select("*").order("sort_order"),
    supabase.from("gifts").select("*").order("sort_order"),
    supabase.from("invitations").select("*, guests(*)").order("display_name"),
  ]);

  if (site.error) throw site.error;
  if (event.error) throw event.error;
  if (photos.error) throw photos.error;
  if (gifts.error) throw gifts.error;
  if (invitations.error) throw invitations.error;

  return {
    content: site.data ?? defaultContent,
    event: event.data ?? defaultEvent,
    photos: photos.data ?? [],
    gifts: gifts.data ?? [],
    invitations: (invitations.data ?? []).map(normalizeInvitation),
  };
}

export async function saveContent(content: SiteContent) {
  if (!isSupabaseConfigured || !supabase) return setLocal(keys.content, content);
  const { error } = await supabase.from("site_content").upsert(content);
  if (error) throw error;
}

export async function saveEvent(event: EventDetails) {
  if (!isSupabaseConfigured || !supabase) return setLocal(keys.event, event);
  const { error } = await supabase.from("event_details").upsert(event);
  if (error) throw error;
}

export async function saveGift(gift: Gift) {
  if (!isSupabaseConfigured || !supabase) {
    const gifts = getLocal(keys.gifts, defaultGifts);
    const next = gifts.some((item) => item.id === gift.id)
      ? gifts.map((item) => (item.id === gift.id ? gift : item))
      : [...gifts, gift];
    return setLocal(keys.gifts, next);
  }
  const { error } = await supabase.from("gifts").upsert(gift);
  if (error) throw error;
}

export async function deleteGift(id: string) {
  if (!isSupabaseConfigured || !supabase) {
    return setLocal(
      keys.gifts,
      getLocal(keys.gifts, defaultGifts).filter((gift) => gift.id !== id),
    );
  }
  const { error } = await supabase.from("gifts").delete().eq("id", id);
  if (error) throw error;
}

export async function createInvitation(displayName: string, guestNames: string[]) {
  const id = crypto.randomUUID();
  const guests: Guest[] = guestNames.map((name, index) => ({
    id: crypto.randomUUID(),
    invitation_id: id,
    full_name: name.trim(),
    is_primary: index === 0,
    rsvp_status: "pending",
    dietary_notes: "",
    accessibility_notes: "",
  }));

  if (!isSupabaseConfigured || !supabase) {
    const invitations = getLocal(keys.invitations, defaultInvitations);
    setLocal(keys.invitations, [
      ...invitations,
      { id, display_name: displayName, contact_name: guestNames[0] ?? displayName, notes: "", guests },
    ]);
    return;
  }

  const { error: invitationError } = await supabase.from("invitations").insert({
    id,
    display_name: displayName,
    contact_name: guestNames[0] ?? displayName,
    notes: "",
  });
  if (invitationError) throw invitationError;

  const { error: guestError } = await supabase.from("guests").insert(guests);
  if (guestError) throw guestError;
}

export async function uploadPhoto(file: File, title: string): Promise<Photo> {
  const id = crypto.randomUUID();

  if (!isSupabaseConfigured || !supabase) {
    const imageUrl = await fileToDataUrl(file);
    const photo: Photo = {
      id,
      title,
      image_url: imageUrl,
      alt_text: title,
      sort_order: Date.now(),
    };
    const photos = getLocal(keys.photos, defaultPhotos);
    setLocal(keys.photos, [...photos, photo]);
    return photo;
  }

  const path = `photos/${id}-${file.name}`;
  const upload = await supabase.storage.from("wedding-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (upload.error) throw upload.error;

  const { data } = supabase.storage.from("wedding-media").getPublicUrl(path);
  const photo: Photo = {
    id,
    title,
    image_url: data.publicUrl,
    alt_text: title,
    sort_order: Date.now(),
  };

  const { error } = await supabase.from("photos").insert(photo);
  if (error) throw error;
  return photo;
}

export async function signInAdmin(email: string, password: string) {
  if (!supabase) {
    throw new Error("Configure o Supabase antes de acessar o painel admin.");
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOutAdmin() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentAdmin() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
