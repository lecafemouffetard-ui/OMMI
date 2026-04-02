// API Route pour OMMI - Génération Home Staging
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS headers
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
        const { imageData, style, roomType } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: 'Image data required' });
        }

        // Prompts pour chaque style
        const prompts = {
            'moderne': 'modern interior design, minimalist, clean lines, neutral colors',
            'scandinave': 'scandinavian interior design, light wood, white walls, cozy',
            'industriel': 'industrial loft interior, exposed brick, metal, concrete',
            'luxe': 'luxury interior design, elegant, high-end furniture, marble',
            'boheme': 'bohemian interior design, colorful, plants, eclectic',
            'minimaliste': 'minimalist interior design, simple, clean, functional'
        };

        const roomTypes = {
            'salon': 'living room',
            'chambre': 'bedroom',
            'cuisine': 'kitchen',
            'sdb': 'bathroom',
            'bureau': 'office'
        };

        const prompt = `${roomTypes[roomType] || 'room'}, ${prompts[style] || prompts.moderne}, furnished, professional interior photography, 8k, high quality`;

        // Appel API Replicate
        const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
                input: {
                    image: imageData,
                    prompt: prompt,
                    negative_prompt: 'empty room, unfurnished, low quality, blurry, distorted',
                    num_inference_steps: 30,
                    guidance_scale: 7.5
                }
            })
        });

        const prediction = await replicateResponse.json();

        if (!replicateResponse.ok) {
            throw new Error(prediction.detail || 'Replicate API error');
        }

        // Attendre le résultat
        let result = prediction;
        let attempts = 0;
        const maxAttempts = 60;

        while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));

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
            throw new Error('Generation failed: ' + (result.error || 'Unknown error'));
        }

        if (result.status !== 'succeeded') {
            throw new Error('Generation timeout');
        }

        // Retourner le résultat
        return res.status(200).json({
            success: true,
            imageUrl: result.output[0] || result.output
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
};
