import { Router } from 'express';
const router = Router();

// Dummy sample notifications data
const notifications = [
  {
    inviteId: 'some-uuid-1',
    message: 'You have a new meeting invite',
    status: 'pending'
  },
  {
    inviteId: 'some-uuid-2',
    message: 'Meeting started',
    status: 'accepted'
  }
];

router.get('/', (req, res) => {
  // Replace with real DB call to get notifications for the user
  res.json({ notifications });
});

export default router;
