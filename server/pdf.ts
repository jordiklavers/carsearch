import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { Search, Organization } from "@shared/schema";
import { format } from "date-fns";
import { storage } from "./storage";

export async function createPDF(search: Search): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Get organization settings if the user is part of an organization
      let organization: Organization | undefined;
      const user = await storage.getUser(search.userId);
      
      if (user && user.organizationId) {
        organization = await storage.getOrganizationById(user.organizationId);
      }
      
      // Create a document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Zoekopdracht ${search.id}`,
          Author: organization?.pdfCompanyName || "CarSearch Pro",
        },
      });

      // Buffer to store PDF
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add metadata
      doc.info.CreationDate = new Date();

      // Styling variables - Use organization settings if available
      const primaryColor = organization?.pdfPrimaryColor || "#4a6da7";
      const textColor = organization?.pdfSecondaryColor || "#333333";
      const lightGray = "#f3f4f6";
      const mediumGray = "#e5e7eb";
      const darkGray = "#9ca3af";
      const companyName = organization?.pdfCompanyName || "CarSearch Pro";
      const contactInfo = organization?.pdfContactInfo || "Tel: 020-123456 | info@carsearchpro.nl | www.carsearchpro.nl";

      // Company Logo and Title
      doc.rect(50, 50, 495, 80)
        .fillAndStroke(lightGray, lightGray);
      
      doc.fillColor(primaryColor)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(companyName, 180, 65);
      
      doc.fillColor(textColor)
        .fontSize(14)
        .font('Helvetica')
        .text("Zoekopdracht Rapport", 180, 95);
      
      doc.fillColor(darkGray)
        .fontSize(10)
        .text(`Datum: ${format(new Date(search.createdAt), "dd MMMM yyyy")}`, 380, 95);

      // Helper function to draw logo placeholder - defined outside of the if blocks
      const drawLogoPlaceholder = () => {
        doc.rect(60, 60, 100, 60)
          .fillAndStroke(primaryColor, primaryColor);
        
        doc.fillColor("white")
          .fontSize(16)
          .font('Helvetica-Bold')
          .text("LOGO", 90, 80);
      };
      
      // Add logo if organization has one, otherwise placeholder
      if (organization?.logo) {
        const logoPath = path.join(process.cwd(), "uploads", organization.logo);
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 60, 60, { 
              width: 100,
              height: 60,
              fit: [100, 60],
              align: 'center',
              valign: 'center',
            });
          } catch (error) {
            console.error(`Error loading logo ${logoPath}:`, error);
            // Use a placeholder if the logo can't be loaded
            drawLogoPlaceholder();
          }
        } else {
          drawLogoPlaceholder();
        }
      } else {
        drawLogoPlaceholder();
      }

      // Customer Information Section
      doc.moveDown(2);
      doc.fillColor(primaryColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text("Klantgegevens", 50, 160);
      
      doc.moveTo(50, 180)
        .lineTo(545, 180)
        .stroke(mediumGray);

      doc.fillColor(textColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text("Naam:", 50, 190)
        .font('Helvetica')
        .text(`${search.customerFirstName} ${search.customerLastName}`, 150, 190);
      
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text("Email:", 50, 210)
        .font('Helvetica')
        .text(search.customerEmail, 150, 210);
      
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text("Telefoon:", 50, 230)
        .font('Helvetica')
        .text(search.customerPhone, 150, 230);

      // Car Details Section
      doc.moveDown(3);
      doc.fillColor(primaryColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text("Auto Specificaties", 50, 270);
      
      doc.moveTo(50, 290)
        .lineTo(545, 290)
        .stroke(mediumGray);

      // Create a two-column layout for car details
      const col1X = 50;
      const col2X = 300;
      let y = 300;

      // Column 1
      doc.fillColor(textColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text("Merk & Model:", col1X, y)
        .font('Helvetica')
        .text(`${search.carMake} ${search.carModel}`, col1X + 100, y);
      
      y += 20;
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text("Type:", col1X, y)
        .font('Helvetica')
        .text(search.carType, col1X + 100, y);
      
      y += 20;
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text("Bouwjaar:", col1X, y)
        .font('Helvetica')
        .text(search.carYear, col1X + 100, y);

      // Column 2
      y = 300;
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text("Kleur:", col2X, y)
        .font('Helvetica')
        .text(search.carColor, col2X + 100, y);
      
      y += 20;
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text("Transmissie:", col2X, y)
        .font('Helvetica')
        .text(search.carTransmission, col2X + 100, y);
      
      y += 20;
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text("Brandstof:", col2X, y)
        .font('Helvetica')
        .text(search.carFuel, col2X + 100, y);

      // Price Range
      y += 40;
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text("Prijsrange:", col1X, y)
        .font('Helvetica')
        .text(`€${search.minPrice.toLocaleString()} - €${search.maxPrice.toLocaleString()}`, col1X + 100, y);

      // Additional Requirements Section
      if (search.additionalRequirements) {
        y += 40;
        doc.fillColor(primaryColor)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text("Aanvullende eisen", 50, y);
        
        y += 20;
        doc.moveTo(50, y)
          .lineTo(545, y)
          .stroke(mediumGray);
        
        y += 10;
        doc.fillColor(textColor)
          .fontSize(11)
          .font('Helvetica')
          .text(search.additionalRequirements, 50, y, { width: 495, align: 'left' });
      }

      // Images Section (if there are any images)
      if (search.images && search.images.length > 0) {
        y += 60;
        
        // Make sure we have enough space on the page
        if (y > 650) {
          doc.addPage();
          y = 50;
        }
        
        doc.fillColor(primaryColor)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text("Auto Afbeeldingen", 50, y);
        
        y += 20;
        doc.moveTo(50, y)
          .lineTo(545, y)
          .stroke(mediumGray);
        
        y += 20;

        // Process images
        const uploadDir = path.join(process.cwd(), "uploads");
        const imgWidth = 230;
        const imgHeight = 160;
        const margin = 15;
        
        let col = 0;
        let startY = y;
        
        for (let i = 0; i < Math.min(search.images.length, 4); i++) {
          const imgPath = path.join(uploadDir, search.images[i]);
          
          // Check if image exists
          if (fs.existsSync(imgPath)) {
            const x = col === 0 ? 50 : 50 + imgWidth + margin;
            
            // Add image to PDF
            try {
              doc.image(imgPath, x, startY, { 
                width: imgWidth,
                height: imgHeight,
                fit: [imgWidth, imgHeight],
                align: 'center',
                valign: 'center',
              });
            } catch (error) {
              console.error(`Error adding image ${imgPath}:`, error);
              // Draw a placeholder if the image can't be loaded
              doc.rect(x, startY, imgWidth, imgHeight)
                .fillAndStroke(lightGray, mediumGray);
              doc.fillColor(darkGray)
                .fontSize(12)
                .text("Afbeelding niet beschikbaar", x + 50, startY + imgHeight/2 - 6);
            }
            
            // Switch to next column or row
            if (col === 0) {
              col = 1;
            } else {
              col = 0;
              startY += imgHeight + margin;
              
              // Check if we need a new page
              if (i < search.images.length - 2 && startY + imgHeight > 750) {
                doc.addPage();
                startY = 50;
              }
            }
          }
        }
        
        // Update Y position
        y = startY + imgHeight + 20;
      }

      // Footer
      doc.fontSize(9)
        .fillColor(darkGray)
        .text(`${companyName} - Uw specialist in auto zoekopdrachten`, 50, 750, { align: 'center' })
        .fontSize(8)
        .text(contactInfo, 50, 765, { align: 'center' });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}