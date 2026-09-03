const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";

app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API returned status ${response.status}`);
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.includes('[DONE]')) continue;
                if (line.startsWith('data: ')) {
                    try {
                        const parsed = JSON.parse(line.replace('data: ', ''));
                        const text = parsed.choices[0]?.delta?.content || '';
                        if (text) res.write(text);
                    } catch (e) {
                        // ignore chunk parse errors
                    }
                }
            }
        }
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch response from AI model." });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
