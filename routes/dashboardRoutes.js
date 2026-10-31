import express from "express";
import Application from "../models/application.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/v1/dashboard
// @desc    অ্যাডমিন ড্যাশবোর্ডের সব স্ট্যাটস
router.get('/', protect, async (req, res) => {
  try {
    // ১. KPI Counts
    const total = await Application.countDocuments();
    const pending = await Application.countDocuments({ status: 'pending' });
    const processing = await Application.countDocuments({ status: 'processing' });
    const review = await Application.countDocuments({ status: 'review' });
    const completed = await Application.countDocuments({ status: 'completed' });
    const rejected = await Application.countDocuments({ status: 'rejected' });

    // ২. Money Stats
    const moneyStats = await Application.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "verified"] }, "$amount", 0] }
          },
          pendingPayment: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$amount", 0] }
          }
        }
      }
    ]);
    const money = moneyStats.length > 0 ? moneyStats[0] : { totalCollected: 0, pendingPayment: 0 };

    // ৩. Circular Stats
 const circularStats = await Application.aggregate([
      {
        // ১. Application থেকে Circular কালেকশনে ডাটা খোঁজা (Join)
        $lookup: {
          from: "circulars", // আপনার MongoDB-তে কালেকশনের নাম (সাধারণত 'circulars' হয়)
          let: { circIdStr: "$circularId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$id", "$$circIdStr"] }, // যদি Circular এর id (String) ম্যাচ করে
                    { $eq: [{ $toString: "$_id" }, "$$circIdStr"] } 
                  ]
                }
              }
            },
            { $project: { org: 1 } } 
          ],
          as: "circularInfo"
        }
      },
      { $unwind: { path: "$circularInfo", preserveNullAndEmptyArrays: true } },
      
      {
        $group: {
          _id: { 
            $ifNull: [
              "$circularInfo.org", 
              { $ifNull: ["$circularOrg", "অজানা সার্কুলার"] }
            ] 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }, // বেশি আবেদন আগে
      { $limit: 5 } // সর্বোচ্চ ৫টি
    ]);

    // ৪. Recent Activity
    const recentActivity = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('applicationId name createdAt status');

    res.json({
      kpis: { total, pending, processing, review, completed, rejected },
      money,
      circularStats: circularStats.map(c => ({ name: c._id || 'Unknown', count: c.count })),
      recentActivity
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;