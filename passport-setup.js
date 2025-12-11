import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { query as dbQuery } from './database.js';
import dotenv from 'dotenv';

dotenv.config();

/*
passport.serializeUser() → decides what to store in the session (user ID)
passport.deserializeUser() → uses the stored ID to fetch full user info on every request
done() is a callback function provided by Passport to indicate that  the authentication step (or user serialization/deserialization) is finished.
*/

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await dbQuery('SELECT * FROM users WHERE id = $1',
            [id]);

        done(null, rows[0] || null);

    }


    catch (err) {
        done(err);
    }
});


passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL


        },


        // This following is an async callback function used by Passport’s Google strategy. It runs after Google has authenticated the user.
        // accessToken ->→ Token you can use to call Google APIs on behalf of the user. Provided by Google when a user logs in.
        // refreshToken ->→ Token to refresh accessToken when it expires. Also from Google, to refresh the access token.
        // profile ->→It’s an object sent by Google that contains the user’s information. It is Google’s profile info for the user (id, email, name, etc.). Google’s user info, returned by the Google OAuth API.
        // done ->→ Callback function you call when you finish processing the user (success or failure). Provided by Passport.js, used to tell it “we’re done processing the user”

        async (accessToken, refreshToken, profile, done) => {

            try {
                const googleId = profile.id;
                
              // “If profile.emails exists, get the first one’s value. Otherwise, return undefined.”           
            
                const email = profile.emails?.[0]?.value;
                //“Use Google’s display name. If it doesn't exist, use the email instead
                const displayName = profile.displayName || email;

                //find user by google_id or email:
                const { rows } = await dbQuery('SELECT * FROM users WHERE google_id = $1 OR email =$2',
                    [googleId, email]
                );
                //if user exists
                if (rows[0]) {
                    const existing = rows[0];
                    //if user  doesnt have his/her google account stored in DB, then add it
                    if (!existing.google_id) { //becareful here google_id is from DB
                        await dbQuery('UPDATE users SET google_id = $1 WHERE id = $2',
                            [googleId, existing.id]
                        )
                    }
                    return done(null, existing) //“There was no error, and this is the user who should be logged in.”
                }

                //else create a new user:
                const newUser = await dbQuery(
                    'INSERT into users(email, username, google_id) VALUES ($1, $2, $3) RETURNING *', 
                    [email,displayName,googleId]
                );
                return done(null, newUser.rows[0]);
            }
            catch (err) {
                return done(err);

            }
        }

    )


);


export default passport;