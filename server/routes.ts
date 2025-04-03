import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertSearchSchema, 
  searchStatuses, 
  insertOrganizationSchema, 
  updateUserProfileSchema, 
  userRoles,
  insertCustomerSchema
} from "@shared/schema";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createPDF } from "./pdf";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Alleen afbeeldingen zijn toegestaan!'));
    }
  }
});

// Authentication Middleware
function isAuthenticated(req: Request, res: Response, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Car Searches API
  // Get all searches for the current user
  app.get("/api/searches", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      const [searches, total] = await Promise.all([
        storage.getSearchesByUserId(req.user!.id, limit, offset),
        storage.getSearchesCountByUserId(req.user!.id)
      ]);
      
      res.json({
        searches,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get a single search by ID
  app.get("/api/searches/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearchById(id);
      
      if (!search) {
        return res.status(404).json({ message: "Zoekopdracht niet gevonden" });
      }
      
      if (search.userId !== req.user!.id) {
        return res.status(403).json({ message: "Geen toegang tot deze zoekopdracht" });
      }
      
      res.json(search);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new search
  app.post("/api/searches", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSearchSchema.parse(req.body);
      
      // Add null for any undefined additionalRequirements
      // Ensure status is always set to "active" for new searches
      const searchData = {
        ...validatedData,
        userId: req.user!.id,
        images: [],
        status: "active" as const,
        additionalRequirements: validatedData.additionalRequirements || null
      };
      
      const search = await storage.createSearch(searchData);
      
      res.status(201).json(search);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validatiefout", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update a search
  app.put("/api/searches/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearchById(id);
      
      if (!search) {
        return res.status(404).json({ message: "Zoekopdracht niet gevonden" });
      }
      
      if (search.userId !== req.user!.id) {
        return res.status(403).json({ message: "Geen toegang tot deze zoekopdracht" });
      }
      
      const validatedData = insertSearchSchema.parse(req.body);
      
      // Include search.images to maintain images
      // Add null for any undefined additionalRequirements
      // Keep existing status if not provided, and ensure it's typed correctly
      const status = validatedData.status ? 
        (validatedData.status as "active" | "completed") : 
        (search.status as "active" | "completed");
        
      const updateData = {
        ...validatedData,
        userId: req.user!.id,
        images: search.images,
        status,
        additionalRequirements: validatedData.additionalRequirements || null
      };
      
      const updatedSearch = await storage.updateSearch(id, updateData);
      
      res.json(updatedSearch);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validatiefout", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update search status
  app.patch("/api/searches/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearchById(id);
      
      if (!search) {
        return res.status(404).json({ message: "Zoekopdracht niet gevonden" });
      }
      
      if (search.userId !== req.user!.id) {
        return res.status(403).json({ message: "Geen toegang tot deze zoekopdracht" });
      }
      
      const { status } = req.body;
      
      if (!searchStatuses.includes(status)) {
        return res.status(400).json({ message: "Ongeldige status" });
      }
      
      const updatedSearch = await storage.updateSearchStatus(id, status);
      res.json(updatedSearch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Upload images for a search
  app.post("/api/searches/:id/upload", isAuthenticated, upload.array("images", 5), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearchById(id);
      
      if (!search) {
        return res.status(404).json({ message: "Zoekopdracht niet gevonden" });
      }
      
      if (search.userId !== req.user!.id) {
        return res.status(403).json({ message: "Geen toegang tot deze zoekopdracht" });
      }
      
      const files = req.files as Express.Multer.File[];
      const imageIds = files.map(file => path.basename(file.path));
      
      // Update the search with the new images
      const existingImages = search.images || [];
      const updatedSearch = await storage.updateSearchImages(id, [...existingImages, ...imageIds]);
      
      res.json({ 
        message: "Afbeeldingen geüpload", 
        imageIds: imageIds
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update images for a search
  app.patch("/api/searches/:id/images", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearchById(id);
      
      if (!search) {
        return res.status(404).json({ message: "Zoekopdracht niet gevonden" });
      }
      
      if (search.userId !== req.user!.id) {
        return res.status(403).json({ message: "Geen toegang tot deze zoekopdracht" });
      }
      
      const { images } = req.body;
      
      if (!Array.isArray(images)) {
        return res.status(400).json({ message: "Afbeeldingen moeten een array zijn" });
      }
      
      const updatedSearch = await storage.updateSearchImages(id, images);
      res.json(updatedSearch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a search
  app.delete("/api/searches/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearchById(id);
      
      if (!search) {
        return res.status(404).json({ message: "Zoekopdracht niet gevonden" });
      }
      
      if (search.userId !== req.user!.id) {
        return res.status(403).json({ message: "Geen toegang tot deze zoekopdracht" });
      }
      
      await storage.deleteSearch(id);
      res.json({ message: "Zoekopdracht verwijderd" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serve images
  app.get("/api/images/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const filepath = path.join(uploadDir, filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: "Afbeelding niet gevonden" });
      }
      
      res.sendFile(filepath);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate and download PDF
  app.get("/api/searches/:id/pdf", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearchById(id);
      
      if (!search) {
        return res.status(404).json({ message: "Zoekopdracht niet gevonden" });
      }
      
      if (search.userId !== req.user!.id) {
        return res.status(403).json({ message: "Geen toegang tot deze zoekopdracht" });
      }
      
      const pdfBuffer = await createPDF(search);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=zoekopdracht_${id}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User profile management
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      res.json(req.user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get current user's organization
  app.get("/api/my-organization", isAuthenticated, async (req, res) => {
    try {
      if (!req.user!.organizationId) {
        return res.status(404).json({ message: "Geen organisatie gevonden" });
      }
      
      const organization = await storage.getOrganizationById(req.user!.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organisatie niet gevonden" });
      }
      
      res.json(organization);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updateUserProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUserProfile(req.user!.id, validatedData);
      res.json(updatedUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validatiefout", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Organization management
  app.get("/api/organizations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganizationById(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organisatie niet gevonden" });
      }
      
      // Check if user is part of this organization
      if (req.user!.organizationId !== id) {
        return res.status(403).json({ message: "Geen toegang tot deze organisatie" });
      }
      
      res.json(organization);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/organizations", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(validatedData);
      
      // Automatically assign the creator as admin
      await storage.assignUserToOrganization(req.user!.id, organization.id);
      await storage.updateUserRole(req.user!.id, "admin");
      
      res.status(201).json(organization);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validatiefout", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/organizations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganizationById(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organisatie niet gevonden" });
      }
      
      // Check if user is admin of this organization
      if (req.user!.organizationId !== id || req.user!.role !== "admin") {
        return res.status(403).json({ message: "Geen toestemming om deze organisatie te bewerken" });
      }
      
      const updatedOrg = await storage.updateOrganization(id, req.body);
      res.json(updatedOrg);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Organization logo upload
  app.post("/api/organizations/:id/logo", isAuthenticated, upload.single("logo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganizationById(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organisatie niet gevonden" });
      }
      
      // Check if user is admin of this organization
      if (req.user!.organizationId !== id || req.user!.role !== "admin") {
        return res.status(403).json({ message: "Geen toestemming om het logo te wijzigen" });
      }
      
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ message: "Geen bestand geüpload" });
      }
      
      const logoPath = path.basename(file.path);
      const updatedOrg = await storage.uploadOrganizationLogo(id, logoPath);
      
      res.json({ 
        message: "Logo geüpload", 
        logoPath: logoPath,
        organization: updatedOrg
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Upload profile picture
  app.post("/api/profile/picture", isAuthenticated, upload.single("profilePicture"), async (req, res) => {
    try {
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ message: "Geen bestand geüpload" });
      }
      
      const picturePath = path.basename(file.path);
      const updatedUser = await storage.updateUserProfile(req.user!.id, {
        profilePicture: picturePath
      });
      
      res.json({ 
        message: "Profielfoto geüpload", 
        picturePath: picturePath,
        user: updatedUser
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Organization members management
  app.get("/api/organizations/:id/members", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganizationById(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organisatie niet gevonden" });
      }
      
      // Check if user is part of this organization
      if (req.user!.organizationId !== id) {
        return res.status(403).json({ message: "Geen toegang tot deze organisatie" });
      }
      
      const members = await storage.getOrganizationMembers(id);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update member role (admin only)
  app.patch("/api/organizations/:orgId/members/:userId/role", isAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      // Validate role
      if (!userRoles.includes(role)) {
        return res.status(400).json({ message: "Ongeldige rol" });
      }
      
      // Check if organization exists
      const organization = await storage.getOrganizationById(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organisatie niet gevonden" });
      }
      
      // Check if user is admin of this organization
      if (req.user!.organizationId !== orgId || req.user!.role !== "admin") {
        return res.status(403).json({ message: "Geen toestemming om rollen te wijzigen" });
      }
      
      // Check if target user exists and is part of this organization
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.organizationId !== orgId) {
        return res.status(404).json({ message: "Gebruiker niet gevonden in deze organisatie" });
      }
      
      // Update the role
      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add member to organization (admin only)
  app.post("/api/organizations/:id/members", isAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "Gebruikers-ID is vereist" });
      }
      
      // Check if organization exists
      const organization = await storage.getOrganizationById(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organisatie niet gevonden" });
      }
      
      // Check if user is admin of this organization
      if (req.user!.organizationId !== orgId || req.user!.role !== "admin") {
        return res.status(403).json({ message: "Geen toestemming om leden toe te voegen" });
      }
      
      // Check if target user exists and is not already part of an organization
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      if (targetUser.organizationId) {
        return res.status(400).json({ message: "Gebruiker is al lid van een organisatie" });
      }
      
      // Add the user to the organization
      const updatedUser = await storage.assignUserToOrganization(userId, orgId);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get organization searches (for members)
  app.get("/api/organizations/:id/searches", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganizationById(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organisatie niet gevonden" });
      }
      
      // Check if user is part of this organization
      if (req.user!.organizationId !== id) {
        return res.status(403).json({ message: "Geen toegang tot deze organisatie" });
      }
      
      const searches = await storage.getSearchesByOrganizationId(id);
      res.json(searches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User organization assignment
  app.post("/api/users/assign-organization", isAuthenticated, async (req, res) => {
    try {
      const { username, organizationId } = req.body;
      
      if (!username || !organizationId) {
        return res.status(400).json({ message: "Gebruikersnaam en organisatie-ID zijn vereist" });
      }
      
      // Check if organization exists
      const organization = await storage.getOrganizationById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organisatie niet gevonden" });
      }
      
      // Find the user by username
      const targetUser = await storage.getUserByUsername(username);
      if (!targetUser) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Assign the user to the organization
      const updatedUser = await storage.assignUserToOrganization(targetUser.id, organizationId);
      res.json({
        message: `${username} is toegewezen aan organisatie ${organization.name}`,
        user: updatedUser
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // List all organizations (for development/admin purposes)
  app.get("/api/organizations", isAuthenticated, async (req, res) => {
    try {
      // Filter organizations to just return id and name for dropdown options
      const orgs = await Promise.all(
        Array.from({ length: storage.getOrganizationIdCounter() }, (_, i) => i + 1)
          .map(async (id) => {
            const org = await storage.getOrganizationById(id);
            return org ? { id: org.id, name: org.name } : null;
          })
      );
      
      // Filter out null values (deleted or non-existent orgs)
      const filteredOrgs = orgs.filter(org => org !== null);
      
      res.json(filteredOrgs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update user role (admin only)
  app.patch("/api/users/:userId/role", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      // Validate role
      if (!userRoles.includes(role)) {
        return res.status(400).json({ message: "Ongeldige rol" });
      }
      
      // Get the target user
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Check permissions - only admins can change roles
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Onvoldoende rechten om rollen te wijzigen" });
      }
      
      // Users can only update members of their own organization
      if (req.user!.organizationId !== targetUser.organizationId) {
        return res.status(403).json({ message: "Je kunt alleen rollen wijzigen binnen je eigen organisatie" });
      }
      
      // Prevent users from changing their own role
      if (req.user!.id === userId) {
        return res.status(403).json({ message: "Je kunt je eigen rol niet wijzigen" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Development routes for admin tools
  app.post("/api/dev/make-admin", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Gebruikersnaam is vereist" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Update user role to admin
      const updatedUser = await storage.updateUserRole(user.id, "admin");
      
      res.json({ 
        message: `${username} heeft nu admin rechten`,
        user: updatedUser
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Customer API
  // Get all customers for the current user's organization
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      if (!req.user!.organizationId) {
        return res.status(400).json({ message: "U bent geen lid van een organisatie" });
      }
      
      const customers = await storage.getCustomersByOrganizationId(req.user!.organizationId);
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get searches for a customer
  app.get("/api/customers/:id/searches", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomerById(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Klant niet gevonden" });
      }
      
      // Check if user belongs to the same organization as the customer
      if (req.user!.organizationId !== customer.organizationId) {
        return res.status(403).json({ message: "Geen toegang tot deze klant" });
      }
      
      const searches = await storage.getSearchesByCustomerId(id);
      res.json(searches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get a customer by ID
  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomerById(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Klant niet gevonden" });
      }
      
      // Check if user belongs to the same organization as the customer
      if (req.user!.organizationId !== customer.organizationId) {
        return res.status(403).json({ message: "Geen toegang tot deze klant" });
      }
      
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create a new customer
  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      if (!req.user!.organizationId) {
        return res.status(400).json({ message: "U bent geen lid van een organisatie" });
      }
      
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(req.user!.organizationId, validatedData);
      
      res.status(201).json(customer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validatiefout", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a customer
  app.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomerById(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Klant niet gevonden" });
      }
      
      // Check if user belongs to the same organization as the customer
      if (req.user!.organizationId !== customer.organizationId) {
        return res.status(403).json({ message: "Geen toegang tot deze klant" });
      }
      
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const updatedCustomer = await storage.updateCustomer(id, validatedData);
      
      res.json(updatedCustomer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validatiefout", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a customer
  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomerById(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Klant niet gevonden" });
      }
      
      // Check if user belongs to the same organization as the customer
      if (req.user!.organizationId !== customer.organizationId) {
        return res.status(403).json({ message: "Geen toegang tot deze klant" });
      }
      
      // Only allow admins to delete customers
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Alleen beheerders kunnen klanten verwijderen" });
      }
      
      await storage.deleteCustomer(id);
      res.json({ message: "Klant verwijderd" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
