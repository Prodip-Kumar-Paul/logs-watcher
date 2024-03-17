import express from "express";
import responseTime from "response-time";
import client from "prom-client";
import { createLogger, transports } from "winston";
import LokiTransport from "winston-loki";

const options = {
   transports: [
      new LokiTransport({
         labels: {
            appName: "express",
         },
         host: "http://127.0.0.1:3100",
      }),
   ],
};
const logger = createLogger(options);

import { doSomeHeavyTask } from "./utill.js";

const app = express();
const PORT = process.env.PORT || 8080;

const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics({ register: client.register });

const reqResTime = new client.Histogram({
   name: "http_express_req_res_time",
   help: "This tells how much time is taken by req and res",
   labelNames: ["method", "route", "Status_code"],
   buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 2000, 3000],
});

const totalReqCounter = new client.Counter({
   name: "total_req",
   help: "Tells total req",
});

app.use(
   responseTime((req, res, time) => {
      totalReqCounter.inc();
      reqResTime
         .labels({
            method: req.method,
            route: req.url,
            Status_code: res.statusCode,
         })
         .observe(time);
   })
);

app.get("/", (req, res) => {
   logger.info("Req come on / route");
   return res.json({ message: "Hello from Express Server" });
});

app.get("/slow", async (req, res) => {
   try {
      logger.info("Req come on /slow route");
      const timeTaken = await doSomeHeavyTask();
      console.log(`Heavy task completed in ${timeTaken.timeTaken} ms`);
      return res.json({
         status: "Success",
         message: `Heavy task completed in ${timeTaken.timeTaken} ms`,
      });
   } catch (e) {
      logger.error(e.message);
      return res
         .status(500)
         .json({ status: "Error", error: "Internal Server Error" });
   }
});

app.get("/metrics", async (req, res) => {
   res.setHeader("Content-Type", client.register.contentType);
   const metrics = await client.register.metrics();
   res.send(metrics);
});

app.listen(PORT, () =>
   console.log(`Express Server Started at http:localhost:${PORT}`)
);
