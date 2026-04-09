'use client';

import { useState, useEffect } from 'react';

/**
 * Static prompt configuration. 
 * In a production environment, these values could be fetched from 
 * Firebase Remote Config using the getRemoteConfig() SDK.
 */
const PROMPT_CONFIG = [
  { id: 'morning', text: "Tell me about your morning. Even one thing.", start: 6, end: 11 },
  { id: 'late-morning', text: "How has the day started? Chai, meeting, mood — anything.", start: 11, end: 13 },
  { id: 'afternoon', text: "Had dal-chawal? Feeling the 3pm dip? Just say it.", start: 13, end: 17 },
  { id: 'evening', text: "How did the day actually go?", start: 17, end: 20 },
  { id: 'night', text: "End of day. How are you feeling right now?", start: 20, end: 23 },
];

const FALLBACK_PROMPT = { id: 'fallback', text: "What's on your mind right now?" };

export function useCheckInPrompt() {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    const lastPromptId = sessionStorage.getItem('jeiva_last_prompt_id');
    
    // 1. Identify the "ideal" prompt for the current time
    let selected = PROMPT_CONFIG.find(p => hour >= p.start && hour < p.end);
    
    // 2. Apply rotation logic: if the ideal matches the last shown, or none matched (late night)
    // pick a different one from the pool to ensure variety.
    if (!selected || selected.id === lastPromptId) {
      const availableOptions = PROMPT_CONFIG.filter(p => p.id !== lastPromptId);
      selected = availableOptions[Math.floor(Math.random() * availableOptions.length)];
    }

    // 3. Final fallback safety
    const finalPrompt = selected || FALLBACK_PROMPT;
    
    setPrompt(finalPrompt.text);
    sessionStorage.setItem('jeiva_last_prompt_id', finalPrompt.id);
  }, []);

  return prompt;
}
