import { useState } from 'react';
import {v4 as uuidv4} from 'uuid';

const API_URL = 'https://lyvl3j6y84.execute-api.ap-southeast-2.amazonaws.com/dev';
const BUCKET = 'rekog-visitor-pics';

function App() {
  const [image, setImage] = useState(null);
  const [uploadResultMessage, setUploadResultMessage] = useState('Please upload an image');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuth, setAuth] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadResultMessage('Please select an image file');
        return;
      }
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const sendImage = async (e) => {
    e.preventDefault();
    if (!image) {
      setUploadResultMessage('Please select an image first');
      return;
    }

    setIsLoading(true);
    setUploadResultMessage('Processing...');

    try {
      const visitorImageName = uuidv4();
      const fileName = `${visitorImageName}.jpeg`;

      await fetch(`${API_URL}/${BUCKET}/${fileName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: image,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await authenticate(visitorImageName);
      console.log('Authentication response:', response);
      
      if (response?.Message === 'Success') {
        setAuth(true);
        setUploadResultMessage(`Hi ${response.firstName} ${response.lastName}, welcome to work!`);
      } else {
        setAuth(false);
        setUploadResultMessage('Authentication failed ' + (response?.Message || 'Unknown error'));
      }
    } catch (err) {
      setAuth(false);
      setUploadResultMessage(`Authentication process failed: ${err.message}`);
      console.error('Authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (visitorImageName) => {
    // Make sure the objectKey includes the file extension
    const objectKey = `${visitorImageName}.jpeg`;
    
    try {
      // Note: API Gateway expects the parameter exactly as 'objectKey'
      const response = await fetch(`${API_URL}/employee?objectKey=${encodeURIComponent(objectKey)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      // The response is wrapped in API Gateway format, so we need to parse the body
      if (data.body) {
        return JSON.parse(data.body);
      }
      
      return data;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Company Face Recognition App</h1>
      <form onSubmit={sendImage} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!image || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Authenticate'}
        </button>
      </form>
      
      <div className={`mt-4 p-2 rounded ${isAuth ? 'bg-green-100' : 'bg-red-100'}`}>
        {uploadResultMessage}
      </div>
      
      {previewUrl && (
        <div className="mt-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-64 h-64 object-cover rounded"
          />
        </div>
      )}
    </div>
  );
}

export default App;