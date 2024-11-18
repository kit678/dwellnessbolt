// ... previous imports remain same

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
    recurringDays: [0],
    startTime: '08:00',
    endTime: '09:00'
  },
  {
    title: 'General Wellness Class',
    type: 'general',
    description: 'A comprehensive wellness session focusing on overall health and fitness.',
    price: 15,
    capacity: 20,
    enrolled: 0,
    instructor: 'Dwellness',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80',
    recurringDays: [1, 3],
    startTime: '19:00',
    endTime: '20:00'
  },
  {
    title: 'Specialized Workshop',
    type: 'specialized',
    description: 'Expert-led workshop focusing on various health topics.',
    price: 20,
    capacity: 15,
    enrolled: 0,
    instructor: 'Dwellness',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80',
    recurringDays: [0],
    startTime: '09:30',
    endTime: '11:00',
    specializedTopic: 'Stress Management'
  },
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

// ... rest of the code until the resetDatabase function

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    
    const accessToken = await getAccessToken();
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents`;
    
    // Delete existing sessions
    console.log('Fetching existing sessions...');
    const getResponse = await fetch(`${baseUrl}/sessions`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!getResponse.ok) {
      throw new Error(`HTTP error! status: ${getResponse.status}`);
    }

    const data = await getResponse.json();
    const existingDocs = data.documents || [];
    
    if (existingDocs.length > 0) {
      console.log(`Deleting ${existingDocs.length} existing sessions...`);
      for (const doc of existingDocs) {
        const docPath = doc.name.split('/documents/')[1];
        await fetch(`${baseUrl}/${docPath}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
      console.log('Existing sessions deleted');
    }

    // Add new sessions
    console.log('Adding new sessions...');
    for (const [index, session] of sessions.entries()) {
      const response = await fetch(`${baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
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
        throw new Error(`Failed to add session ${index + 1}`);
      }
      console.log(`Added session ${index + 1}/${sessions.length}`);
    }

    console.log('Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetDatabase();