import express from 'express';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ফাইল পাওয়া যায়নি' });
    }
    res.status(200).json({ url: req.file.path }); // শুধু লিংক রিটার্ন করবে
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;