// Vercel serverless function — runs on the server, never in the browser.
// The Anthropic API key lives only here (set as an environment variable in
// the Vercel project settings), so it's never exposed to visitors.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { department, pointText, comment } = req.body || {};
  if (!department || !pointText) {
    return res.status(400).json({ error: 'Missing department or pointText' });
  }

  const system = `Tu es un expert en audit qualité pour hôtels et restaurants. À partir d'un point de contrôle jugé non conforme, réponds UNIQUEMENT avec un objet JSON valide (sans texte autour, sans balises markdown) contenant exactement ces clés : "cause_probable" (string, 1-2 phrases), "risques" (array de 2 à 3 strings courtes), "preconisation" (string, 1-2 phrases actionnables), "priorite" (une valeur parmi "Haute", "Moyenne", "Basse"), "responsable" (string, poste responsable de l'action), "delai" (string, ex: "48h", "1 semaine"), "budget_estimatif" (string, ex: "0-100€", "500-1000€").`;
  const userMsg = `Département : ${department}\nPoint de contrôle non conforme : ${pointText}\nCommentaire de l'auditeur : ${comment || 'Aucun commentaire'}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'Anthropic API error', details: errText });
    }

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Analysis failed', details: String(err) });
  }
}
