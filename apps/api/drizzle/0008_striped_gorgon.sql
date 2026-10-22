CREATE TABLE "ai_budgets" (
	"scope" text PRIMARY KEY NOT NULL,
	"limit_usd" numeric(14, 8) NOT NULL,
	"used_usd" numeric(14, 8) DEFAULT '0' NOT NULL,
	"reserved_usd" numeric(14, 8) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
