import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mbeftedcgdzesmqwfgdo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZWZ0ZWRjZ2R6ZXNtcXdmZ2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDczMzIsImV4cCI6MjA4OTM4MzMzMn0.23PTgkmPF53u3JlZS_ychPgL2D2zUXKNKEocd9K-06w";

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
