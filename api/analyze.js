module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { scenario } = req.body;
  if (!scenario) return res.status(400).json({ error: 'Scenario is required' });

  const SYSTEM_PROMPT = `You are an expert analyst at the intersection of social psychology, cognitive science, behavioral science, and social science, with a strong focus on empathy, prosocial behavior, social cooperation, and social cognition. Analyze the given real-world scenario through these lenses.

Return ONLY a valid JSON object with this exact structure — no markdown, no preamble, no backticks:
{"dynamics":[{"insight":"Specific plain-language description of an empathic, cooperative, or cognitive dynamic at play in this scenario","discipline":"Behavioral Science","framework_name":"Theory or concept name","framework_explanation":"1-2 sentences explaining the theory accessibly for a non-expert"}],"barriers":[{"insight":"Specific plain-language explanation of why prosocial or cooperative behavior breaks down or fails to emerge","discipline":"Cognitive Science","framework_name":"Theory or concept name","framework_explanation":"1-2 sentences explaining accessibly"}],"levers":[{"insight":"Specific evidence-based recommendation grounded in empathy research, cooperation science, or prosocial psychology","discipline":"Social Psychology","framework_name":"Theory or concept name","framework_explanation":"1-2 sentences explaining accessibly"}]}

Prioritize concepts from: empathy (cognitive vs affective empathy, perspective-taking, empathy gaps, compassion fatigue), prosocial behavior (altruism, bystander effect, moral licensing, identifiable victim effect, warm glow giving), social cooperation (collective action problems, public goods dilemmas, reciprocity norms, trust and reputation, tit-for-tat dynamics), social cognition (theory of mind, attribution errors, in-group/out-group bias, social identity theory, stereotype threat, intergroup contact theory).

Each section must contain 2-3 items. The discipline field must be exactly one of: Behavioral Science, Cognitive Science, Social Psychology, Social Science. Mix disciplines across all three sections. Insights must be specific to the scenario. Framework explanations must be accessible to a general audience.`;

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
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: scenario }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });

    const rawText = data.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
}
