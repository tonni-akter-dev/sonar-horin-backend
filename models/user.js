import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // 💡 নতুন প্রোফাইল ফিল্ডসমূহ
    fatherName: { type: String, default: "" },
    motherName: { type: String, default: "" },
    dob: { type: Date },
    nid: { type: String, default: "" },
    address: { type: String, default: "" },
     wishlist: [
    {
      circularId: { type: mongoose.Schema.Types.ObjectId, ref: 'Circular' },
      postName: { type: String, required: true }
    }
  ],
    educationDetails: [
      {
        degree: { type: String },
        institution: { type: String },
        year: { type: String },
        result: { type: String },
        certificateUrls: [{ type: String }],
      },
    ],
    // ডকুমেন্টস (Cloudinary URL)
    profileImage: { type: String, default: "" },
    signature: { type: String, default: "" },
    certificate: { type: String, default: "" },
  },
  { timestamps: true },
);

// পাসওয়ার্ড হ্যাশিং
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", userSchema);
