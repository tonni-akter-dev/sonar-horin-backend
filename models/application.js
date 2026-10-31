import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Applicant Info
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    dob: { type: Date },
    nid: { type: String },
    address: { type: String },
    education: { type: String },

    // Circular Info
    circularId: { type: String, required: true },
    circularOrg: { type: String },
    posts: [
      {
        postId: { type: String }, 
        name: { type: String, required: true },
        fee: { type: Number },
        grade: { type: String },
      },
    ],

    documents: {
      photo: { type: String },
      signature: { type: String },
      nidPhoto: [{ type: String }],
      ssc: [{ type: String }], 
      hsc: [{ type: String }],
      graduation: [{ type: String }],
      masters: [{ type: String }],
      diploma: [{ type: String }],
    },

    // 💡 Payment Info
    amount: { type: Number, required: true },
    paymentMethod: { type: String },
    senderNumber: { type: String }, // নতুন: যে নাম্বার থেকে পেমেন্ট করেছে
    trxId: { type: String }, // নতুন: ট্রানজেকশন আইডি
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "verified", "rejected"],
      default: "pending",
    },

    status: {
      type: String,
      enum: ["pending", "processing", "review", "completed", "rejected"],
      default: "pending",
    },

    timeline: [
      {
        title: String,
        date: String,
        status: { type: String, enum: ["done", "current", "pending"] },
        desc: String,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Application", applicationSchema);
