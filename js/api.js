export async function fetchPortfolioData() {
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase not loaded');
        throw new Error('Supabase client not initialized');
    }

    try {
        const [configRes, expRes, projRes, skillRes, achRes, eduRes] = await Promise.all([
            supabaseClient.from('config').select('*').eq('key', 'global').single(),
            supabaseClient.from('experience').select('*').order('date', { ascending: false }),
            supabaseClient.from('projects').select('*').order('created_at', { ascending: false }),
            supabaseClient.from('skills').select('*'),
            supabaseClient.from('achievements').select('*'),
            supabaseClient.from('education').select('*').order('start_year', { ascending: false })
        ]);

        return {
            config: configRes.data?.value,
            experience: expRes.data,
            projects: projRes.data,
            skills: skillRes.data,
            achievements: achRes.data,
            education: eduRes.data
        };
    } catch (err) {
        console.error("Error fetching data:", err);
        throw err;
    }
}


