// API Route OMMI - Ultra Sharp (HDR Enhancement)
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: 'Image data required' });
        }

        // Call Replicate API for HDR enhancement
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: '854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b', // Real-ESRGAN model
                input: {
                    image: imageData,
                    scale: 2,
                    face_enhance: true
                }
            })
        });

        const prediction = await response.json();

        if (!response.ok) {
            throw new Error(prediction.detail || 'Replicate API error');
        }

        // Wait for result
        let result = prediction;
        let attempts = 0;
        const maxAttempts = 60;

        while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await fetch(
                `https://api.replicate.com/v1/predictions/${prediction.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}`
                    }
                }
            );

            result = await statusResponse.json();
            attempts++;
        }

        if (result.status === 'failed') {
            throw new Error('HDR enhancement failed');
        }

        if (result.status !== 'succeeded') {
            throw new Error('HDR enhancement timeout');
        }

        return res.status(200).json({
            success: true,
            imageUrl: result.output
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
};
