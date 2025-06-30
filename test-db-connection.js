const { Client } = require('pg');

// Database connection configuration
const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'url_shortener'
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL database!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('Current database time:', result.rows[0].now);
    
    // Check if users table exists
    try {
      const tableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user'
        );
      `);
      console.log('Users table exists:', tableResult.rows[0].exists);
    } catch (tableError) {
      console.error('Error checking users table:', tableError.message);
    }
    
    await client.end();
  } catch (error) {
    console.error('Database connection error:', error.message);
  }
}

testConnection();
