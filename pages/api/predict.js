// pages/api/predict.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      console.log('Making prediction request with input:', req.body);
      
      // Initial prediction request
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b",
          input: {
            ...req.body,
            output_format: "webp"  // Force webp format as it's known to work
          },
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Prediction request failed:', errorData);
        throw new Error(`Prediction request failed: ${errorData.error || response.statusText}`);
      }
  
      const prediction = await response.json();
      console.log("Initial prediction response:", prediction);
  
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
          const errorData = await pollResponse.json();
          console.error('Polling failed:', errorData);
          throw new Error(`Polling failed: ${errorData.error || pollResponse.statusText}`);
        }
        
        result = await pollResponse.json();
        console.log("Polling status:", result.status, "Attempt:", attempts);
        
        // Log detailed information if there's an error
        if (result.error) {
          console.error('Prediction error details:', result.error);
        }
      }
  
      if (result.status === "failed") {
        console.error('Prediction failed:', result);
        throw new Error(result.error || "Prediction failed - please try again");
      }
  
      if (attempts >= maxAttempts) {
        throw new Error("Prediction timed out - please try again");
      }
  
      if (!result.output) {
        console.error('No output in result:', result);
        throw new Error("No output generated - please try again");
      }
  
      console.log("Final successful result:", result);
      res.status(200).json(result.output);
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({ error: error.message });
    }
  }