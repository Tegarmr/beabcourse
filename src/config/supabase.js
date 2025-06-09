require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

// Testing Supabase connection
supabase
  .from('users')
  .select('*')
  .then(response => {
    if (response.error) {
      console.error('Supabase connection error:', response.error);
    } else {
      console.log('Supabase connection successful:', response.data);
    }
  });

module.exports = supabase;
