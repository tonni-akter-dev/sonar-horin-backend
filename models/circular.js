import mongoose from 'mongoose';

const circularSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // যেমন: 'wtmu-2026'
  title: { type: String, required: true }, // 💡 নতুন: সার্কুলারের নাম (যেমন: স্টেনোটাইপিস্ট)
  org: { type: String, required: true },
  orgEn: { type: String, required: true },
  ab: { type: String, required: true }, 
  color: { type: String, default: '#5B3DF5' },
  loc: { type: String, required: true },
  district: { type: String, default: 'সকল জেলা' },
  scope: { type: String, enum: ['national', 'district'], default: 'national' },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  cat: { type: String, required: true }, 
  total: { type: Number },
  cats: { type: Number },
  
  // পোস্ট লিস্ট
  posts: [{
    n: { type: String, required: true }, 
    v: { type: Number }, 
    g: { type: Number }, 
    sal: { type: String }, 
    fee: { type: Number }, 
    edu: { type: Number }, 
    q: { type: String } 
  }],
  
  // 💡 নতুন ফিল্ডসমূহ
  pdfUrl: { type: String, default: '' }, // PDF আপলোডের লিংক
  link: { type: String, default: '' }, // সরাসরি আবেদনের অফিসিয়াল লিংক
  allowSelfApply: { type: Boolean, default: true }, // ইউজার নিজে আবেদন করতে পারবে কি না
  allowServiceApply: { type: Boolean, default: true }, // আমাদের মাধ্যমে আবেদন করতে পারবে কি না
  
  note: { type: String },
  age: {
    min: { type: Number },
    max: { type: Number },
    note: { type: String }
  }
}, { timestamps: true });

export default mongoose.model('Circular', circularSchema);