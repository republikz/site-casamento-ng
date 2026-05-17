import type { Invitation } from "./types";

const csvEscape = (value: string | number | boolean) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

export function buildConfirmedGuestsCsv(invitations: Invitation[]) {
  const header = [
    "convite",
    "convidado",
    "presenca",
    "restricao_alimentar",
    "acessibilidade",
    "observacoes",
  ];

  const rows = invitations.flatMap((invitation) =>
    invitation.guests
      .filter((guest) => guest.rsvp_status === "yes")
      .map((guest) => [
        invitation.display_name,
        guest.full_name,
        "confirmado",
        guest.dietary_notes,
        guest.accessibility_notes,
        invitation.notes,
      ]),
  );

  return [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
