import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  smsFee: { type: Number, default: 15 },
  tiers: { type: [Number], default: [100, 180, 250, 310, 360] },
  extraPer: { type: Number, default: 50 },
  helpline: { type: String, default: '01700000000' },
  
   // 💡 সরকারি আবেদন ফি অপশন (Pricing এর ড্রপডাউনে দেখাবে)
  govtFees: {
    type: [{
      amount: { type: Number, required: true }, // টাকা
      label: { type: String, default: '' },     // যেমন: '২০তম গ্রেড'
    }],
    default: [
    { amount: 56, label: '২০তম গ্রেড' },
    { amount: 112, label: '১৩–১৯তম গ্রেড' },
    { amount: 168, label: '১০–১২তম গ্রেড' },
    { amount: 223, label: '৯ম গ্রেড ও উপরে' },
  ],
  },
  // 💡 methods ফিল্ডটি নিচের মতো অবজেক্টের অ্যারে হতে হবে
  methods: [{
    id: { type: String },
    name: { type: String },
    number: { type: String },
    type: { type: String },
    active: { type: Boolean },
  }]
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);