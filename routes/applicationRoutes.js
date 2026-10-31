import express from "express";
import Application from "../models/application.js";
import { protect, admin } from "../middleware/auth.js"; // 💡 admin মিডলওয়্যার ইমপোর্ট করুন
import Circular from "../models/circular.js"; 

const router = express.Router();

const generateAppId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const num = Math.floor(1000 + Math.random() * 9000);
  const char =
    chars[Math.floor(Math.random() * chars.length)] +
    chars[Math.floor(Math.random() * chars.length)];
  return `CS${num}-${char}`;
};

// ==========================================
// 💡 PUBLIC & USER ROUTES
// ==========================================

// @route   POST /api/v1/applications
// @desc    নতুন আবেদন জমা দেওয়া
router.post("/", protect, async (req, res) => {
  try {
    const {
      circularId,
      name,
      phone,
      fatherName,
      motherName,
      dob,
      nid,
      address,
      education,
      posts,
      amount,
      paymentMethod,
      senderNumber,
      trxId,
      documents,
    } = req.body;

    const newApp = new Application({
      applicationId: generateAppId(),
      userId: req.user._id,
      circularId,
      name,
      phone,
      fatherName,
      motherName,
      dob: dob || null,
      nid,
      address,
      education,
      posts: posts || [],
      documents: {
        photo: documents?.photo || "",
        signature: documents?.signature || "",
        nidPhoto: documents?.nidPhoto || [],
        ssc: documents?.ssc || [],
        hsc: documents?.hsc || [],
        graduation: documents?.graduation || [],
        masters: documents?.masters || [],
        diploma: documents?.diploma || [],
      },
      amount: Number(amount),
      paymentMethod,
      senderNumber,
      trxId,
      paymentStatus: "pending",
      timeline: [
        {
          title: "আবেদন জমা দেওয়া হয়েছে",
          date: new Date().toLocaleString("bn-BD"),
          status: "done",
          desc: "আপনার আবেদনটি সফলভাবে জমা হয়েছে।",
        },
        {
          title: "পেমেন্ট ও কাগজ যাচাই সম্পন্ন",
          date: "অপেক্ষমাণ",
          status: "current",
          desc: "আমাদের টিম আপনার তথ্য যাচাই করছে।",
        },
        {
          title: "টেলিটকে আবেদন পূরণ হচ্ছে",
          date: "অপেক্ষমাণ",
          status: "pending",
          desc: "",
        },
        {
          title: "আপনার রিভিউর অপেক্ষায়",
          date: "অপেক্ষমাণ",
          status: "pending",
          desc: "",
        },
        {
          title: "চূড়ান্ত জমা ও সম্পন্ন",
          date: "অপেক্ষমাণ",
          status: "pending",
          desc: "",
        },
      ],
    });

    await newApp.save();
    res.status(201).json(newApp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/applications/my
// @desc    লগইন করা ইউজারের সব আবেদন
router.get("/my", protect, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/v1/applications/track
// @desc    আইডি বা মোবাইল নম্বর দিয়ে ট্র্যাক করা
router.get("/track", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "আইডি বা নম্বর দিন" });

    const applications = await Application.find({
      $or: [{ applicationId: query }, { phone: query }],
    }).sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 💡 ADMIN ROUTES (Admin Only)
// ==========================================

// @desc    অ্যাডমিনের জন্য সব আবেদন দেখা (সার্চ ও ফিল্টার সহ)
// @route   GET /api/v1/applications/admin/all
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const { search, status, circularId } = req.query;
    let queryObj = {};

    if (status && status !== 'all') {
      queryObj.status = status;
    }

    // 💡 এখানে আইডি ম্যাচিং ফিক্স করা হলো
    if (circularId) {
      // প্রথমে চেক করবো এটি কাস্টম আইডি (wtmu-9390) কি না
      const circular = await Circular.findOne({ id: circularId });
      
      if (circular) {
        // যদি কাস্টম আইডি পাওয়া যায়, তবে ওই সার্কুলারের _id এবং id দুটো দিয়েই খুঁজবো
        queryObj.circularId = { $in: [circularId, circular._id.toString()] };
      } else {
        // যদি না পাওয়া যায়, তবে সরাসরি যে আইডি পাঠানো হয়েছে সেটাই খুঁজবো
        queryObj.circularId = circularId;
      }
    }

    if (search) {
      queryObj.$or = [
        { applicationId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const applications = await Application.find(queryObj).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/v1/applications/admin/:id
router.get("/admin/:id", protect, admin, async (req, res) => {
  try {
    const app = await Application.findOne({
      applicationId: req.params.id,
    }).populate("userId", "name email phone");

    if (!app) return res.status(404).json({ error: "আবেদন পাওয়া যায়নি" });
    res.json(app);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    অ্যাডমিন কর্তৃক আবেদন আপডেট করা (স্ট্যাটাস, টাইমলাইন, টেলিটক ইনফো)
router.put("/admin/:id", protect, admin, async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      timeline,
      teletalkUser,
      teletalkPass,
      applicantCopyUrl,
    } = req.body;

    const app = await Application.findOne({ applicationId: req.params.id });
    if (!app) return res.status(404).json({ error: "আবেদন পাওয়া যায়নি" });

    // ফিল্ড আপডেট
    if (status) app.status = status;
    if (paymentStatus) app.paymentStatus = paymentStatus;
    if (timeline) app.timeline = timeline; // অ্যাডমিন টাইমলাইন আপডেট করতে পারবে
    if (teletalkUser) app.teletalkUser = teletalkUser;
    if (teletalkPass) app.teletalkPass = teletalkPass;
    if (applicantCopyUrl) app.applicantCopyUrl = applicantCopyUrl;

    const updatedApp = await app.save();
    res.json(updatedApp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 💡 PUBLIC TRACK DETAILS (Must be at the bottom)
// ==========================================

// @route   GET /api/v1/applications/:id
// @desc    নির্দিষ্ট আবেদন দেখা (পাবলিক ট্র্যাকিং এর জন্য)
router.get("/:id", async (req, res) => {
  try {
    const app = await Application.findOne({ applicationId: req.params.id });
    if (!app) return res.status(404).json({ error: "আবেদন পাওয়া যায়নি" });
    res.json(app);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
