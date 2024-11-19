import dotenv from 'dotenv';
import { GoogleAuth } from 'google-auth-library';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const baseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

const sessions = [
  {
    title: 'General Wellness Class',
    type: 'general',
    description: 'A comprehensive wellness session focusing on overall health and fitness.',
    price: 15,
    capacity: 20,
    enrolled: 0,
    instructor: 'Dwellness',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80',
    recurringDays: [0, 1, 3],
    startTime: '08:00',
    endTime: '09:00'
  },
  ...['Stress Management', 'Diabetes & Hypertension', 'Weight Loss', 'PCOS/Women\'s Health'].map((topic, index) => ({
    title: `Specialized Workshop - ${topic}`,
    type: 'specialized',
    description: `Expert-led workshop focusing on ${topic}.`,
    price: 20,
    capacity: 15,
    enrolled: 0,
    instructor: 'Dwellness',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80',
    recurringDays: [0],
    startTime: '09:30',
    endTime: '11:00',
    specializedTopic: topic,
    rotationIndex: index
  })),
  {
    title: 'Meditation & Breathwork',
    type: 'meditation',
    description: 'Guided meditation and breathwork session for inner peace and relaxation.',
    price: 10,
    capacity: 25,
    enrolled: 0,
    instructor: 'Dwellness',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80',
    recurringDays: [1, 3],
    startTime: '20:00',
    endTime: '21:00'
  }
];

const testUser = {
  id: 'test-user-id',
  email: 'testuser@example.com',
  name: 'Test User',
  role: 'user'
};

// Function to get access token
async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: './config/dwellness-93630-firebase-adminsdk-44foe-90bd8101c9.json', // Corrected path
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    
    const accessToken = await getAccessToken();
    
    // Fetch existing sessions
    const getResponse = await fetch(`${baseUrl}/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch sessions: ${getResponse.statusText}`);
    }

    const data = await getResponse.json();
    const existingDocs = data.documents || [];

    // Delete existing sessions
    if (existingDocs.length > 0) {
      console.log(`Deleting ${existingDocs.length} existing sessions...`);
      for (const doc of existingDocs) {
        const docPath = doc.name.split('/documents/')[1];
        await fetch(`${baseUrl}/${docPath}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
      console.log('Existing sessions deleted');
    }

    // Add new sessions
    console.log('Adding new sessions...');
    for (const session of sessions) {
      const response = await fetch(`${baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            title: { stringValue: session.title },
            type: { stringValue: session.type },
            description: { stringValue: session.description },
            price: { integerValue: session.price },
            capacity: { integerValue: session.capacity },
            enrolled: { integerValue: session.enrolled },
            instructor: { stringValue: session.instructor },
            image: { stringValue: session.image },
            recurringDays: {
              arrayValue: {
                values: session.recurringDays.map(day => ({ integerValue: day }))
              }
            },
            startTime: { stringValue: session.startTime },
            endTime: { stringValue: session.endTime },
            ...(session.specializedTopic ? {
              specializedTopic: { stringValue: session.specializedTopic }
            } : {})
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add session: ${response.statusText}`);
      }
      console.log(`Added session: ${session.title}`);
    }

    // Add test user
    console.log('Adding test user...');
    const userResponse = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: testUser.id },
          email: { stringValue: testUser.email },
          name: { stringValue: testUser.name },
          role: { stringValue: testUser.role }
        }
      })
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to add test user: ${userResponse.statusText}`);
    }
    console.log('Test user added successfully');

    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

resetDatabase();