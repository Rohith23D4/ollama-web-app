const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static web page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Process AI requests
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await axios.post('http://127.0.0.1:11434/api/generate', {
            model: 'llama3',
            prompt: prompt,
            stream: false
        });
        res.json({ response: response.data.response });
    } catch (error) {
        res.status(500).json({ error: 'Model execution failed. Ensure Ollama is running.' });
    }
});

app.listen(3000, () => console.log('App running on http://localhost:3000'));
