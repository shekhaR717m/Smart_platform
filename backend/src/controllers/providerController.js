import { providers } from "../data/providers.js";

export function listProviders(_req, res) {
  res.json({ providers });
}
