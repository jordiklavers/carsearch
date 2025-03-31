import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertSearchSchema, searchStatuses } from "@shared/schema";
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
      const searches = await storage.getSearchesByUserId(req.user!.id);
      res.json(searches);
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
      const search = await storage.createSearch({
        ...validatedData,
        userId: req.user!.id,
        images: []
      });
      
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
      const updatedSearch = await storage.updateSearch(id, {
        ...validatedData,
        userId: req.user!.id
      });
      
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

  const httpServer = createServer(app);
  return httpServer;
}
