// pages/api/chat.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { user_id, message, is_new_session } = await req.json();
  
  try {
    const backendResponse = await fetch('http://localhost:8000/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        message,
        is_new_session
      }),
    });
    
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}

// pages/api/initialize.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  
  try {
    const backendResponse = await fetch('http://localhost:8000/initialize_user/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initialize user profile' },
      { status: 500 }
    );
  }
}
