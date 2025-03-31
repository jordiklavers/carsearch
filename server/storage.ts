import { 
  users, 
  searches, 
  organizations,
  customers,
  User, 
  InsertUser, 
  UpdateUserProfile,
  Search, 
  searchStatuses, 
  Organization,
  InsertOrganization,
  Customer,
  InsertCustomer,
  userRoles
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

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
  getOrganizationIdCounter(): number; // Get the current organization ID counter for iteration (not needed with database implementation)
  
  // Search operations
  getSearchesByUserId(userId: number): Promise<Search[]>;
  getSearchesByOrganizationId(organizationId: number): Promise<Search[]>;
  getSearchById(id: number): Promise<Search | undefined>;
  createSearch(search: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search>;
  updateSearch(id: number, search: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search>;
  updateSearchStatus(id: number, status: typeof searchStatuses[number]): Promise<Search>;
  updateSearchImages(id: number, images: string[]): Promise<Search>;
  deleteSearch(id: number): Promise<void>;
  
  // Customer operations
  getCustomersByOrganizationId(organizationId: number): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  createCustomer(organizationId: number, customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private searches: Map<number, Search>;
  private organizations: Map<number, Organization>;
  private customers: Map<number, Customer>;
  private userIdCounter: number;
  private searchIdCounter: number;
  private organizationIdCounter: number;
  private customerIdCounter: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.searches = new Map();
    this.organizations = new Map();
    this.customers = new Map();
    this.userIdCounter = 1;
    this.searchIdCounter = 1;
    this.organizationIdCounter = 1;
    this.customerIdCounter = 1;
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

  // Customer operations
  async getCustomersByOrganizationId(organizationId: number): Promise<Customer[]> {
    return Array.from(this.customers.values())
      .filter(customer => customer.organizationId === organizationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(organizationId: number, customerData: InsertCustomer): Promise<Customer> {
    const id = this.customerIdCounter++;
    const now = new Date();
    const customer: Customer = {
      ...customerData,
      id,
      organizationId,
      phone: customerData.phone || null,
      address: customerData.address || null,
      city: customerData.city || null,
      zipCode: customerData.zipCode || null,
      notes: customerData.notes || null,
      createdAt: now,
      updatedAt: now
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) {
      throw new Error("Customer not found");
    }
    
    const updatedCustomer: Customer = {
      ...existingCustomer,
      ...customerData,
      id,
      updatedAt: new Date()
    };
    
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    if (!this.customers.has(id)) {
      throw new Error("Customer not found");
    }
    
    this.customers.delete(id);
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create a session store that uses Postgres
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL || '',
      },
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      phone: null,
      profilePicture: null,
      organizationId: null,
      role: "member"
    }).returning();
    return user;
  }

  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User> {
    const updates = { ...profile, updatedAt: new Date() };
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }

  async updateUserRole(id: number, role: typeof userRoles[number]): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }

  async assignUserToOrganization(userId: number, organizationId: number): Promise<User> {
    // First check if organization exists
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));
    
    if (!organization) {
      throw new Error("Organization not found");
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        organizationId, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }

  // Organization operations
  async getOrganizationById(id: number): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    
    return organization;
  }

  async getOrganizationMembers(organizationId: number): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.organizationId, organizationId));
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values({
        name: orgData.name,
        logo: orgData.logo || null,
        address: orgData.address || null,
        city: orgData.city || null,
        zipCode: orgData.zipCode || null,
        phone: orgData.phone || null,
        email: orgData.email || null,
        website: orgData.website || null,
        pdfPrimaryColor: orgData.pdfPrimaryColor || "#4a6da7",
        pdfSecondaryColor: orgData.pdfSecondaryColor || "#333333",
        pdfCompanyName: orgData.pdfCompanyName || "CarSearch Pro",
        pdfContactInfo: orgData.pdfContactInfo || "Tel: 020-123456 | info@carsearchpro.nl | www.carsearchpro.nl",
        pdfHeaderFont: orgData.pdfHeaderFont || "Helvetica-Bold",
        pdfBodyFont: orgData.pdfBodyFont || "Helvetica"
      })
      .returning();
    
    return organization;
  }

  async updateOrganization(id: number, orgData: Partial<Organization>): Promise<Organization> {
    const updates = {
      ...orgData,
      updatedAt: new Date()
    };
    
    const [updatedOrg] = await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, id))
      .returning();
    
    if (!updatedOrg) {
      throw new Error("Organization not found");
    }
    
    return updatedOrg;
  }

  async uploadOrganizationLogo(id: number, logoPath: string): Promise<Organization> {
    const [updatedOrg] = await db
      .update(organizations)
      .set({ 
        logo: logoPath, 
        updatedAt: new Date() 
      })
      .where(eq(organizations.id, id))
      .returning();
    
    if (!updatedOrg) {
      throw new Error("Organization not found");
    }
    
    return updatedOrg;
  }
  
  getOrganizationIdCounter(): number {
    // Note: This is no longer needed with auto-incrementing IDs in the database
    // But keeping the method to maintain compatibility with the interface
    return 0;
  }

  // Search operations
  async getSearchesByUserId(userId: number): Promise<Search[]> {
    return db
      .select()
      .from(searches)
      .where(eq(searches.userId, userId))
      .orderBy(desc(searches.createdAt));
  }

  async getSearchesByOrganizationId(organizationId: number): Promise<Search[]> {
    // Get all users in the organization
    const orgUsers = await this.getOrganizationMembers(organizationId);
    const orgUserIds = orgUsers.map(user => user.id);
    
    if (orgUserIds.length === 0) {
      return [];
    }
    
    // Return all searches for those users
    return await db
      .select()
      .from(searches)
      .where(users => 
        orgUserIds.map(id => eq(searches.userId, id)).reduce((a, b) => a || b)
      )
      .orderBy(desc(searches.createdAt));
  }

  async getSearchById(id: number): Promise<Search | undefined> {
    const [search] = await db
      .select()
      .from(searches)
      .where(eq(searches.id, id));
    
    return search;
  }

  async createSearch(searchData: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search> {
    const [search] = await db
      .insert(searches)
      .values({
        ...searchData,
        images: searchData.images || []
      })
      .returning();
    
    return search;
  }

  async updateSearch(id: number, searchData: Omit<Search, "id" | "createdAt" | "updatedAt">): Promise<Search> {
    // Get existing search to keep images
    const [existingSearch] = await db
      .select()
      .from(searches)
      .where(eq(searches.id, id));
    
    if (!existingSearch) {
      throw new Error("Search not found");
    }
    
    // Update with new data
    const [updatedSearch] = await db
      .update(searches)
      .set({
        ...searchData,
        images: existingSearch.images, // Keep existing images
        updatedAt: new Date()
      })
      .where(eq(searches.id, id))
      .returning();
    
    return updatedSearch;
  }

  async updateSearchStatus(id: number, status: typeof searchStatuses[number]): Promise<Search> {
    const [updatedSearch] = await db
      .update(searches)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(searches.id, id))
      .returning();
    
    if (!updatedSearch) {
      throw new Error("Search not found");
    }
    
    return updatedSearch;
  }

  async updateSearchImages(id: number, images: string[]): Promise<Search> {
    const [updatedSearch] = await db
      .update(searches)
      .set({ 
        images, 
        updatedAt: new Date() 
      })
      .where(eq(searches.id, id))
      .returning();
    
    if (!updatedSearch) {
      throw new Error("Search not found");
    }
    
    return updatedSearch;
  }

  async deleteSearch(id: number): Promise<void> {
    const result = await db
      .delete(searches)
      .where(eq(searches.id, id));
    
    if (!result) {
      throw new Error("Search not found");
    }
  }

  // Customer operations
  async getCustomersByOrganizationId(organizationId: number): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(eq(customers.organizationId, organizationId))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    
    return customer;
  }

  async createCustomer(organizationId: number, customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values({
        ...customerData,
        organizationId,
        phone: customerData.phone || null,
        address: customerData.address || null,
        city: customerData.city || null,
        zipCode: customerData.zipCode || null,
        notes: customerData.notes || null
      })
      .returning();
    
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer> {
    const updates = {
      ...customerData,
      updatedAt: new Date()
    };
    
    const [updatedCustomer] = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    
    if (!updatedCustomer) {
      throw new Error("Customer not found");
    }
    
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    const result = await db
      .delete(customers)
      .where(eq(customers.id, id));
    
    if (!result) {
      throw new Error("Customer not found");
    }
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage();
