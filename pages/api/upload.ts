import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import type { File } from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

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
  
    const filepath = (image as ExtendedFile).filepath;
  
    if (!filepath) {
      return res.status(500).json({ error: "Uploaded file has no filepath" });
    }
  
    try {
      const formData = new FormData();
      formData.append('style', style);
      formData.append('image', fs.createReadStream(filepath), {
        filename: (image as ExtendedFile).originalFilename || 'upload.jpg',
        contentType: (image as ExtendedFile).mimetype || 'image/jpeg',
      });
  
      const n8nRes = await axios.post('https://gabrielsurraco13.app.n8n.cloud/webhook/f07c5f74-2a8f-45a3-b936-0fc25700916b', formData, {
        headers: formData.getHeaders(),
      });
  
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Failed to forward to n8n:", err);
      return res.status(500).json({ error: "Upload failed while sending to n8n" });
    }
  });
  
}
