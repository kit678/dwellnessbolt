import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_USER = {
  email: 'test@example.com',
  password: 'testpass123'
};

async function getAccessToken() {
  try {
    // First create the user in Firebase Auth
    const signUpResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.VITE_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
          returnSecureToken: true
        })
      }
    );

    if (!signUpResponse.ok) {
      const error = await signUpResponse.json();
      if (error.error.message === 'EMAIL_EXISTS') {
        // If user exists, try to sign in instead
        const signInResponse = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.VITE_FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: TEST_USER.email,
              password: TEST_USER.password,
              returnSecureToken: true
            })
          }
        );
        
        if (!signInResponse.ok) {
          throw new Error(`Auth failed: ${signInResponse.statusText}`);
        }
        
        const data = await signInResponse.json();
        return { token: data.idToken, userId: data.localId, exists: true };
      }
      throw new Error(`Auth failed: ${error.error.message}`);
    }

    const data = await signUpResponse.json();
    return { token: data.idToken, userId: data.localId, exists: false };
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Get authentication token and user ID
    const { token, userId, exists } = await getAccessToken();
    
    if (exists) {
      console.log('Test user already exists and credentials are valid');
      console.log('Email:', TEST_USER.email);
      console.log('Password:', TEST_USER.password);
      console.log('User ID:', userId);
      process.exit(0);
      return;
    }

    // Construct the REST API URL for Firestore
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents`;
    
    // Create user document in Firestore
    const response = await fetch(`${baseUrl}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fields: {
          email: { stringValue: TEST_USER.email },
          name: { stringValue: TEST_USER.name },
          role: { stringValue: TEST_USER.role }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create user document: ${response.statusText}`);
    }

    console.log('Test user created successfully!');
    console.log('Email:', TEST_USER.email);
    console.log('Password:', TEST_USER.password);
    console.log('User ID:', userId);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Add error handler for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

createTestUser();