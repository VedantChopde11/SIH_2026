const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Sync user from Clerk to local database
router.post('/sync', async (req, res) => {
  const clerk_user_id = req.auth.userId;
  if (!clerk_user_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE id = $1', [clerk_user_id]);
    
    if (existingUser.rows.length === 0) {
      // User doesn't exist locally, fetch from Clerk API
      const user = await clerkClient.users.getUser(clerk_user_id);
      
      const email = user.emailAddresses[0]?.emailAddress || '';
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';

      await db.query(
        'INSERT INTO users (id, email, first_name, last_name) VALUES ($1, $2, $3, $4)',
        [clerk_user_id, email, firstName, lastName]
      );
      
      return res.json({ message: 'User synced successfully', new: true });
    }
    
    res.json({ message: 'User already exists', new: false });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
