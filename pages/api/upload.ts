import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import type { File } from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { v2 as cloudinary } from 'cloudinary';


interface ExtendedFile extends File {
  filepath: string;
  mimetype?: string;
  originalFilename?: string;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err: any, fields: { [key: string]: string | string[] }, files: { [key: string]: File | File[] }) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  
    const style = Array.isArray(fields.style) ? fields.style[0] : fields.style;
    const uploaded = files.image;
  
    if (!uploaded) {
      return res.status(400).json({ error: "No image uploaded" });
    }
  
    // Support multiple files, but only use the first one
    const image = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    const extendedImage = image as ExtendedFile;

    if (!extendedImage.filepath) {
      return res.status(500).json({ error: 'Uploaded file has no filepath' });
    }


    try {
      const result = await cloudinary.uploader.upload(extendedImage.filepath, {
        folder: 'trend-uploads',
        public_id: extendedImage.originalFilename?.split('.')[0],
        resource_type: 'image',
      });
    
      // Send to n8n webhook
      await axios.post('https://gabrielsurraco13.app.n8n.cloud/webhook/f07c5f74-2a8f-45a3-b936-0fc25700916b', {
        imageUrl: result.secure_url,
        style,
      });
    
      return res.status(200).json({
        success: true,
        imageUrl: result.secure_url,
        style,
      });
    } catch (uploadErr) {
      console.error('Cloudinary upload or webhook forward failed:', uploadErr);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  });
  
}
