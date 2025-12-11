import 'dotenv/config';
import express from 'express';
import path from 'path';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import methodOverride from 'method-override';
import flash from 'connect-flash';
import { fileURLToPath } from 'url';
import passport from './passport-setup.js';
import { poolClient } from './database.js';


// routes
import indexRoutes from './routes/index.js';
import authRoutes from './routes/authentication.js';
import topicsRoutes from './routes/topics.js';
import apiRoutes from './routes/api.js';
import studyLogsRoutes from "./routes/studyLogs.js";
import { error } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PgSession = connectPgSimple(session);

const app = express();

const PORT = process.env.PORT || 3000;


//view engine:
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//middlewares:
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));



app.use(
  session({
    store: new PgSession({  //for PostgreSQl 
      pool: poolClient,
      tableName: 'session'
    }),

    /* 
     Secret string used to sign the session cookie
    */
    secret: process.env.SESSION_SECRET || 'jus-sth',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 15 * 24 * 60 * 60 * 1000 }
  })
);




/*
It sets up Passport to handle strategies (like Google OAuth).
Key point: Without this, Passport won’t process login requests.
*/
app.use(passport.initialize());

app.use(passport.session());


app.use(flash());

app.use((req, res, next) => {

  res.locals.currentUser = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});



//mount routes:
app.use('/', indexRoutes);
app.use('/authentication', authRoutes);
app.use('/topics', topicsRoutes);
app.use('/api', apiRoutes);
app.use('/study-logs', studyLogsRoutes);



app.use((req, res) => res.status(404).render('index', { title: 'Not found' }));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});


app.listen(PORT, () => {
  console.log(`Web App running at http://localhost:${PORT}`);
});