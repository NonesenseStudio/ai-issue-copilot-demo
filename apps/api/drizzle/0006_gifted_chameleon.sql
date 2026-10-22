ALTER TABLE "agent_runs" ADD COLUMN "lease_until" timestamp;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD COLUMN "lease_token" uuid;