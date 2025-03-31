import { Search } from "@shared/schema";
import { format } from "date-fns";

export async function generatePDF(search: Search): Promise<void> {
  try {
    const response = await fetch(`/api/searches/${search.id}/pdf`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = `zoekopdracht_${search.id}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    
    // Append to the document
    document.body.appendChild(a);
    
    // Trigger a click on the element
    a.click();
    
    // Remove the element
    document.body.removeChild(a);
    
    // Release the URL
    URL.revokeObjectURL(url);
    
    return;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
