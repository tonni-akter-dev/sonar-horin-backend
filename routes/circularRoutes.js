import express from 'express';
import Circular from '../models/circular.js';
import uploadPdf from '../middleware/uploadPdf.js';
import mongoose from 'mongoose'; 

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, cat, sort } = req.query;
    let query = {};

    // সার্চ লজিক (নাম বা প্রতিষ্ঠান দিয়ে)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { org: { $regex: search, $options: 'i' } },
        { orgEn: { $regex: search, $options: 'i' } },
      ];
    }

    // ক্যাটাগরি ফিল্টার
    if (cat && cat !== 'all') {
      query.cat = cat;
    }

    // সর্টিং লজিক
    let sortOption = { end: 1 }; // ডিফল্ট: শেষ তারিখ আগে
    if (sort === 'new') sortOption = { createdAt: -1 };
    if (sort === 'posts') sortOption = { total: -1 };

    const circulars = await Circular.find(query).sort(sortOption);
    res.json(circulars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let circular;
    if (mongoose.Types.ObjectId.isValid(id)) {
      circular = await Circular.findById(id);
    } 
    
    if (!circular) {
      circular = await Circular.findOne({ id: id });
    }

    if (!circular) {
      return res.status(404).json({ error: 'সার্কুলার পাওয়া যায়নি' });
    }
    
    res.json(circular);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/', 
  uploadPdf.single('pdf'),
  async (req, res) => {
    try {
      const circularData = req.body.data ? JSON.parse(req.body.data) : req.body;
      const generatedId = circularData.orgEn.toLowerCase().replace(/\s+/g, '') + '-' + Date.now().toString().slice(-4);
      const pdfUrl = req.file ? req.file.path : '';
      const newCircular = new Circular({
        ...circularData,
        id: circularData.id || generatedId,
        pdfUrl: pdfUrl,
      });
      
      await newCircular.save();
      res.status(201).json(newCircular);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

// @route   PUT /api/v1/circulars/:id

router.put(
  '/:id', 
  uploadPdf.single('pdf'), 
  async (req, res) => {
    try {
      const circularData = req.body.data ? JSON.parse(req.body.data) : req.body;
      
      if (req.file) {
        circularData.pdfUrl = req.file.path;
      }

      const updatedCircular = await Circular.findOneAndUpdate(
        { id: req.params.id },
        { $set: circularData },
        { new: true }
      );
      
      if (!updatedCircular) return res.status(404).json({ error: 'সার্কুলার পাওয়া যায়নি' });
      res.json(updatedCircular);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);


router.delete('/:id',  async (req, res) => {
  try {
    const deletedCircular = await Circular.findOneAndDelete({ id: req.params.id });
    if (!deletedCircular) return res.status(404).json({ error: 'সার্কুলার পাওয়া যায়নি' });
    res.json({ msg: 'সার্কুলার সফলভাবে ডিলিট হয়েছে' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;