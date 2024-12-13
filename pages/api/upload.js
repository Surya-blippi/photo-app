// pages/api/upload.js
import { supabase } from '@/utils/supabaseClient';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Extract the base64 data
    const base64Data = base64Image.split(';base64,').pop();
    if (!base64Data) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // Convert to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const filename = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

    // Upload to Supabase
    const { data, error: uploadError } = await supabase.storage
      .from('selfies')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload to storage' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('selfies')
      .getPublicUrl(filename);

    return res.status(200).json({ imageUrl: publicUrl });

  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ error: 'Internal server error during upload' });
  }
}