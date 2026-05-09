const express = require('express');
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: req.body.max_tokens || 1200,
        system: req.body.system,
        messages: req.body.messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic error:', JSON.stringify(errorData));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    console.log('Response content length:', data.content ? data.content.length : 0);
    res.json(data);
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/capture-lead', async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

const contactData = {
  firstName,
  lastName,
  email,
  phone,
  locationId: process.env.GHL_LOCATION_ID,
  source: 'Next Chapter Clarity Compass',
  tags: ['compass-lead']
};

    const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Version': '2021-07-28'
      },
      body: JSON.stringify(contactData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('GHL error:', JSON.stringify(data));
      return res.status(response.status).json(data);
    }

    console.log('Lead captured:', email);
    res.json({ success: true, contactId: data.contact?.id });

  } catch (err) {
    console.error('Lead capture error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 3000, () => console.log('Compass API running'));
