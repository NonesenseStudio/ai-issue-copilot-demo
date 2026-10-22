CREATE TABLE "ai_call_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid,
	"operation" text NOT NULL,
	"model" text NOT NULL,
	"status" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer NOT NULL,
	"estimated_cost_usd" numeric(14, 8),
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_call_logs" ADD CONSTRAINT "ai_call_logs_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_call_logs_run_idx" ON "ai_call_logs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ai_call_logs_created_idx" ON "ai_call_logs" USING btree ("created_at");