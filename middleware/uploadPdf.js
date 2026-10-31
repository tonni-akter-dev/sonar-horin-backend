import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js'; // 💡 নিশ্চিত করুন cloudinary.js এ export default আছে

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chakrisathi_pdfs',
    resource_type: 'auto',
    allowed_formats: ['pdf', 'jpg', 'png', 'jpeg'],
  },
});

const uploadPdf = multer({ storage: storage });

export default uploadPdf; 