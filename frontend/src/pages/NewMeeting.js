import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function NewMeeting() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Date validation
  const validateDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start <= now) {
      return 'Start time must be in the future';
    }
    if (end <= start) {
      return 'End time must be after start time';
    }
    if (end - start < 15 * 60 * 1000) { // 15 minutes minimum
      return 'Meeting must be at least 15 minutes long';
    }
    return null;
  };

  const onSubmit = async (data) => {
    setError(null);
    
    // Validate dates
    const dateError = validateDates(data.start, data.end);
    if (dateError) {
      setError(dateError);
      return;
    }

    // Process emails
    const inviteeEmails = data.inviteeEmails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email);

    if (inviteeEmails.length === 0) {
      setError('Please enter at least one invitee email.');
      return;
    }

    // Validate email formats
    for (const email of inviteeEmails) {
      if (!validateEmail(email)) {
        setError(`Invalid email format: ${email}`);
        return;
      }
    }

    // Prevent self-invitation
    if (inviteeEmails.includes(user?.email.toLowerCase())) {
      setError('You cannot invite yourself to a meeting.');
      return;
    }

    // Prepare payload - removed host_id as backend gets it from req.user
    const payload = {
      summary: data.summary,
      description: data.description,
      start_ts: new Date(data.start).toISOString(),
      end_ts: new Date(data.end).toISOString(),
      inviteeEmails,
    };

    setLoading(true);
    try {
      console.log('Creating meeting with payload:', payload);
      const response = await api.post('/meetings', payload);
      console.log('Meeting created:', response.data);
      
      // Success feedback
      alert('Meeting created successfully!');
      navigate('/home');
    } catch (error) {
      console.error('Error creating meeting:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      setError(`Failed to create meeting: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading user information...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Create New Meeting</h1>
      <p>Logged in as: <strong>{user.name}</strong> ({user.email})</p>
      
      {error && (
        <div style={{ 
          color: 'red', 
          background: '#ffebee', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="summary">Meeting Title *</label>
          <input
            id="summary"
            type="text"
            {...register('summary', { required: 'Meeting title is required' })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Enter meeting title"
          />
          {errors.summary && <span style={{ color: 'red', fontSize: '14px' }}>{errors.summary.message}</span>}
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            {...register('description')}
            style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '80px' }}
            placeholder="Enter meeting description (optional)"
          />
        </div>

        <div>
          <label htmlFor="start">Start Time *</label>
          <input
            id="start"
            type="datetime-local"
            {...register('start', { required: 'Start time is required' })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.start && <span style={{ color: 'red', fontSize: '14px' }}>{errors.start.message}</span>}
        </div>

        <div>
          <label htmlFor="end">End Time *</label>
          <input
            id="end"
            type="datetime-local"
            {...register('end', { required: 'End time is required' })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.end && <span style={{ color: 'red', fontSize: '14px' }}>{errors.end.message}</span>}
        </div>

        <div>
          <label htmlFor="inviteeEmails">Invitee Emails *</label>
          <input
            id="inviteeEmails"
            type="text"
            {...register('inviteeEmails', { required: 'At least one invitee email is required' })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Enter emails separated by commas"
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Separate multiple emails with commas. Example: john@example.com, jane@example.com
          </small>
          {errors.inviteeEmails && <span style={{ color: 'red', fontSize: '14px' }}>{errors.inviteeEmails.message}</span>}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#4285f4',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            marginTop: '10px'
          }}
        >
          {loading ? 'Creating Meeting...' : 'Create Meeting'}
        </button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => navigate('/home')}
          style={{
            backgroundColor: '#f1f3f4',
            color: '#3c4043',
            padding: '8px 16px',
            border: '1px solid #dadce0',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
