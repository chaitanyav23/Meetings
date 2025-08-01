import { Router } from 'express';
import * as meetingsCtrl from '../controllers/meetings.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// Protect meeting creation route with authentication middleware
router.post('/', authenticateToken, meetingsCtrl.createMeeting);

export default router;


// To protect list route, uncomment and also use the middleware
// router.get('/', authenticateToken, meetingsCtrl.listMeetings);

// export default router;
