import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { query as dbQuery } from '../database.js';
import { error } from 'console';
import { title } from 'process';

const router = express.Router();
const SALT_ROUND = 10;

router.get('/register', (req, res) =>{
    res.render('register', {title: 'Register Now!!!'})
});

router.post('/register', async(req, res, next) => {

    try{
        const{email, password, username} = req.body;
        if(!email || !password){
            req.flash('error', 'You need to enter email and password');
            return res.redirect('/authentication/register');
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUND);
        const newUser= await dbQuery(
            'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING *',
            [email, hashedPassword, username || email]);  

        req.login(newUser.rows[0], (err) => {
            if(err) return next (err); //next is simply a function that Express gives you so you can pass control to the next middleware — usually to handle errors.
            req.flash('Account created successfuly');
            return res.redirect('/dashboard')
  
        });
    }
    catch(err){
        console.log(err);
        req.flash('error','Registration failed');
        res.redirect('/authentication/register');
    }
});

router.get('/login', (req,res) => res.render('login', {title: 'Login'}));

router.post('/login', async(req, res, next) => {
    try{
        const {email, password} = req.body;

        const { rows } = await dbQuery('SELECT * FROM users WHERE email = $1', [email]);
        const user = rows[0];
        //if user doesnt exist or hashed  password in DB doesnt exist
        if(!user || !user.password_hash){
            req.flash('error', 'Incorrect password');
            return res.redirect('/authentication/login');
        }
///if user exists then comapre password entered by user for login with hashed password in DB
        const matchingPassword = await bcrypt.compare(password, user.password_hash);
        //if passwords dont match:
        if(!matchingPassword){
            req.flash('error', 'Incorrect password');
            return res.redirect('/authentication/login');
        }
        req.login(user, (err) => {

            if(err) return next (err);
            req.flash('success', 'You have logged in successfully');
            return res.redirect('/dashboard');
        });
    }
    catch(err){
        next(err);
    }
});




router.post('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);

        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            return res.redirect('/');
        });
    });
});

router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);

        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            return res.redirect('/');
        });
    });
});


//Google authentication:

router.get('/google', passport.authenticate('google', {scope :['profile', 'email']}));

console.log("Redirecting to Google with callback:", process.env.GOOGLE_CALLBACK_URL);

/*/google/callback is the URL Google redirects to after the user logs in. */
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/authentication/login'
  }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);
export default router;
