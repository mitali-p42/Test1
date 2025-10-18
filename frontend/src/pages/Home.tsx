import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

type Profile = {
  role: string | '—';
  interviewType: string | '—';
  yearsOfExperience: number | string | '—';
};

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile>({
    role: '—',
    interviewType: '—',
    yearsOfExperience: '—',
  });
  const [loading, setLoading] = useState(false);

  // Read token and trigger re-run when it becomes available
  const token = useMemo(() => localStorage.getItem('token') ?? '', [user?.email]);

  useEffect(() => {
    if (!token) return; // wait until token exists
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/interview-profile/me`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const text = await res.text(); // helpful for debugging
        const data = text ? JSON.parse(text) : {};

        if (!cancelled && res.ok) {
          const d = data?.profile ?? data;
          setProfile({
            role: d.role ?? '—',
            interviewType: d.interviewType ?? d.interview_type ?? '—',
            yearsOfExperience:
              d.yearsOfExperience ?? d.years_of_experience ?? '—',
          });
        } else if (!cancelled) {
          console.error('Failed to fetch interview profile:', res.status, text);
        }
      } catch (err) {
        if (!cancelled) console.error('Error fetching profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]); // 👈 runs again when token appears

  
  function handleConfirm() {
    navigate('/interview', { state: { profile } });
  }

  return (
    <div style={{ padding: 24, maxWidth: 680, margin: '0 auto' }}>
      <h1>Welcome{user?.email ? `, ${user.email}` : ''}.</h1>

      <div style={{ marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fafafa' }}>
        <h2 style={{ marginTop: 0 }}>Interview Details</h2>

        {loading ? (
          <p>Loading interview details...</p>
        ) : (
          <>
            <p><strong>Role:</strong> {profile.role}</p>
            <p><strong>Interview type:</strong> {profile.interviewType}</p>
          </>
        )}

        <p style={{ marginTop: 16 }}>
          Please click <strong>Confirm</strong> to start the interview and proceed with the given information.
        </p>

        <button onClick={handleConfirm} style={{ padding: '10px 14px', borderRadius: 10, border: 0, background: '#111827', color: '#fff', cursor: 'pointer' }}>
          Confirm
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
