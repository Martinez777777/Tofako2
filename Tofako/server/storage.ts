import {
  type MenuItem,
  type InsertMenuItem
} from "@shared/schema";
import menuData from "./menu_data.json";

export interface IStorage {
  getMenuItems(): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  seedMenuItems(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private menuItems: MenuItem[] = (menuData as any[]).map(item => ({
    id: Number(item.id),
    label: String(item.label),
    type: String(item.type),
    url: item.url ? String(item.url) : null,
    parentId: (item.parentId === null || item.parentId === undefined || item.parentId === 0) ? null : Number(item.parentId),
    icon: item.icon ? String(item.icon) : null,
    order: Number(item.order || 0)
  }));

  async getMenuItems(): Promise<MenuItem[]> {
    return this.menuItems.sort((a, b) => a.order - b.order);
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const newItem: MenuItem = {
      id: Math.max(0, ...this.menuItems.map(i => i.id)) + 1,
      label: item.label,
      type: item.type,
      url: item.url ?? null,
      parentId: item.parentId ?? null,
      icon: item.icon ?? null,
      order: item.order ?? 0
    };
    this.menuItems.push(newItem);
    return newItem;
  }

  async seedMenuItems(): Promise<void> {
    // Menu is static now, no seeding needed
  }
}

export const storage = new DatabaseStorage();
