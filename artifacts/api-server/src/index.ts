import app from "./app";
import { seedDefaultAdmin } from "./seed";
import { jalankanReminderWa } from "./lib/reminder-wa";

// Di Vercel Serverless, app.listen() tidak dijalankan.
// Blok ini hanya berjalan jika aplikasi dijalankan secara lokal / server biasa.
if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
  const rawPort = process.env["PORT"] || "5000";
  const port = Number(rawPort);

  seedDefaultAdmin().then(() => {
    void jalankanReminderWa().catch((error) =>
      console.error("[Reminder WA] Job awal gagal:", error),
    );
    setInterval(
      () => {
        void jalankanReminderWa().catch((error) =>
          console.error("[Reminder WA] Job berkala gagal:", error),
        );
      },
      60 * 60 * 1000,
    );

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  });
} else {
  // Menjalankan seed saat startup pertama di Vercel
  seedDefaultAdmin().catch((err) =>
    console.error("[Seed] Gagal menjalankan seed di Vercel:", err),
  );
}

// Wajib diexport sebagai default handler untuk Vercel
export default app;
