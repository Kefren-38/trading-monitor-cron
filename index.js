const cron = require('node-cron');
const fetch = require('node-fetch');

console.log('🚀 Trading Monitor démarré sur Railway');

// Cron job toutes les 1 minutes
cron.schedule('* * * * *', async () => {
    try {
        console.log('📡 Checking trading positions...');
        
        const response = await fetch('https://us-central1-buildtradeacademy.cloudfunctions.net/checkTradingPositions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ source: 'railway' })
        });
        
        const result = await response.text();
        console.log('✅ Response:', result);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
});

// Serveur minimal pour que Railway garde l'app active
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ 
        status: 'Trading Monitor Active', 
        timestamp: new Date(),
        nextCheck: 'Every 5 minutes'
    });
});

app.listen(port, () => {
    console.log(`🌐 Server running on port ${port}`);
});
