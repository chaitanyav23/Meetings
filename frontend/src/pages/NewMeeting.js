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

  // Simple email format validator
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onSubmit = async (data) => {
    if (new Date(data.end) <= new Date(data.start)) {
      alert('End time must be after start time.');
      return;
    }

    const inviteeEmails = data.inviteeEmails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email);

    if (inviteeEmails.length === 0) {
      alert('Please enter at least one invitee email.');
      return;
    }

    for (const email of inviteeEmails) {
      if (!validateEmail(email)) {
        alert(`Invalid email format: ${email}`);
        return;
      }
    }

    // Prevent inviting self
    if (inviteeEmails.includes(user?.email.toLowerCase())) {
      alert('You cannot invite yourself to a meeting.');
      return;
    }

    const payload = {
      host_id: user?.id,
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
      alert('Meeting created successfully!');
      navigate('/home');
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Error creating meeting: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Create New Meeting</h2>
      <p>Logged in as: {user?.name} ({user?.email})</p>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="summary">Meeting Title:</label>
          <input
            id="summary"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Enter meeting title"
            {...register('summary', { required: 'Title is required' })}
          />
          {errors.summary && <span style={{ color: 'red' }}>{errors.summary.message}</span>}
        </div>

        <div>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            style={{ width: '100%', padding: '8px', marginTop: '5px', height: '100px' }}
            placeholder="Meeting description (optional)"
            {...register('description')}
          />
        </div>

        <div>
          <label htmlFor="start">Start Time:</label>
          <input
            id="start"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            type="datetime-local"
            {...register('start', { required: 'Start time is required' })}
          />
          {errors.start && <span style={{ color: 'red' }}>{errors.start.message}</span>}
        </div>

        <div>
          <label htmlFor="end">End Time:</label>
          <input
            id="end"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            type="datetime-local"
            {...register('end', { required: 'End time is required' })}
          />
          {errors.end && <span style={{ color: 'red' }}>{errors.end.message}</span>}
        </div>

        <div>
          <label htmlFor="inviteeEmails">Invitee Emails (comma-separated):</label>
          <input
            id="inviteeEmails"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="friend@example.com, colleague@work.com"
            {...register('inviteeEmails', { required: 'At least one invitee email is required' })}
          />
          {errors.inviteeEmails && <span style={{ color: 'red' }}>{errors.inviteeEmails.message}</span>}
          <small style={{ color: '#666' }}>Enter the registered Gmail addresses of users you want to invite</small>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 20px',
            backgroundColor: loading ? '#5a9bf6' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? 'Creating Meeting...' : 'Create Meeting'}
        </button>
      </form>
    </div>
  );
}
