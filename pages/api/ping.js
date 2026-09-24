// Ping this every few minutes (via a free external cron service) so Vercel
// never lets the app go fully idle. This alone doesn't call the AI or the
// database — it just keeps the server warm and responds instantly.
export default function handler(req, res) {
  res.status(200).json({ ok: true, time: Date.now() });
}
