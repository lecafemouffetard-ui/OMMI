// ============================================
// OMMI BACKEND - API Server
// Node.js + Express + Supabase + Stripe + APIs IA
// ============================================

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURATION
// ============================================

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer pour upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Stripe Client
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// ============================================
// CONFIGURATION DES APIs IA
// ============================================

const AI_APIS = {
    // Image to Video (choix multiple)
    imageToVideo: {
        haiper: {
            endpoint: 'https://api.haiper.ai/v1/video/create',
            apiKey: process.env.HAIPER_API_KEY,
            cost: 0, // Gratuit
            quality: 'medium'
        },
        kling: {
            endpoint: 'https://api.klingai.com/v1/videos/image2video',
            apiKey: process.env.KLING_API_KEY,
            cost: 0.10, // €0.10 par vidéo
            quality: 'high'
        },
        luma: {
            endpoint: 'https://api.lumalabs.ai/dream-machine/v1/generations',
            apiKey: process.env.LUMA_API_KEY,
            cost: 0.08,
            quality: 'high'
        }
    },
    
    // Home Staging
    homeStaging: {
        replicate: {
            endpoint: 'https://api.replicate.com/v1/predictions',
            apiKey: process.env.REPLICATE_API_KEY,
            model: 'stability-ai/sdxl:latest',
            cost: 0.01
        }
    }
};

