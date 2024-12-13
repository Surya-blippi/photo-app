// pages/api/predict.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      console.log('Prediction request body:', req.body); // Debug log
  
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
        const errorText = await response.text(); // Get raw response text
        console.error('Prediction API error response:', errorText); // Debug log
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Prediction request failed');
        } catch (e) {
          throw new Error('Invalid response from prediction API');
        }
      }
  
      let prediction;
      try {
        prediction = await response.json();
        console.log("Initial prediction response:", prediction); // Debug log
      } catch (e) {
        console.error('Failed to parse initial response:', e);
        throw new Error('Invalid JSON in prediction response');
      }
  
      // Poll for results
      let result = prediction;
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes timeout
  
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
          const pollErrorText = await pollResponse.text();
          console.error('Polling error response:', pollErrorText); // Debug log
          throw new Error('Failed to poll for results');
        }
        
        try {
          result = await pollResponse.json();
          console.log("Polling status:", result.status, "Attempt:", attempts); // Debug log
        } catch (e) {
          console.error('Failed to parse polling response:', e);
          throw new Error('Invalid JSON in polling response');
        }
      }
  
      if (attempts >= maxAttempts) {
        throw new Error('Generation timed out');
      }
  
      if (result.status === "failed") {
        throw new Error(result.error || "Generation failed");
      }
  
      if (!result.output) {
        throw new Error('No output received from generation');
      }
  
      console.log("Final successful result:", result); // Debug log
      res.status(200).json(result.output);
  
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
  }