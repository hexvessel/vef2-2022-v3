import bcrypt from 'bcrypt';
import { query } from './db.js';

export async function comparePasswords(password, hash) {
  const result = await bcrypt.compare(password, hash);

  return result;
}

export async function createUser({ name, username, password } = {}) {
  const hashedPassword = await bcrypt.hash(password, 11);

  const q = `
    INSERT INTO 
        users (name,username,password)
    VALUES ($1, $2, $3)
    RETURNING *
    `;
  try {
    const result = await query(q, [name, username, hashedPassword]);
    return result.rows[0];
  } catch (e) {
    console.error('Gat ekki búið til notanda');
  }
  return null;
}
