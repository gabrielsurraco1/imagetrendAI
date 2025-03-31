import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Replace with your actual n8n Webhook URL
const N8N_WEBHOOK_URL = "https://YOUR-N8N-INSTANCE/webhook/image-upload";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    const style = fields.style as string;
    const image = files.image as formidable.File;

    try {
      const formData = new FormData();
      formData.append('style', style);
      formData.append('image', fs.createReadStream(image.filepath), {
        filename: image.originalFilename || 'upload.jpg',
        contentType: image.mimetype || 'image/jpeg',
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
