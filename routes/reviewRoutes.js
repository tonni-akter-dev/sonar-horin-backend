import express from "express";
import mongoose from "mongoose";
import Review from "../models/review.js";
import Application from "../models/application.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// ============================================================
// @route   GET /api/v1/reviews/public
// @desc    হোমপেজের জন্য অনুমোদিত রিভিউ (লগইন লাগবে না)
// ============================================================
router.get("/public", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const reviews = await Review.find({ status: "approved" })
      .select("name role image rating text createdAt")
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// @route   GET /api/v1/reviews/my
// @desc    লগইন করা ইউজারের নিজের রিভিউগুলো
// ============================================================
router.get("/my", protect, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// @route   POST /api/v1/reviews
// @desc    রিভিউ দেওয়া — শুধু নিজের "completed" আবেদনে, একবারই
// @body    { applicationId (Mongo _id বা SH-XXXX), rating (1-5), text }
// ============================================================
router.post("/", protect, async (req, res) => {
  try {
    const { applicationId, rating, text } = req.body;

    const r = Number(rating);
    if (!applicationId) return res.status(400).json({ error: "আবেদন নির্বাচন করুন" });
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: "১ থেকে ৫ এর মধ্যে রেটিং দিন" });
    }
    const cleanText = String(text || "").trim();
    if (cleanText.length < 10) {
      return res.status(400).json({ error: "রিভিউ কমপক্ষে ১০ অক্ষরের হতে হবে" });
    }
    if (cleanText.length > 500) {
      return res.status(400).json({ error: "রিভিউ সর্বোচ্চ ৫০০ অক্ষরের হতে পারবে" });
    }

    // আবেদন খোঁজা (_id বা applicationId দিয়ে)
    const app = mongoose.Types.ObjectId.isValid(applicationId)
      ? await Application.findById(applicationId)
      : await Application.findOne({ applicationId });

    if (!app) return res.status(404).json({ error: "আবেদন পাওয়া যায়নি" });
    if (String(app.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: "এটি আপনার আবেদন নয়" });
    }
    if (app.status !== "completed") {
      return res.status(400).json({ error: "আবেদন সম্পন্ন হওয়ার পর রিভিউ দেওয়া যাবে" });
    }

    const exists = await Review.findOne({ application: app._id });
    if (exists) return res.status(400).json({ error: "এই আবেদনে আপনি আগেই রিভিউ দিয়েছেন" });

    const review = await Review.create({
      userId: req.user._id,
      application: app._id,
      applicationId: app.applicationId,
      name: req.user.name,
      role: (app.posts || []).map((p) => p.name).filter(Boolean).join(", "),
      image: req.user.profileImage || "",
      rating: r,
      text: cleanText,
    });

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "এই আবেদনে আপনি আগেই রিভিউ দিয়েছেন" });
    }
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// অ্যাডমিন: সব রিভিউ দেখা / অনুমোদন / লুকানো / মোছা
// ============================================================

// @route   GET /api/v1/reviews/admin?status=pending
router.get("/admin", protect, admin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status && status !== "all" ? { status } : {};
    const reviews = await Review.find(query).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/v1/reviews/admin/:id   body: { status: "approved" | "hidden" | "pending" }
router.patch("/admin/:id", protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "hidden"].includes(status)) {
      return res.status(400).json({ error: "ভুল স্ট্যাটাস" });
    }
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!review) return res.status(404).json({ error: "রিভিউ পাওয়া যায়নি" });
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/reviews/admin/:id
router.delete("/admin/:id", protect, admin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: "রিভিউ পাওয়া যায়নি" });
    res.json({ msg: "রিভিউ মুছে ফেলা হয়েছে" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
