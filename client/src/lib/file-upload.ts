/**
 * Upload multiple image files for a search
 * @param files Files to upload
 * @param searchId ID of the search to attach images to
 * @returns Array of image IDs
 */
export async function uploadImages(files: File[], searchId: number): Promise<string[]> {
  const formData = new FormData();
  
  // Add all files to form data
  files.forEach((file, index) => {
    formData.append('images', file);
  });
  
  try {
    const response = await fetch(`/api/searches/${searchId}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.imageIds;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
}
