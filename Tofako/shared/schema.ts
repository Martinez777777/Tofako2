import { z } from "zod";

export const menuItemSchema = z.object({
  id: z.number(),
  label: z.string(),
  type: z.string(),
  url: z.string().nullable(),
  parentId: z.number().nullable(),
  icon: z.string().nullable(),
  order: z.number().default(0),
});

export const insertMenuItemSchema = menuItemSchema.omit({ id: true }).partial({
  url: true,
  parentId: true,
  icon: true,
  order: true,
});

export type MenuItem = z.infer<typeof menuItemSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
