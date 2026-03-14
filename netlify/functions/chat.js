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

  const body = event.body;

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: data
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ content: [{ type: 'text', text: "Taking a moment to think — please send your message again! 💕" }] })
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ content: [{ type: 'text', text: "Connection hiccup — please try again! 💕" }] })
      });
    });

    req.write(body);
    req.end();
  });
};
