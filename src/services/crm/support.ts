export interface Ticket {
  id?: string;
  task: string;
  subject: string;
  requester_email: string;
  description: string;
  issue_category: string;
  severity: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL =
  "https://firestore.googleapis.com/v1/projects/pos-system-22c92/databases/(default)/documents/tickets";

const unwrapValue = (field: any) => {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.timestampValue !== undefined) return field.timestampValue;
  return null;
};

export const getTickets = async (): Promise<Ticket[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    const rawList = data.documents || [];

    return rawList.map((doc: any) => {
      const id = doc.name ? doc.name.split("/").pop() : "unknown";
      const fields = doc.fields || {};
      return {
        id,
        task: unwrapValue(fields.task) || "General",
        subject: unwrapValue(fields.subject) || "No Subject",
        requester_email: unwrapValue(fields.requester_email) || "",
        description: unwrapValue(fields.description) || "",
        issue_category: unwrapValue(fields.issue_category) || "Other",
        severity: unwrapValue(fields.severity) || "Low",
        created_at: unwrapValue(fields.created_at),
        updated_at: unwrapValue(fields.updated_at),
      };
    });
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    throw error;
  }
};

export const createTicket = async (ticket: Ticket): Promise<void> => {
  const now = new Date().toISOString();

  const payload = {
    fields: {
      task: { stringValue: ticket.task },
      subject: { stringValue: ticket.subject },
      requester_email: { stringValue: ticket.requester_email },
      description: { stringValue: ticket.description },
      issue_category: { stringValue: ticket.issue_category },
      severity: { stringValue: ticket.severity },
      created_at: { timestampValue: now },
      updated_at: { timestampValue: now },
    },
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create ticket: ${response.status}`);
  }
};
