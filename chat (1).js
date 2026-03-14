const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const incoming = JSON.parse(event.body);
    
    // Convert Anthropic format to OpenAI format
    const messages = [];
    if (incoming.system) {
      messages.push({ role: 'system', content: incoming.system });
    }
    for (const msg of incoming.messages) {
      if (msg.content && typeof msg.content === 'string' && !msg.content.startsWith('__')) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    const openaiBody = JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1800,
      messages: messages
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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',
          'Content-Length': Buffer.byteLength(openaiBody)
        },
        timeout: 25000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            // Convert OpenAI response back to Anthropic format
            const text = parsed.choices?.[0]?.message?.content || 'Please try again 💕';
            resolve({
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                content: [{ type: 'text', text: text }]
              })
            });
          } catch(e) {
            resolve({
              statusCode: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ content: [{ type: 'text', text: 'Please try again 💕' }] })
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ content: [{ type: 'text', text: 'Taking a moment — please send your message again! 💕' }] })
        });
      });

      req.on('error', (err) => {
        resolve({
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ content: [{ type: 'text', text: 'Connection hiccup — please try again! 💕' }] })
        });
      });

      req.write(openaiBody);
      req.end();
    });
  } catch(e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ content: [{ type: 'text', text: 'Please try again 💕' }] })
    };
  }
};
