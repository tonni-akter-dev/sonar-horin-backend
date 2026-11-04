import express from "express";
import Setting from "../models/Setting.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/v1/settings
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({
        smsFee: 15,
        tiers: [100, 180, 250, 310, 360],
        extraPer: 50,
        helpline: '01700000000',
        govtFees: [
          { amount: 56, label: '২০তম গ্রেড' },
          { amount: 112, label: '১৩–১৯তম গ্রেড' },
          { amount: 168, label: '১০–১২তম গ্রেড' },
          { amount: 223, label: '৯ম গ্রেড ও উপরে' },
        ],
        methods: [
          { id: 'bkash', name: 'বিকাশ', number: '01700-000000', type: 'পার্সোনাল', active: true },
          { id: 'nagad', name: 'নগদ', number: '01700-000000', type: 'পার্সোনাল', active: true },
          { id: 'rocket', name: 'রকেট', number: '01700-0000000', type: 'পার্সোনাল', active: false },
        ]
      });
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/v1/settings
// @desc    সেটিংস আপডেট করা (Admin Only)
router.put('/', protect, admin, async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (settings) {
      settings.smsFee = req.body.smsFee ?? settings.smsFee;
      settings.tiers = req.body.tiers ?? settings.tiers;
      settings.extraPer = req.body.extraPer ?? settings.extraPer;
      settings.helpline = req.body.helpline ?? settings.helpline;
      settings.methods = req.body.methods ?? settings.methods;

      // 💡 সরকারি ফি অপশন (খালি/ভুল মান বাদ দিয়ে, কম থেকে বেশি সাজিয়ে)
      if (Array.isArray(req.body.govtFees)) {
        settings.govtFees = req.body.govtFees
          .map((f) => ({ amount: Number(f.amount), label: String(f.label || '').trim() }))
          .filter((f) => f.amount > 0)
          .sort((a, b) => a.amount - b.amount);
      }

      const updatedSettings = await settings.save();
      res.json(updatedSettings);
    } else {
      const newSettings = await Setting.create(req.body);
      res.status(201).json(newSettings);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;