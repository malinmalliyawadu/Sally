const https = require('https');
const fs = require('fs');
const path = require('path');

// URL of a royalty-free New Zealand landscape image
// This is a placeholder URL for a Milford Sound image
const imageUrl = 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?q=80&w=1841&auto=format&fit=crop';
const outputPath = path.join(__dirname, '../assets/images/backgrounds/nz-landscape.jpg');

console.log('Downloading New Zealand landscape image...');

// Ensure the directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Download the image
https.get(imageUrl, (response) => {
  // Handle redirects
  if (response.statusCode === 302 || response.statusCode === 301) {
    console.log(`Redirecting to: ${response.headers.location}`);
    https.get(response.headers.location, handleResponse);
    return;
  }
  
  handleResponse(response);
});

function handleResponse(response) {
  if (response.statusCode !== 200) {
    console.error(`Failed to download image. Status code: ${response.statusCode}`);
    return;
  }
  
  const fileStream = fs.createWriteStream(outputPath);
  response.pipe(fileStream);
  
  fileStream.on('finish', () => {
    fileStream.close();
    console.log(`Image downloaded successfully to: ${outputPath}`);
  });
  
  fileStream.on('error', (err) => {
    console.error('Error writing file:', err);
  });
}