import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import { ExtractJwt } from 'passport-jwt';
import { requireAdmin, requireAuthentication } from '../lib/auth.js';
import { findByUsername, query } from '../lib/db.js';
import { comparePasswords, createUser } from '../lib/users.js';


dotenv.config();

const {
    JWT_SECRET: jwtSecret,
    TOKEN_LIFETIME: tokenLifetime = 2000,
} = process.env;

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
};

export const usersRouter = express.Router();

async function getUsersRouter(req, res) {
    const users = await query(`
    SELECT id, name, username, admin FROM users`);
    return res.json(users.rows);
}

async function getUserRouter(req, res) {
    if (req.params.id === 'me') {
        return res.status(200).send(req.user);
    }
    const user = await query(`
      SELECT * FROM users where id = ${req.params.id}`);
    return res.json(user.rows);
}

async function postUserRegisterRoute(req, res) {
    const { name, username, password } = req.body;
    const registered = await createUser({ name, username, password });
    if (registered) {
        return res.status(201).send('Skráð/ur');
    }
    return res.status(400).send('Villa');
}

async function postUserLoginRoute(req, res) {
    const { username, password } = req.body;

    const user = await findByUsername(username);

    if (!user) {
        return res.status(401).json({ error: 'Invalid Username/Password' });
    }

    const passwordIsCorrect = await comparePasswords(password, user.password);

    if (passwordIsCorrect) {
        const payload = { id: user.id };
        const tokenOptions = { expiresIn: tokenLifetime };
        const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
        return res.json({ token });
    }

    return res.status(401).json({ error: 'Invalid Username/Password' });
}

usersRouter.get('/', requireAdmin, getUsersRouter);
usersRouter.get('/:id', requireAuthentication, getUserRouter);
usersRouter.post('/register', postUserRegisterRoute);
usersRouter.post('/login', postUserLoginRoute);
