import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('Testing Firebase connection...');
    console.log('Project ID:', process.env.VITE_FIREBASE_PROJECT_ID);
    
    // Construct the REST API URL
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents`;
    
    console.log('Attempting to connect via REST API...');
    
    const response = await fetch(`${baseUrl}/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully connected to Firestore via REST');
    console.log('Number of documents:', data.documents ? data.documents.length : 0);
    
    process.exit(0);
  } catch (error) {
    console.error('Connection test failed:', error);
    console.error('Error details:', {
      status: error.status,
      message: error.message
    });
    process.exit(1);
  }
}

testConnection();