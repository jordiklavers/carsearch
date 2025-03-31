import { users, searches, User, InsertUser, Search, searchStatuses } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Search operations
  getSearchesByUserId(userId: number): Promise<Search[]>;
  getSearchById(id: number): Promise<Search | undefined>;
  createSearch(search: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search>;
  updateSearch(id: number, search: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search>;
  updateSearchStatus(id: number, status: typeof searchStatuses[number]): Promise<Search>;
  updateSearchImages(id: number, images: string[]): Promise<Search>;
  deleteSearch(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private searches: Map<number, Search>;
  private userIdCounter: number;
  private searchIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.searches = new Map();
    this.userIdCounter = 1;
    this.searchIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Search operations
  async getSearchesByUserId(userId: number): Promise<Search[]> {
    return Array.from(this.searches.values())
      .filter(search => search.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSearchById(id: number): Promise<Search | undefined> {
    return this.searches.get(id);
  }

  async createSearch(searchData: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search> {
    const id = this.searchIdCounter++;
    const now = new Date();
    const search: Search = {
      ...searchData,
      id,
      createdAt: now,
      updatedAt: now,
      images: searchData.images || []
    };
    this.searches.set(id, search);
    return search;
  }

  async updateSearch(id: number, searchData: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search> {
    const existingSearch = this.searches.get(id);
    if (!existingSearch) {
      throw new Error("Search not found");
    }
    
    const updatedSearch: Search = {
      ...existingSearch,
      ...searchData,
      id,
      updatedAt: new Date(),
      images: existingSearch.images // Keep existing images
    };
    
    this.searches.set(id, updatedSearch);
    return updatedSearch;
  }

  async updateSearchStatus(id: number, status: typeof searchStatuses[number]): Promise<Search> {
    const existingSearch = this.searches.get(id);
    if (!existingSearch) {
      throw new Error("Search not found");
    }
    
    const updatedSearch: Search = {
      ...existingSearch,
      status,
      updatedAt: new Date()
    };
    
    this.searches.set(id, updatedSearch);
    return updatedSearch;
  }

  async updateSearchImages(id: number, images: string[]): Promise<Search> {
    const existingSearch = this.searches.get(id);
    if (!existingSearch) {
      throw new Error("Search not found");
    }
    
    const updatedSearch: Search = {
      ...existingSearch,
      images,
      updatedAt: new Date()
    };
    
    this.searches.set(id, updatedSearch);
    return updatedSearch;
  }

  async deleteSearch(id: number): Promise<void> {
    if (!this.searches.has(id)) {
      throw new Error("Search not found");
    }
    
    this.searches.delete(id);
  }
}

// Export a singleton instance
export const storage = new MemStorage();
