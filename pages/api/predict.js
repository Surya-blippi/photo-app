// pages/api/predict.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const input = {
        ...req.body,
        main_face_image: new URL(req.body.main_face_image).toString() // Ensure valid URL
      };
  
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b",
          input
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Prediction request failed:', errorData);
        throw new Error(errorData.error || 'Prediction request failed');
      }
  
      const prediction = await response.json();
      console.log("Initial prediction:", prediction);
  
      // Poll for results
      let result = prediction;
      let attempts = 0;
      const maxAttempts = 120;
  
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
          throw new Error(`Polling failed: ${pollResponse.statusText}`);
        }
        
        result = await pollResponse.json();
        console.log("Polling status:", result.status);
      }
  
      if (result.status === "failed") {
        throw new Error(result.error || "Prediction failed");
      }
  
      if (!result.output) {
        throw new Error("No output generated");
      }
  
      // Ensure all output URLs are valid
      const validUrls = result.output.map(url => new URL(url).toString());
      
      res.status(200).json(validUrls);
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({ error: error.message });
    }
  }