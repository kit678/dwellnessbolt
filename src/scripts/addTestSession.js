import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccount = JSON.parse(
  readFileSync(resolve('D:/Dev/WellnessBolt/config/dwellness-93630-firebase-adminsdk-44foe-e02410b4b9.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function addTestSession() {
  const sessionData = {
    title: "test consultation",
    description: "test consultation daily occurrence 6 pm - 7 pm mountain time",
    startTime: "18:00", // 6 PM MST
    endTime: "19:00", // 7 PM MST
    capacity: 3,
    enrolled: 0,
    price: 10,
    specializedTopic: null,
    recurringDays: [0, 1, 2, 3, 4, 5, 6], // All days of the week
  };

  try {
    const sessionRef = await db.collection('sessions').add(sessionData);
    console.log(`Test session added with ID: ${sessionRef.id}`);
  } catch (error) {
    console.error('Error adding test session:', error);
  }
}

addTestSession();