// ============================================
// ROUTES - AUTHENTIFICATION
// ============================================

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        // Créer le profil utilisateur avec crédits gratuits
        await supabase.from('profiles').insert({
            user_id: data.user.id,
            email: email,
            credits: 50,
            plan: 'free'
        });

        res.json({ success: true, user: data.user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        res.json({ success: true, user: data.user, session: data.session });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ============================================
// ROUTES - IMAGE TO VIDEO
// ============================================

app.post('/api/generate/image-to-video', upload.single('image'), async (req, res) => {
    try {
        const userId = req.headers.authorization; // Token JWT
        const { motionType, duration, speed, format } = req.body;
        const imageFile = req.file;

        // 1. Vérifier les crédits
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('user_id', userId)
            .single();

        if (profile.credits < 5) {
            return res.status(402).json({ 
                error: 'Crédits insuffisants',
                credits: profile.credits 
            });
        }

        // 2. Upload image sur Supabase Storage
        const fileName = `${userId}/${Date.now()}.${imageFile.mimetype.split('/')[1]}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(fileName, imageFile.buffer, {
                contentType: imageFile.mimetype
            });

        if (uploadError) throw uploadError;

        // 3. Obtenir URL publique
        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        // 4. Appeler API IA (Haiper gratuit pour MVP)
        const aiResponse = await generateVideoWithHaiper({
            imageUrl: publicUrl,
            motionType,
            duration,
            speed
        });

        // 5. Déduire les crédits
        await supabase
            .from('profiles')
            .update({ credits: profile.credits - 5 })
            .eq('user_id', userId);

        // 6. Sauvegarder dans l'historique
        await supabase.from('generations').insert({
            user_id: userId,
            type: 'image-to-video',
            input_url: publicUrl,
            output_url: aiResponse.videoUrl,
            credits_used: 5,
            settings: { motionType, duration, speed, format }
        });

        res.json({
            success: true,
            videoUrl: aiResponse.videoUrl,
            credits: profile.credits - 5
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROUTES - HOME STAGING
// ============================================

app.post('/api/generate/home-staging', upload.single('image'), async (req, res) => {
    try {
        const userId = req.headers.authorization;
        const { style, roomType } = req.body;
        const imageFile = req.file;

        // Vérifier crédits
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('user_id', userId)
            .single();

        if (profile.credits < 3) {
            return res.status(402).json({ 
                error: 'Crédits insuffisants',
                credits: profile.credits 
            });
        }

        // Upload image
        const fileName = `${userId}/${Date.now()}.${imageFile.mimetype.split('/')[1]}`;
        await supabase.storage
            .from('uploads')
            .upload(fileName, imageFile.buffer);

        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        // Appeler Replicate API pour home staging
        const stagedImage = await generateHomeStagingWithReplicate({
            imageUrl: publicUrl,
            style,
            roomType
        });

        // Déduire crédits
        await supabase
            .from('profiles')
            .update({ credits: profile.credits - 3 })
            .eq('user_id', userId);

        // Sauvegarder
        await supabase.from('generations').insert({
            user_id: userId,
            type: 'home-staging',
            input_url: publicUrl,
            output_url: stagedImage.url,
            credits_used: 3,
            settings: { style, roomType }
        });

        res.json({
            success: true,
            imageUrl: stagedImage.url,
            credits: profile.credits - 3
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROUTES - VIDEO MAKER
// ============================================

app.post('/api/generate/video-maker', upload.array('images', 20), async (req, res) => {
    try {
        const userId = req.headers.authorization;
        const { musicStyle, transitionType, photoDuration, format } = req.body;
        const imageFiles = req.files;

        // Vérifier crédits
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('user_id', userId)
            .single();

        if (profile.credits < 10) {
            return res.status(402).json({ 
                error: 'Crédits insuffisants',
                credits: profile.credits 
            });
        }

        // Upload toutes les images
        const imageUrls = await Promise.all(
            imageFiles.map(async (file) => {
                const fileName = `${userId}/${Date.now()}-${Math.random()}.jpg`;
                await supabase.storage
                    .from('uploads')
                    .upload(fileName, file.buffer);

                const { data: { publicUrl } } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);

                return publicUrl;
            })
        );

        // Générer vidéo avec transitions et musique
        const video = await generateMusicVideoWithFFmpeg({
            images: imageUrls,
            musicStyle,
            transitionType,
            photoDuration,
            format
        });

        // Déduire crédits
        await supabase
            .from('profiles')
            .update({ credits: profile.credits - 10 })
            .eq('user_id', userId);

        // Sauvegarder
        await supabase.from('generations').insert({
            user_id: userId,
            type: 'video-maker',
            input_url: imageUrls[0],
            output_url: video.url,
            credits_used: 10,
            settings: { musicStyle, transitionType, photoDuration, format, imageCount: imageUrls.length }
        });

        res.json({
            success: true,
            videoUrl: video.url,
            credits: profile.credits - 10
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// FONCTIONS GÉNÉRATION IA
// ============================================

async function generateVideoWithHaiper(params) {
    const { imageUrl, motionType, duration, speed } = params;
    
    // Appel API Haiper (gratuit)
    try {
        const response = await axios.post(
            AI_APIS.imageToVideo.haiper.endpoint,
            {
                image_url: imageUrl,
                motion_preset: motionType,
                duration: duration,
                speed: speed
            },
            {
                headers: {
                    'Authorization': `Bearer ${AI_APIS.imageToVideo.haiper.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Attendre que la vidéo soit prête
        let videoReady = false;
        let videoUrl = null;
        let attempts = 0;

        while (!videoReady && attempts < 60) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusResponse = await axios.get(
                `${AI_APIS.imageToVideo.haiper.endpoint}/${response.data.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${AI_APIS.imageToVideo.haiper.apiKey}`
                    }
                }
            );

            if (statusResponse.data.status === 'completed') {
                videoReady = true;
                videoUrl = statusResponse.data.video_url;
            }
            
            attempts++;
        }

        return { videoUrl };

    } catch (error) {
        console.error('Haiper API Error:', error);
        throw new Error('Erreur lors de la génération vidéo');
    }
}

async function generateHomeStagingWithReplicate(params) {
    const { imageUrl, style, roomType } = params;
    
    const prompt = `Interior design, ${roomType}, ${style} style, furnished, modern, professional photography, high quality, 8k`;
    
    try {
        const response = await axios.post(
            AI_APIS.homeStaging.replicate.endpoint,
            {
                version: 'stability-ai/sdxl:latest',
                input: {
                    image: imageUrl,
                    prompt: prompt,
                    negative_prompt: 'empty, unfurnished, low quality, blurry'
                }
            },
            {
                headers: {
                    'Authorization': `Token ${AI_APIS.homeStaging.replicate.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Attendre résultat
        let ready = false;
        let outputUrl = null;
        let attempts = 0;

        while (!ready && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusResponse = await axios.get(
                `${AI_APIS.homeStaging.replicate.endpoint}/${response.data.id}`,
                {
                    headers: {
                        'Authorization': `Token ${AI_APIS.homeStaging.replicate.apiKey}`
                    }
                }
            );

            if (statusResponse.data.status === 'succeeded') {
                ready = true;
                outputUrl = statusResponse.data.output[0];
            }
            
            attempts++;
        }

        return { url: outputUrl };

    } catch (error) {
        console.error('Replicate API Error:', error);
        throw new Error('Erreur lors du home staging');
    }
}

async function generateMusicVideoWithFFmpeg(params) {
    // Cette fonction utiliserait FFmpeg pour créer la vidéo
    // Pour l'instant, retour simulé
    return {
        url: 'https://example.com/video.mp4'
    };
}

// ============================================
// ROUTES - STRIPE PAYMENTS
// ============================================

app.post('/api/payment/create-checkout', async (req, res) => {
    try {
        const { plan, userId } = req.body;

        const prices = {
            pro: 'price_xxx', // ID prix Stripe pour Pro
            agency: 'price_yyy' // ID prix Stripe pour Agency
        };

        const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: prices[plan],
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing`,
            client_reference_id: userId,
        });

        res.json({ sessionId: session.id });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook Stripe
app.post('/api/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    let event;
    
    try {
        event = stripeClient.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer l'événement
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Mettre à jour le plan de l'utilisateur
        await supabase
            .from('profiles')
            .update({ 
                plan: 'pro', // ou 'agency'
                credits: 500, // Crédits du plan Pro
                stripe_customer_id: session.customer
            })
            .eq('user_id', session.client_reference_id);
    }

    res.json({received: true});
});

// ============================================
// ROUTES - UTILISATEUR
// ============================================

app.get('/api/user/profile', async (req, res) => {
    try {
        const userId = req.headers.authorization;
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/user/generations', async (req, res) => {
    try {
        const userId = req.headers.authorization;
        
        const { data, error } = await supabase
            .from('generations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'OMMI API' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 OMMI API Server running on port ${PORT}`);
});