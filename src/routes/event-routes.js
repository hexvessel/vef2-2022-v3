/* eslint-disable no-param-reassign */

import express from 'express';
import { requireAuthentication } from '../lib/auth.js';
import { catchErrors } from '../lib/catch-errors.js';
import { createEvent, deleteEvent, deleteReg, listEvent, listRegistered, query, register, updateEvent } from '../lib/db.js';
import {
    registrationValidationMiddleware, sanitizationMiddleware, validationCheck, xssSanitizationMiddleware
} from '../lib/sanitation-validation.js';
import { slugify } from '../lib/slugify.js';

export const eventRouter = express.Router();


async function getEventsRoute(req, res) {
    const events = await query(`
    SELECT id, name, slug from events`);

    const eventsWithLinks = events.rows.map((event) => {
        event.links = {
            self: `/events/${event.slug}`,
        };
        return event;
    });

    return res.json(eventsWithLinks);
}

async function postEventRoute(req, res) {
    const { name, description } = req.body;
    const slug = slugify(name);
    const created = await createEvent({ name, slug, description });

    if (created) {
        res.status(201).json('Event created');
    }
}

async function getEventRoute(req, res) {
    const event = await query(
        `
    SELECT id,name,description FROM events WHERE slug = $1;
  `,
        [req.params.id]
    );
    const registered = await listRegistered(event.rows[0].id);
    const regLink = { register: `/events/${req.params.id}/register` };
    return res.json([event.rows, regLink, registered]);
}

async function postRegRoute(req, res) {
    const { comment } = req.body;
    const { slug } = req.params;
    const { name } = req.user;
    const event = await listEvent(slug);
    const registered = await register({ name, comment, event: event.id });
    if (registered) {
        res.status(201).json({ success: 'Skráning móttekin' });
    } else {
        res.status(400).json({ error: 'Villa' });
    }

}

async function patchEventRoute(req, res) {
    const { name, description } = req.body;
    const { id } = req.params;

    const event = await listEvent(id);

    const newSlug = slugify(name);

    const updated = await updateEvent(event.id, {
        name,
        slug: newSlug,
        description,
    });

    if (updated) {
        return res.status(200).send('uppfært');
    }

    return res.status(400).send('Villa');
}

async function deleteEventRoute(req, res) {
    const { id } = req.params;
    const event = await listEvent(id);
    const deleted = await deleteEvent(event.id);
    if (deleted) {
        return res.status(200).send('Viðburði eytt');
    }
    return res.status(400).send('Villa');
}

async function deleteEventRegRoute(req, res) {
    const { name } = req.user;
    const slug = req.params.id;

    const event = await listEvent(slug);


    const deleted = await deleteReg(name, event.id);
    if (deleted) {
        return res.status(200).send('Skráningu eytt');
    }
    return res.status(400).send('Villa');
}

eventRouter.get('/', catchErrors(getEventsRoute));
eventRouter.post('/', requireAuthentication, registrationValidationMiddleware('description'),
    xssSanitizationMiddleware('description'),
    catchErrors(validationCheck),
    sanitizationMiddleware('description'), catchErrors(postEventRoute));
eventRouter.get('/:id', catchErrors(getEventRoute));
eventRouter.post('/:slug/register',
    requireAuthentication,
    registrationValidationMiddleware('comment'),
    catchErrors(validationCheck),
    xssSanitizationMiddleware('comment'),
    catchErrors(postRegRoute));
eventRouter.patch('/:id', requireAuthentication, catchErrors(patchEventRoute));
eventRouter.delete('/:id', requireAuthentication, catchErrors(deleteEventRoute));
eventRouter.delete('/:id/register', requireAuthentication, catchErrors(deleteEventRegRoute));