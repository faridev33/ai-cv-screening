// Helper untuk menambah akumulasi token realtime
export const addTokenUsage = (promptTokens = 0, completionTokens = 0) => {
  if (!promptTokens && !completionTokens) return;

  const currentStats = JSON.parse(
    localStorage.getItem("ai_screening_token_stats") ||
      '{"total": 0, "prompt": 0, "completion": 0, "costUSD": 0}',
  );

  const newPrompt = (currentStats.prompt || 0) + promptTokens;
  const newCompletion = (currentStats.completion || 0) + completionTokens;
  const newTotal = newPrompt + newCompletion;

  // Estimasi Biaya Qwen Model OpenRouter (~$0.00015 per 1k prompt, ~$0.0006 per 1k output)
  const newCostUSD = (
    newPrompt * 0.00000015 +
    newCompletion * 0.0000006
  ).toFixed(4);

  const updatedData = {
    total: newTotal,
    prompt: newPrompt,
    completion: newCompletion,
    costUSD: parseFloat(newCostUSD),
  };

  localStorage.setItem("ai_screening_token_stats", JSON.stringify(updatedData));
};
