const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'url_shortener'
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('Querying users table...');
    const result = await client.query('SELECT * FROM "user"');
    console.log(`Found ${result.rows.length} users:`);
    console.log(JSON.stringify(result.rows, null, 2));
    
    console.log('Testing insert operation...');
    const insertResult = await client.query(
      'INSERT INTO "user" (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['testuser_script', 'testscript@example.com', 'hashedpassword123']
    );
    console.log('Insert successful, new user ID:', insertResult.rows[0].id);
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

testConnection();
