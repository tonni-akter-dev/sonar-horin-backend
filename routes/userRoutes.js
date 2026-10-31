import express from "express";
import User from "../models/user.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/v1/users/wishlist
// @desc    ইউজারের সেভ করা সব জব দেখা
router.get("/wishlist", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist.circularId");
    res.json(user.wishlist || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/users/wishlist
// @desc    নির্দিষ্ট জব (পদ) উইশলিস্টে যোগ করা
router.post("/wishlist", protect, async (req, res) => {
  try {
    const { circularId, postName } = req.body;
    const user = await User.findById(req.user._id);

    // 💡 চেক করা হচ্ছে আগে থেকেই সেভ করা আছে কি না
    const exists = user.wishlist.find(
      (item) => item.circularId.toString() === circularId && item.postName === postName
    );

    if (!exists) {
      user.wishlist.push({ circularId, postName });
      await user.save();
    }

    res.json({ message: "Wishlist updated", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/users/wishlist
// @desc    উইশলিস্ট থেকে নির্দিষ্ট জব রিমুভ করা
router.delete("/wishlist", protect, async (req, res) => {
  try {
    const { circularId, postName } = req.query; 
    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter(
      (item) => !(item.circularId.toString() === circularId && item.postName === postName)
    );
    await user.save();

    res.json({ message: "Removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;