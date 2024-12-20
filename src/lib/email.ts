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
      from: '"Dwellness" <admin@dwellness.club>',
      to,
      subject: 'Booking Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h1 style="color: #4A90E2;">Booking Confirmation</h1>
          <p style="font-size: 16px;">Thank you for booking <strong>${booking?.session?.title || 'your session'}</strong>!</p>
          <p style="font-size: 16px;">Here are your booking details:</p>
          <img src="${booking?.session?.image || ''}" alt="Session Image" style="width: 100%; height: auto; border-radius: 10px; margin-bottom: 20px;" />
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Date</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${booking?.scheduledDate || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Time</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${booking?.session?.startTime ? new Date(booking.session.startTime).toLocaleTimeString('en-US', { timeZone: 'America/Denver' }) : 'N/A'} - 
                 ${booking?.session?.endTime ? new Date(booking.session.endTime).toLocaleTimeString('en-US', { timeZone: 'America/Denver' }) : 'N/A'} MST</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Price</td>
              <td style="padding: 10px; border: 1px solid #ddd;">$${booking?.session?.price || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Description</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${booking?.session?.description || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Specialized Topic</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${booking?.session?.specializedTopic || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Booking Status</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${booking?.status || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Booked At</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${booking?.bookedAt ? new Date(booking.bookedAt).toLocaleString('en-US', { timeZone: 'America/Denver' }) : 'N/A'}</td>
            </tr>
          </table>
          <p style="font-size: 16px; margin-top: 20px;">We look forward to seeing you!</p>
          <p style="font-size: 16px;">Best regards,<br/>The WellnessBolt Team</p>
        </div>
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
