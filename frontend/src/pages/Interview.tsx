import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VoiceInterview from '../components/VoiceInterview';

type Profile = {
  role: string;
  interviewType: string;
  yearsOfExperience: number | string;
};

export default function Interview() {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = location.state?.profile as Profile | undefined;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'creating' | 'ready' | 'completed'>('creating');

  useEffect(() => {
    if (!profile) {
      navigate('/');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Create session
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/interview/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: profile.role,
            interviewType: profile.interviewType,
            yearsOfExperience: profile.yearsOfExperience,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setSessionId(data.sessionId);
          
          // Start session
          await fetch(`${import.meta.env.VITE_API_BASE}/interview/sessions/${data.sessionId}/start`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          });
          
          setStatus('ready');
        }
      } catch (err) {
        console.error('Failed to create session:', err);
        alert('Failed to start interview');
        navigate('/');
      }
    })();
  }, [profile, navigate]);

  function handleComplete() {
    setStatus('completed');
    alert('Interview completed! Check your results.');
    navigate('/');
  }

  if (!profile) return null;

  if (status === 'creating') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Setting up your interview...</h2>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>✅ Interview Completed!</h2>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', marginBottom: 24 }}>
        <h1>Live Interview</h1>
        <p style={{ color: '#666' }}>
          <strong>Role:</strong> {profile.role} | <strong>Type:</strong> {profile.interviewType}
        </p>
      </div>

      {sessionId && (
        <VoiceInterview
          sessionId={sessionId}
          profile={profile}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}