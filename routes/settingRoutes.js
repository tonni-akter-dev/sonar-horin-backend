import express from "express";
import Setting from "../models/Setting.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    
    if (!settings) {
      // 💡 ডিফল্ট ডাটা তৈরি (এখানে methods যেন স্ট্রিং না হয়ে সরাসরি অ্যারে হয়)
      settings = await Setting.create({
        smsFee: 15,
        tiers: [100, 180, 250, 310, 360],
        extraPer: 50,
        helpline: '01700000000',
        methods: [
          { id: 'bkash', name: 'বিকাশ', number: '01700-000000', type: 'পার্সোনাল', active: true },
          { id: 'nagad', name: 'নগদ', number: '01700-000000', type: 'পার্সোনাল', active: true },
          { id: 'rocket', name: 'রকেট', number: '01700-0000000', type: 'পার্সোনাল', active: false },
        ]
      });
    }
    res.json(settings);
  } catch (error) {
    console.error(error); // 💡 এরর দেখার জন্য কনসোল লগ
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/v1/settings
// @desc    সেটিংস আপডেট করা (Admin Only)
router.put('/', protect, async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (settings) {
      // আপডেট করা
      settings.smsFee = req.body.smsFee ?? settings.smsFee;
      settings.tiers = req.body.tiers ?? settings.tiers;
      settings.extraPer = req.body.extraPer ?? settings.extraPer;
      settings.helpline = req.body.helpline ?? settings.helpline;
      settings.methods = req.body.methods ?? settings.methods;

      const updatedSettings = await settings.save();
      res.json(updatedSettings);
    } else {
      // নতুন তৈরি করা
      const newSettings = await Setting.create(req.body);
      res.status(201).json(newSettings);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;