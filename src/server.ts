import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import { validateYamlContent } from './utils/yamlValidator';

const app = express();
const PORT = 3000;

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for cross-origin requests
app.use(cors());

// POST endpoint to receive a YAML file
app.post('/validate', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    const yamlContent = req.file.buffer.toString('utf-8');

    try {
        const result = await validateYamlContent(yamlContent);
        if (result.valid){
            res.json({ message: '✅ YAML is valid!' });
        }else{
            res.status(400).json({ error: '❌ Invalid YAML', details: result.errors });
        }
        
    } catch (error) {
        res.status(500).json({ error: '❌ Invalid YAML', details: error });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
