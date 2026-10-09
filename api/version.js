import { flags } from "../lib/flags.js";

/** Reports which commit and environment this deployment runs, so QA can confirm what they test. */
export default function handler(_req, res) {
  res.status(200).json({
    environment: process.env.APP_ENV ?? "local",
    sha: process.env.APP_SHA ?? "unknown",
    flags,
  });
}
