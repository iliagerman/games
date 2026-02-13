const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || process.argv.find(arg => arg.startsWith('--api-key='))?.split('=')[1];
const PROMPT = process.argv.find(arg => arg.startsWith('--prompt='))?.split('=')[1];
const FILENAME = process.argv.find(arg => arg.startsWith('--filename='))?.split('=')[1];
const RESOLUTION = process.argv.find(arg => arg.startsWith('--resolution='))?.split('=')[1] || '1K';

if (!API_KEY) {
    console.error('Error: API key is required. Pass it via --api-key=YOUR_KEY or set GEMINI_API_KEY env var.');
    process.exit(1);
}

if (!PROMPT || !FILENAME) {
    console.error('Usage: node generate_image.js --api-key=KEY --prompt="Description" --filename="output.png" [--resolution=1K]');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`;

const payload = {
    contents: [
        {
            parts: [
                { text: PROMPT }
            ]
        }
    ],
    generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: {
            imageSize: RESOLUTION
        }
    }
};

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log(`Generating image...`);
console.log(`Prompt: ${PROMPT}`);
console.log(`Resolution: ${RESOLUTION}`);

const req = https.request(url, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`API Error: ${res.statusCode} - ${data}`);
            process.exit(1);
        }

        try {
            const response = JSON.parse(data);
            if (!response.candidates || !response.candidates[0].content || !response.candidates[0].content.parts) {
                console.error('Unexpected response structure:', JSON.stringify(response, null, 2));
                process.exit(1);
            }

            const parts = response.candidates[0].content.parts;
            let imageSaved = false;

            for (const part of parts) {
                if (part.inline_data) {
                    const base64Data = part.inline_data.data;
                    const buffer = Buffer.from(base64Data, 'base64');

                    // Create directory if it doesn't exist
                    const dir = path.dirname(FILENAME);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    fs.writeFileSync(FILENAME, buffer);
                    console.log(`Image saved to ${FILENAME}`);
                    console.log(`Full path: ${path.resolve(FILENAME)}`);
                    imageSaved = true;
                    break;
                }
            }

            if (!imageSaved) {
                console.error('No image found in response.');
            }

        } catch (e) {
            console.error('Error parsing response:', e);
            console.error('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.write(JSON.stringify(payload));
req.end();
