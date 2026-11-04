import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // একটি আবেদনে একটিই রিভিউ
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, unique: true },
    applicationId: { type: String }, // যেমন: SH-XXXX (দেখানোর জন্য)

    name: { type: String, required: true },  // রিভিউদাতার নাম
    role: { type: String, default: "" },     // কোন পদে আবেদন (যেমন: অফিস সহায়ক)
    image: { type: String, default: "" },    // প্রোফাইল ছবি (থাকলে)

    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },

    // অ্যাডমিন অনুমোদন দিলে হোমপেজে দেখাবে
    status: { type: String, enum: ["pending", "approved", "hidden"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
