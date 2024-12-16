import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.VITE_EMAIL_HOST,
  port: parseInt(process.env.VITE_EMAIL_PORT!),
  secure: true, // Use SSL
  auth: {
    user: process.env.VITE_EMAIL_USER,
    pass: process.env.VITE_EMAIL_PASSWORD,
  },
});

export const sendBookingConfirmation = async (to: string, booking: any) => {
  try {
    const info = await transporter.sendMail({
      from: '"WellnessHub" <admin@dwellness.club>',
      to,
      subject: 'Booking Confirmation',
      html: `
        <h1>Booking Confirmation</h1>
        <p>Thank you for booking ${booking.session.title}!</p>
        <p>Date: ${new Date(booking.session.startTime).toLocaleDateString()}</p>
        <p>Time: ${new Date(booking.session.startTime).toLocaleTimeString()} - 
           ${new Date(booking.session.endTime).toLocaleTimeString()}</p>
        <p>Price: $${booking.session.price}</p>
      `,
    });
    logger.info(`Email sent: ${info.response}`, 'Email');
    logger.info(`Message ID: ${info.messageId}`, 'Email');
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info) || 'No preview URL available'}`, 'Email');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendBookingReminder = async (to: string, booking: any) => {
  await transporter.sendMail({
    from: '"WellnessHub" <admin@dwellness.club>',
    to,
    subject: 'Upcoming Session Reminder',
    html: `
      <h1>Session Reminder</h1>
      <p>Your session ${booking.session.title} is starting soon!</p>
      <p>Date: ${new Date(booking.session.startTime).toLocaleDateString()}</p>
      <p>Time: ${new Date(booking.session.startTime).toLocaleTimeString()}</p>
    `,
  });
};
