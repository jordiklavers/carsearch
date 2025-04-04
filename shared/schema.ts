import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organization roles
export const userRoles = ["admin", "member"] as const;

// Organization schema
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  address: text("address"),
  city: text("city"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // PDF Styling
  pdfPrimaryColor: text("pdf_primary_color").default("#4a6da7"),
  pdfSecondaryColor: text("pdf_secondary_color").default("#333333"),
  pdfCompanyName: text("pdf_company_name").default("CarSearch Pro"),
  pdfContactInfo: text("pdf_contact_info").default("Tel: 020-123456 | info@carsearchpro.nl | www.carsearchpro.nl"),
  pdfHeaderFont: text("pdf_header_font").default("Helvetica-Bold"),
  pdfBodyFont: text("pdf_body_font").default("Helvetica"),
});

export const insertOrganizationSchema = createInsertSchema(organizations)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    logo: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional().or(z.literal('')),
    pdfPrimaryColor: z.string().optional(),
    pdfSecondaryColor: z.string().optional(),
    pdfCompanyName: z.string().optional(),
    pdfContactInfo: z.string().optional(),
    pdfHeaderFont: z.string().optional(),
    pdfBodyFont: z.string().optional(),
  });

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  profilePicture: text("profile_picture"),
  organizationId: integer("organization_id"),
  role: text("role", { enum: userRoles }).default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
});

export const updateUserProfileSchema = createInsertSchema(users)
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    profilePicture: true,
  })
  .extend({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    profilePicture: z.string().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type User = typeof users.$inferSelect;

// Car data constants
export const carMakes = [
  "Audi", 
  "BMW", 
  "Mercedes-Benz", 
  "Volkswagen", 
  "Volvo", 
  "Toyota", 
  "Honda", 
  "Ford", 
  "Opel", 
  "Peugeot"
];

export const carTypes = [
  "Sedan", 
  "SUV", 
  "Hatchback", 
  "Station", 
  "Coupé", 
  "Cabriolet", 
  "MPV", 
  "Terreinwagen"
];

export const carColors = [
  "Zwart", 
  "Wit", 
  "Zilver", 
  "Grijs", 
  "Blauw", 
  "Rood", 
  "Groen", 
  "Bruin", 
  "Geel", 
  "Oranje"
];

export const transmissionTypes = [
  "Handgeschakeld",
  "Automatisch"
];

export const fuelTypes = [
  "Benzine",
  "Diesel",
  "Elektrisch",
  "Hybride",
  "Plug-in Hybride",
  "LPG"
];

export const searchStatuses = [
  "active",
  "completed"
] as const;

// Car search schema
export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  customerFirstName: text("customer_first_name").notNull(),
  customerLastName: text("customer_last_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  carMake: text("car_make").notNull(),
  carModel: text("car_model").notNull(),
  carType: text("car_type").notNull(),
  carYear: text("car_year").notNull(),
  carColor: text("car_color").notNull(),
  carTransmission: text("car_transmission").notNull(),
  carFuel: text("car_fuel").notNull(),
  minPrice: integer("min_price").notNull(),
  maxPrice: integer("max_price").notNull(),
  additionalRequirements: text("additional_requirements"),
  images: json("images").$type<string[]>(),
  status: text("status", { enum: searchStatuses }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSearchSchema = createInsertSchema(searches)
  .omit({ id: true, userId: true, createdAt: true, updatedAt: true, images: true })
  .extend({
    additionalRequirements: z.string().optional(),
  });

export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;

// Customer schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  zipCode: text("zipCode"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers)
  .omit({ id: true, organizationId: true, createdAt: true, updatedAt: true })
  .extend({
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    notes: z.string().optional(),
  });

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
