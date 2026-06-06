import { Cencori } from "cencori";

let client: Cencori | null = null;

export function getCencoriClient() {
  const apiKey = process.env.CENCORI_API_KEY;

  if (!apiKey) {
    throw new Error("CENCORI_API_KEY is not configured.");
  }

  if (!client) {
    client = new Cencori({ apiKey });
  }

  return client;
}
