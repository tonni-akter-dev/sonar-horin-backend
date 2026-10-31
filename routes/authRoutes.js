import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// @route   POST /api/v1/auth/register
// routes/authRoutes.js
router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ msg: "সব ঘর পূরণ করুন" });
  }

  try {
    let user = await User.findOne({ email });
    if (user)
      return res.status(400).json({ msg: "এই ইমেইল দিয়ে অ্যাকাউন্ট আছে" });

    user = new User({ name, email, phone, password: password, role: "user" });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "সার্ভার এরর" });
  }
});

// @route   POST /api/v1/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "ইমেইল এবং পাসওয়ার্ড দিন" });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "ভুল ইমেইল বা পাসওয়ার্ড" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "ভুল ইমেইল বা পাসওয়ার্ড" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "সার্ভার এরর" });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "ইউজার পাওয়া যায়নি" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "সার্ভার এরর" });
  }
});

router.put("/me", protect, upload.array("files", 10), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.fatherName = req.body.fatherName || user.fatherName;
      user.motherName = req.body.motherName || user.motherName;
      user.dob = req.body.dob || user.dob;
      user.nid = req.body.nid || user.nid;
      user.address = req.body.address || user.address;
      user.education = req.body.education || user.education;

      // ২. ফ্রন্টএন্ড থেকে আসা educationDetails (JSON স্ট্রিং) পার্স করা
      if (req.body.educationDetails) {
        try {
          user.educationDetails = JSON.parse(req.body.educationDetails);
        } catch (error) {
          user.educationDetails = req.body.educationDetails;
        }
      }

      // ৩. নতুন আপলোড করা ফাইলগুলো এডুকেশন ডিটেইলসের সাথে যুক্ত করা
      if (req.files && req.files.length > 0) {
        const uploadedUrls = req.files.map((file) => file.path);

        let targetIndex =
          req.body.editingIndex !== undefined &&
          req.body.editingIndex !== "null"
            ? Number(req.body.editingIndex)
            : user.educationDetails.length - 1;

        if (user.educationDetails[targetIndex]) {
          const existingUrls =
            user.educationDetails[targetIndex].certificateUrls || [];
          user.educationDetails[targetIndex].certificateUrls = [
            ...existingUrls,
            ...uploadedUrls,
          ];
        }
      }
      user.markModified("educationDetails");
      const updatedUser = await user.save();

      // ৫. সম্পূর্ণ আপডেট হওয়া ডাটা রিটার্ন করা
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        fatherName: updatedUser.fatherName,
        motherName: updatedUser.motherName,
        dob: updatedUser.dob,
        nid: updatedUser.nid,
        address: updatedUser.address,
        education: updatedUser.education,
        educationDetails: updatedUser.educationDetails, // 💡 এখানে সার্টিফিকেট URL সহ আসবে
        profileImage: updatedUser.profileImage,
        signature: updatedUser.signature,
        certificate: updatedUser.certificate,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      });
    } else {
      res.status(404).json({ msg: "ইউজার পাওয়া যায়নি" });
    }
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ msg: "সার্ভার এরর" });
  }
});

export default router;
