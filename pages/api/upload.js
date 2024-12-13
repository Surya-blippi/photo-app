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

    // Ensure proper base64 format
    const base64Data = base64Image.split(';base64,').pop();
    if (!base64Data) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // Generate a clean filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `upload_${timestamp}_${randomString}.jpg`;

    // Convert to buffer
    const buffer = Buffer.from(base64Data, 'base64');

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

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('selfies')
      .getPublicUrl(filename);

    // Ensure URL is properly formatted
    const finalUrl = new URL(publicUrl).toString();

    return res.status(200).json({ imageUrl: finalUrl });

  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ error: 'Internal server error during upload' });
  }
}