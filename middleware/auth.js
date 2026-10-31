import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// 💡 ১. ইউজার লগইন আছে কি না চেক করার মিডলওয়্যার
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // ইউজারকে খোঁজা এবং req.user এ সেভ করা
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ msg: "ইউজার পাওয়া যায়নি" });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: "অনুমতি নেই, টোকেন সঠিক নয়" });
    }
  }

  if (!token) {
    res.status(401).json({ msg: "অনুমতি নেই, কোনো টোকেন পাওয়া যায়নি" });
  }
};

// 💡 ২. অ্যাডমিন কি না চেক করার মিডলওয়্যার (নতুন যোগ করা হলো)
export const admin = (req, res, next) => {
  // protect মিডলওয়্যার আগে রান হবে, তাই req.user এ ইউজারের ডাটা থাকবে
  if (req.user && req.user.role === 'admin') {
    next(); // যদি অ্যাডমিন হয়, তবে পরের ফাংশনে (রাউটে) যেতে দিবে
  } else {
    res.status(403).json({ msg: "শুধুমাত্র অ্যাডমিন এই রিকোয়েস্ট করতে পারবে" });
  }
};