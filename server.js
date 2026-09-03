const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";

app.post('/api/chat', (req, res) => {
    const { prompt } = req.body;

    const postData = JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [{ role: "user", content: prompt }]
    });

    const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const request = https.request(options, (response) => {
        let body = '';

        response.on('data', (chunk) => {
            body += chunk;
        });

        response.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                if (response.statusCode === 200 && parsed.choices && parsed.choices[0]) {
                    const text = parsed.choices[0].message.content;
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.send(text);
                } else {
                    res.status(response.statusCode || 500).send(parsed.error?.message || "Groq API error.");
                }
            } catch (e) {
                res.status(500).send("Invalid response from AI provider.");
            }
        });
    });

    request.on('error', (error) => {
        res.status(500).send("Failed to connect to Groq API.");
    });

    request.write(postData);
    request.end();
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
