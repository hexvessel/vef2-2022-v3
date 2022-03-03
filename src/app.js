/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import pg from 'pg';
import { findById } from './lib/db.js';
import { eventRouter } from './routes/event-routes.js';
import { usersRouter } from './routes/user-routes.js';

dotenv.config();

const app = express();
app.use(express.json());

const {
  PORT: port = 3000,
  DATABASE_URL: connectionString = '',
  JWT_SECRET: jwtSecret,
} = process.env;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

const pool = new pg.Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function strat(data, next) {
  const user = await findById(data.id);

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
}

passport.use(new Strategy(jwtOptions, strat));
app.use(passport.initialize());


// Skilum beint úr lambda falli svo engir { }
app.get('/', async (req, res) => res.json({
  users: '/users',
  login: '/users/login',
  register: '/users/register',
  me: '/users/me',
  events: '/events',
}));

app.use('/events', eventRouter);
app.use('/users', usersRouter);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});