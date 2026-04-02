// API Route OMMI - Area Intel (Neighborhood Intelligence)

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
        const { address, lat, lng } = req.body;

        if (!address && (!lat || !lng)) {
            return res.status(400).json({ error: 'Address or coordinates required' });
        }

        // Google Places API - Nearby Search
        const categories = [
            { type: 'school', icon: '🏫', label: 'Écoles' },
            { type: 'supermarket', icon: '🛒', label: 'Commerces' },
            { type: 'restaurant', icon: '🍽️', label: 'Restaurants' },
            { type: 'subway_station', icon: '🚇', label: 'Métro' },
            { type: 'park', icon: '🌳', label: 'Parcs' },
            { type: 'pharmacy', icon: '💊', label: 'Pharmacies' }
        ];

        const results = {};

        for (const category of categories) {
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=${category.type}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                results[category.type] = {
                    label: category.label,
                    icon: category.icon,
                    places: data.results.slice(0, 5).map(place => ({
                        name: place.name,
                        address: place.vicinity,
                        rating: place.rating,
                        distance: calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
                    }))
                };
            }
        }

        return res.status(200).json({
            success: true,
            location: { lat, lng, address },
            intelligence: results
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
};

// Calculate distance in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c;
    return Math.round(d);
}
