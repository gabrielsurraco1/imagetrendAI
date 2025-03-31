import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { IncomingForm } from 'formidable';
import type { File } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ExtendedFile extends File {
  filepath: string;
  mimetype?: string;
  originalFilename?: string;
}

// Replace with your actual n8n Webhook URL
const N8N_WEBHOOK_URL = "https://YOUR-N8N-INSTANCE/webhook/image-upload";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err: any, fields: { [key: string]: string }, files: { [key: string]: File }) => {


    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    const style = fields.style as string;
    const image = files.image as File;


    try {
      const formData = new FormData();
      const extendedImage = image as ExtendedFile;

      formData.append('style', style);
      formData.append('image', fs.createReadStream(extendedImage.filepath), {
        filename: extendedImage.originalFilename || 'upload.jpg',
        contentType: extendedImage.mimetype || 'image/jpeg',
      });

      const n8nRes = await axios.post(N8N_WEBHOOK_URL, formData, {
        headers: formData.getHeaders(),
      });

      return res.status(200).json({ success: true, n8nStatus: n8nRes.status });
    } catch (uploadError) {
      console.error("Error sending to n8n:", uploadError);
      return res.status(500).json({ error: "Failed to send image to n8n" });
    }
  });
}
