import { Router } from 'express';

const router = Router();

// Example route: respond to GET /api/invitations
router.get('/', (req, res) => {
  res.json({ message: 'Invitations route is working.' });
});

export default router;
