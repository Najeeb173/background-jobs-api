import express from "express";
import { randomUUID } from "crypto";
import { Inngest } from "inngest";
import { serve } from "inngest/express";

const app = express();
app.use(express.json());

const inngest = new Inngest({ id: "report-api" });
const reports = {}; // our in-memory storage

// ---------- Endpoints ----------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/reports", async (req, res) => {
  const topic = req.body?.topic;
  if (!topic) return res.status(400).json({ error: "topic is required" });

  const id = randomUUID();
  reports[id] = { id, topic, status: "pending" };

  await inngest.send({ name: "report/requested", data: { id, topic } });

  res.status(202).json({ id, status: "pending" });
});

app.get("/reports/:id", (req, res) => {
  const report = reports[req.params.id];
  if (!report) return res.status(404).json({ error: "not found" });
  res.json(report);
});

// ---------- Background functions ----------
const sayHello = inngest.createFunction(
  { id: "say-hello", triggers: [{ event: "test/hello" }] },
  async ({ step }) => {
    await step.sleep("wait", "5s");
    return "Hello from the background!";
  }
);

const makeReport = inngest.createFunction(
  { id: "make-report", retries: 2, triggers: [{ event: "report/requested" }] },
  async ({ event, step }) => {
    const { id, topic } = event.data;

    await step.sleep("do-the-slow-work", "8s");

    await step.run("build-report", () => {
      if (topic === "fail") throw new Error("The report oven is broken!");
      reports[id] = { id, topic, status: "done", result: `Report about ${topic}` };
    });
  }
);

const heartbeat = inngest.createFunction(
  { id: "heartbeat", triggers: [{ cron: "* * * * *" }] },
  async () => {
    const all = Object.values(reports);
    const count = (s) => all.filter((r) => r.status === s).length;
    console.log(`pending=${count("pending")} done=${count("done")} failed=${count("failed")}`);
  }
);

// ---------- Connect Inngest ----------
app.use("/api/inngest", serve({ client: inngest, functions: [sayHello, makeReport, heartbeat] }));

app.listen(3000, () => console.log("API running on http://localhost:3000"));