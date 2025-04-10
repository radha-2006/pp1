// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [profile, setProfile] = useState({
    career_field: '',
    preferred_locations: [],
    experience_level: '',
    skills: []
  });

  useEffect(() => {
    // Generate or retrieve user ID
    const storedUserId = localStorage.getItem('jobAssistantUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `user_${Date.now()}`;
      localStorage.setItem('jobAssistantUserId', newUserId);
      setUserId(newUserId);
    }
  }, []);

  const initializeProfile = async () => {
    try {
      const response = await fetch('/api/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...profile,
          last_updated: new Date().toISOString()
        }),
      });
      if (response.ok) {
        setIsInitialized(true);
        addMessage('assistant', 'Profile saved! How can I help you with your job search today?');
      }
    } catch (error) {
      console.error('Error initializing profile:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    addMessage('user', input);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message: input,
          is_new_session: !isInitialized
        }),
      });

      const data = await response.json();
      addMessage('assistant', data.response);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
  };

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    handleProfileChange('preferred_locations', selected);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Job Market Assistant</title>
        <meta name="description" content="AI-powered job market insights" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">Job Market Assistant</h1>
        
        {!isInitialized ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Set Up Your Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Career Field</label>
                <input
                  type="text"
                  value={profile.career_field}
                  onChange={(e) => handleProfileChange('career_field', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Locations</label>
                <select
                  multiple
                  value={profile.preferred_locations}
                  onChange={handleLocationChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                <select
                  value={profile.experience_level}
                  onChange={(e) => handleProfileChange('experience_level', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
                <input
                  type="text"
                  value={profile.skills.join(', ')}
                  onChange={(e) => handleProfileChange('skills', e.target.value.split(',').map(s => s.trim()))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={initializeProfile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Save Profile & Start Chatting
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 h-96 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-900'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t p-4">
              <div className="flex">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about job market trends, skills, or opportunities..."
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
                >
                  Send
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Try: "What are the most in-demand skills in tech?" or "What jobs match my experience?"
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
