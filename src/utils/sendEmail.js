//File: src/utils/sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // <-- App Password di sini
  },
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"ABCourse Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
