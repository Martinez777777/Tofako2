import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Tuto sekciu v shared/schema.ts necháme nezmenenú, ale skontrolovali sme ju.
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  type: text("type").notNull(), // 'category', 'link', 'action'
  url: text("url"),
  parentId: integer("parent_id"),
  icon: text("icon"),
  order: integer("order").notNull().default(0),
});

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  parent: one(menuItems, {
    fields: [menuItems.parentId],
    references: [menuItems.id],
    relationName: "parent_child",
  }),
  children: many(menuItems, {
    relationName: "parent_child",
  }),
}));

export const insertMenuItemSchema = createInsertSchema(menuItems);

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
