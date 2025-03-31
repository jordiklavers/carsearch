import { 
  users, 
  searches, 
  organizations,
  User, 
  InsertUser, 
  UpdateUserProfile,
  Search, 
  searchStatuses, 
  Organization,
  InsertOrganization,
  userRoles
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User>;
  updateUserRole(id: number, role: typeof userRoles[number]): Promise<User>;
  assignUserToOrganization(userId: number, organizationId: number): Promise<User>;
  
  // Organization operations
  getOrganizationById(id: number): Promise<Organization | undefined>;
  getOrganizationMembers(organizationId: number): Promise<User[]>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, organization: Partial<Organization>): Promise<Organization>;
  uploadOrganizationLogo(id: number, logoPath: string): Promise<Organization>;
  getOrganizationIdCounter(): number; // Get the current organization ID counter for iteration
  
  // Search operations
  getSearchesByUserId(userId: number): Promise<Search[]>;
  getSearchesByOrganizationId(organizationId: number): Promise<Search[]>;
  getSearchById(id: number): Promise<Search | undefined>;
  createSearch(search: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search>;
  updateSearch(id: number, search: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search>;
  updateSearchStatus(id: number, status: typeof searchStatuses[number]): Promise<Search>;
  updateSearchImages(id: number, images: string[]): Promise<Search>;
  deleteSearch(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private searches: Map<number, Search>;
  private organizations: Map<number, Organization>;
  private userIdCounter: number;
  private searchIdCounter: number;
  private organizationIdCounter: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.searches = new Map();
    this.organizations = new Map();
    this.userIdCounter = 1;
    this.searchIdCounter = 1;
    this.organizationIdCounter = 1;
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
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      phone: null,
      profilePicture: null,
      organizationId: null,
      role: "member",
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...existingUser,
      ...profile,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserRole(id: number, role: typeof userRoles[number]): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...existingUser,
      role,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async assignUserToOrganization(userId: number, organizationId: number): Promise<User> {
    const existingUser = this.users.get(userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const existingOrg = this.organizations.get(organizationId);
    if (!existingOrg) {
      throw new Error("Organization not found");
    }

    const updatedUser: User = {
      ...existingUser,
      organizationId,
      updatedAt: new Date()
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Organization operations
  async getOrganizationById(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationMembers(organizationId: number): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.organizationId === organizationId);
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const id = this.organizationIdCounter++;
    const now = new Date();
    const organization: Organization = {
      id,
      name: orgData.name,
      logo: orgData.logo || null,
      address: orgData.address || null,
      city: orgData.city || null,
      zipCode: orgData.zipCode || null,
      phone: orgData.phone || null,
      email: orgData.email || null,
      website: orgData.website || null,
      createdAt: now,
      updatedAt: now,
      pdfPrimaryColor: orgData.pdfPrimaryColor || "#4a6da7",
      pdfSecondaryColor: orgData.pdfSecondaryColor || "#333333",
      pdfCompanyName: orgData.pdfCompanyName || "CarSearch Pro",
      pdfContactInfo: orgData.pdfContactInfo || "Tel: 020-123456 | info@carsearchpro.nl | www.carsearchpro.nl",
      pdfHeaderFont: orgData.pdfHeaderFont || "Helvetica-Bold", 
      pdfBodyFont: orgData.pdfBodyFont || "Helvetica"
    };

    this.organizations.set(id, organization);
    return organization;
  }

  async updateOrganization(id: number, orgData: Partial<Organization>): Promise<Organization> {
    const existingOrg = this.organizations.get(id);
    if (!existingOrg) {
      throw new Error("Organization not found");
    }

    const updatedOrg: Organization = {
      ...existingOrg,
      ...orgData,
      id,
      updatedAt: new Date()
    };

    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }

  async uploadOrganizationLogo(id: number, logoPath: string): Promise<Organization> {
    const existingOrg = this.organizations.get(id);
    if (!existingOrg) {
      throw new Error("Organization not found");
    }

    const updatedOrg: Organization = {
      ...existingOrg,
      logo: logoPath,
      updatedAt: new Date()
    };

    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }
  
  getOrganizationIdCounter(): number {
    return this.organizationIdCounter;
  }

  // Search operations
  async getSearchesByUserId(userId: number): Promise<Search[]> {
    return Array.from(this.searches.values())
      .filter(search => search.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSearchesByOrganizationId(organizationId: number): Promise<Search[]> {
    // Get all users in the organization
    const orgUsers = await this.getOrganizationMembers(organizationId);
    const orgUserIds = orgUsers.map(user => user.id);
    
    // Return all searches for those users
    return Array.from(this.searches.values())
      .filter(search => orgUserIds.includes(search.userId))
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
