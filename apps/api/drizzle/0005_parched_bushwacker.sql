CREATE TABLE "agent_step_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"step" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"status" text NOT NULL,
	"metadata" jsonb,
	"error_code" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "agent_step_logs" ADD CONSTRAINT "agent_step_logs_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_step_logs_run_idx" ON "agent_step_logs" USING btree ("run_id");