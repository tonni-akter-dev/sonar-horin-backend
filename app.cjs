// cPanel (Phusion Passenger) startup file
// package.json এ "type": "module" থাকায় server.js সরাসরি require() করা যায় না,
// তাই এই ফাইল দিয়ে ESM server.js লোড করা হচ্ছে।
import('./server.js').catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
