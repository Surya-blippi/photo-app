// pages/api/predict.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: `Method ${req.method} Not Allowed. Only POST requests are accepted.` 
      });
    }
  
    try {
      // Log incoming request
      console.log('Starting prediction with body:', req.body);
  
      // Make the initial prediction request
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b",
          input: req.body,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Prediction API error:', errorText);
        return res.status(500).json({ error: 'Failed to start prediction' });
      }
  
      const prediction = await response.json();
      console.log("Initial prediction response:", prediction);
  
      // Poll for results
      let result = prediction;
      let attempts = 0;
      const maxAttempts = 180; // 3 minutes timeout
  
      while (result.status !== "succeeded" && result.status !== "failed" && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        const pollResponse = await fetch(
          `https://api.replicate.com/v1/predictions/${prediction.id}`,
          {
            headers: {
              Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
            },
          }
        );
        
        if (!pollResponse.ok) {
          console.error('Polling failed:', await pollResponse.text());
          throw new Error('Failed to check prediction status');
        }
        
        result = await pollResponse.json();
        console.log(`Polling attempt ${attempts}: ${result.status}`);
      }
  
      if (attempts >= maxAttempts) {
        throw new Error('Generation timed out after 3 minutes');
      }
  
      if (result.status === "failed") {
        console.error('Prediction failed:', result.error);
        throw new Error(result.error || 'Generation failed');
      }
  
      if (!result.output || !Array.isArray(result.output)) {
        console.error('Invalid output format:', result.output);
        throw new Error('Invalid output format received');
      }
  
      console.log('Prediction completed successfully');
      res.status(200).json(result.output);
  
    } catch (error) {
      console.error('Prediction handler error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }