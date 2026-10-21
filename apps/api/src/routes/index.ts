import { Hono } from "hono";
import { aiRoutes } from "./ai.js";
import { healthRoutes } from "./health.js";
import { issueRoutes } from "./issues.js";
import { integrationRoutes } from "./integrationst.js";
import { knowledgeRoutes } from "./knowledge.js";
import { agentRoutes } from "./agent.js";

const apiRoutes = new Hono();

apiRoutes.route("/api", healthRoutes);
apiRoutes.route("/api", issueRoutes);
apiRoutes.route("/api", aiRoutes);
apiRoutes.route("/api", integrationRoutes);
apiRoutes.route("/api", knowledgeRoutes);
apiRoutes.route("/api", agentRoutes);

export { apiRoutes };
