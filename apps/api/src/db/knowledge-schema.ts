import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  vector,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  contentHash: text("content_hash"),
});

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, {
        onDelete: "cascade",
      }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", {
      dimensions: 768,
    }).notNull(),
  },
  (table) => [
    uniqueIndex("document_chunk_position_idx").on(
      table.documentId,
      table.chunkIndex,
    ),
  ],
);
