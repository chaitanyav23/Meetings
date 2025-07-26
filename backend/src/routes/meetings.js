import { Router } from 'express';
import * as meetingsCtrl from '../controllers/meetings.js';

const router = Router();
router.post('/', meetingsCtrl.createMeeting);
// router.get('/', meetingsCtrl.listMeetings);
export default router;
