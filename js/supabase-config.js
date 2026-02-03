// Retrived from dashboard URL project ID: zvlbrzncdvuhoredfwav
const SUPABASE_URL = "https://zvlbrzncdvuhoredfwav.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2bGJyem5jZHZ1aG9yZWRmd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDUzMDgsImV4cCI6MjA4NTY4MTMwOH0.B1EZ7ggpSk2DsK0QVjlmw-Y9vswfvrRNt4UQAROgCr8";

// Initialize the client
// We use a different name to avoid conflict with the global 'supabase' library object
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
