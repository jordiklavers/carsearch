import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log(`Attempting login for user: ${username}`);
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`User not found: ${username}`);
        return done(null, false, { message: "Incorrect username or password" });
      }
      
      const isValid = await comparePasswords(password, user.password);
      console.log(`Password validation for ${username}: ${isValid ? "success" : "failed"}`);
      
      if (!isValid) {
        return done(null, false, { message: "Incorrect username or password" });
      }
      
      return done(null, user);
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err: any) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // DEV ONLY: Endpoint to set admin permissions for development
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/dev/make-admin", async (req, res) => {
      try {
        const { username } = req.body;
        if (!username) {
          return res.status(400).json({ message: "Username is required" });
        }
        
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // If user is not part of an organization, create one and assign them
        if (!user.organizationId) {
          const org = await storage.createOrganization({
            name: `${username}'s Organization`,
            pdfPrimaryColor: "#4a6da7",
            pdfSecondaryColor: "#333333",
            pdfCompanyName: "Dev Organization",
            pdfContactInfo: "Development Contact Info"
          });
          
          await storage.assignUserToOrganization(user.id, org.id);
        }
        
        // Make user an admin
        const updatedUser = await storage.updateUserRole(user.id, "admin");
        
        res.json({ 
          message: "User has been made an admin", 
          user: updatedUser
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });
  }
}
