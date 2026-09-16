import app from "./app";
import { seedDefaultAdmin } from "./seed";
import { jalankanReminderWa } from "./lib/reminder-wa";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

seedDefaultAdmin().then(() => {
  void jalankanReminderWa().catch((error) => console.error("[Reminder WA] Job awal gagal:", error));
  setInterval(() => {
    void jalankanReminderWa().catch((error) => console.error("[Reminder WA] Job berkala gagal:", error));
  }, 60 * 60 * 1000);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
