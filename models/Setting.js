import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  smsFee: { type: Number, default: 15 },
  tiers: { type: [Number], default: [100, 180, 250, 310, 360] },
  extraPer: { type: Number, default: 50 },
  helpline: { type: String, default: '01700000000' },
  
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