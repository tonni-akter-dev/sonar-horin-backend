import express from 'express';
import Application from '../models/application.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/admin/applications
// @desc    সব আবেদন দেখা (ফিল্টার ও সার্চ সহ)
router.get('/applications', protect, admin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { applicationId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phone: search }
      ];
    }

    const apps = await Application.find(query).sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/applications/:id
// @desc    আবেদনের স্ট্যাটাস বা টাইমলাইন আপডেট করা
router.put('/applications/:id',protect, admin,  async (req, res) => {
  try {
    const { status, timeline, paymentStatus, teletalkUser, teletalkPass } = req.body;
    
    const updatedApp = await Application.findOneAndUpdate(
      { applicationId: req.params.id },
      { status, timeline, paymentStatus, teletalkUser, teletalkPass },
      { new: true }
    );
    
    if (!updatedApp) return res.status(404).json({ error: 'আবেদন পাওয়া যায়নি' });
    res.json(updatedApp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    ড্যাশবোর্ডের পরিসংখ্যান (KPI Cards)
router.get('/stats',  protect, admin, async (req, res) => {
  try {
    const total = await Application.countDocuments();
    const pending = await Application.countDocuments({ status: 'pending' });
    const processing = await Application.countDocuments({ status: 'processing' });
    const completed = await Application.countDocuments({ status: 'completed' });
    
    res.json({ total, pending, processing, completed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; // ✅ এটি অবশ্যই থাকতে হবে 