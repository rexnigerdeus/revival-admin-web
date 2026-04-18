import { createClient } from '@supabase/supabase-js';

// Initialisation du client Supabase avec les super-droits d'Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 0; // Pas de cache, données toujours en direct

export default async function AdminDashboard() {
  // 1. Récupérer TOUS les utilisateurs depuis Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    perPage: 1000 // Ajustez si vous dépassez 1000 inscrits
  });

  // 2. Récupérer les requêtes de prière
  const { data: requests, error: requestsError } = await supabase
    .from('prayer_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (authError || requestsError) {
    return <div className="p-10 text-red-500">Erreur de chargement des données.</div>;
  }

  // 3. Traiter et décoder les utilisateurs
  const users = authData.users.map((u) => {
    // On extrait le téléphone en retirant '@revival.culture' de l'email
    const phone = u.email?.replace('@revival.culture', '') || 'Inconnu';
    // On récupère le nom depuis les métadonnées
    const name = u.user_metadata?.full_name || u.user_metadata?.name || u.user_metadata?.display_name || 'Anonyme';
    
    return {
      id: u.id,
      name,
      phone,
      joinedAt: new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastSignIn: u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais'
    };
  });

  // 4. Lier les utilisateurs à leurs requêtes de prière
  const enrichedRequests = requests?.map(req => {
    const user = users.find(u => u.id === req.user_id);
    return { ...req, user };
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="border-b border-gray-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">RC Studio</h1>
            <p className="text-gray-400 mt-1">Dashboard d'urgence Vercel</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#4cd964]">{users.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Inscrits Totaux</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* COLONNE GAUCHE : REQUÊTES DE PRIÈRE */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              🙏 Requêtes de Prière ({enrichedRequests?.length || 0})
            </h2>
            <div className="space-y-4">
              {enrichedRequests?.map((req) => (
                <div key={req.id} className="bg-[#121212] border border-gray-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-medium text-white">{req.user?.name || "Anonyme"}</h3>
                      <p className="text-sm text-gray-400 font-mono">{req.user?.phone || req.email}</p>
                    </div>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                      {new Date(req.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 italic text-sm leading-relaxed bg-[#1a1a1a] p-3 rounded-lg border border-gray-800/50">
                    "{req.request_text}"
                  </p>
                  
                  <div className="mt-3 pt-3 border-t border-gray-800/50">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${req.is_fulfilled ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-amber-900/30 text-amber-400 border border-amber-800/50'}`}>
                      {req.is_fulfilled ? '✓ Exaucée' : '⏳ En attente'}
                    </span>
                  </div>
                </div>
              ))}
              {enrichedRequests?.length === 0 && <p className="text-gray-500 text-sm">Aucune requête.</p>}
            </div>
          </section>

          {/* COLONNE DROITE : LISTE DES UTILISATEURS */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              👥 Utilisateurs Inscrits
            </h2>
            <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nom & Téléphone</th>
                      <th className="px-4 py-3 font-medium">Inscription</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="font-mono text-xs text-gray-500">{user.phone}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {user.joinedAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}