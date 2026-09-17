import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testFashnBase64() {
  const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // 1x1 transparent png
  
  const response = await fetch('https://api.fashn.ai/v1/run', {
    method: 'POST',
    headers: {
      'Authorization': \Bearer \\,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model_name: 'product-to-model',
      inputs: {
        product_image: base64Image,
        prompt: 'A highly detailed fashion photography shot of a person wearing a garment. High-end indoor studio.',
      }
    })
  });
  
  const text = await response.text();
  console.log('STATUS:', response.status);
  console.log('RESPONSE:', text);
}
testFashnBase64();
