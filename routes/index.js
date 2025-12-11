
import express from 'express';
import { query as dbQuery } from '../database.js';



const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', { title: 'Welcome to Knowledge tracker:' });
});





router.get('/dashboard', async (req, res) => {
    if (!req.user) {
        req.flash('error', 'You must Login');
        return res.redirect('/authentication/login');
    }

    try {
        /*
        How does the system know req.user.id is the logged-in user?
        Because Passport's global middleware runs first, reads the session cookie, loads the user from DB, and attaches it to:
        req.user
        */
        const topicList = await dbQuery(
            'SELECT * FROM topics WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );

        const logList = await dbQuery(
            'SELECT sl.*, t.title FROM study_logs sl LEFT JOIN topics t ON sl.topic_id = t.id WHERE sl.user_id = $1 ORDER BY sl.created_at DESC LIMIT 20',
            [req.user.id]
        );

        res.render('dashboard', {
            title: 'Dashboard',
            topics: topicList.rows,   
            logs: logList.rows       
        });

    } catch (err) {
        console.log(err);
        req.flash('error', 'Could not load dashboard.');
        res.redirect('/');
    }
});




export default router;
