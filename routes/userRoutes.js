import express from "express";
import mongoose from "mongoose";
import User from "../models/user.js";
import Application from "../models/application.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// search এর জন্য regex escape (regex injection ঠেকাতে)
const escapeRegex = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ============================================================
// 💡 ইউজারের নিজের উইশলিস্ট
// ============================================================

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

// ============================================================
// 💡 অ্যাডমিন: ইউজার ম্যানেজমেন্ট (সব route এ protect + admin)
// ============================================================

// @route   GET /api/v1/users/admin/stats
// @desc    ইউজার পরিসংখ্যান
router.get("/admin/stats", protect, admin, async (req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [total, admins, blocked, newThisMonth] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
    ]);
    res.json({ total, admins, blocked, newThisMonth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/v1/users/admin?search=&role=user|admin&status=active|blocked&page=1&limit=20
// @desc    সব ইউজারের তালিকা (pagination সহ)
router.get("/admin", protect, admin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const { search, role, status } = req.query;

    const query = {};
    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), "i");
      query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    if (role === "user" || role === "admin") query.role = role;
    if (status === "blocked") query.isBlocked = true;
    if (status === "active") query.isBlocked = { $ne: true };

    const [users, total] = await Promise.all([
      User.find(query)
        // তালিকায় শুধু দরকারি তথ্য — NID, জন্মতারিখ, ডকুমেন্ট এখানে যাবে না
        .select("name email phone role isBlocked profileImage createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // প্রতিটি ইউজারের আবেদন সংখ্যা
    const counts = await Application.aggregate([
      { $match: { userId: { $in: users.map((u) => u._id) } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    res.json({
      users: users.map((u) => ({ ...u, applicationCount: countMap[String(u._id)] || 0 })),
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      limit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/v1/users/admin/:id
// @desc    একজন ইউজারের বিস্তারিত + সাম্প্রতিক আবেদন
router.get("/admin/:id", protect, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ভুল ইউজার আইডি" });
    }
    const user = await User.findById(req.params.id).select("-password -wishlist").lean();
    if (!user) return res.status(404).json({ error: "ইউজার পাওয়া যায়নি" });

    const applications = await Application.find({ userId: user._id })
      .select("applicationId circularOrg posts.name status paymentStatus amount createdAt")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ user, applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/v1/users/admin/:id/role   body: { role: "user" | "admin" }
// @desc    ইউজারের role পরিবর্তন
router.patch("/admin/:id/role", protect, admin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "ভুল role" });
    }
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ error: "নিজের role নিজে পরিবর্তন করা যাবে না" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "ইউজার পাওয়া যায়নি" });

    // শেষ অ্যাডমিনকে সাধারণ ইউজার বানানো যাবে না
    if (user.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "কমপক্ষে একজন অ্যাডমিন থাকতে হবে" });
      }
    }

    user.role = role;
    await user.save();
    res.json({ _id: user._id, role: user.role, msg: "Role পরিবর্তন হয়েছে" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PATCH /api/v1/users/admin/:id/block   body: { blocked: true | false }
// @desc    ইউজার ব্লক / আনব্লক
router.patch("/admin/:id/block", protect, admin, async (req, res) => {
  try {
    const blocked = req.body.blocked === true;
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ error: "নিজেকে ব্লক করা যাবে না" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "ইউজার পাওয়া যায়নি" });
    if (blocked && user.role === "admin") {
      return res.status(400).json({ error: "অ্যাডমিনকে ব্লক করা যাবে না। আগে role পরিবর্তন করুন।" });
    }

    user.isBlocked = blocked;
    await user.save();
    res.json({
      _id: user._id,
      isBlocked: user.isBlocked,
      msg: blocked ? "ইউজার ব্লক করা হয়েছে" : "ইউজার আনব্লক করা হয়েছে",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
