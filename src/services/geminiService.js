/**
 * Gemini AI Service - Intelligent Recommendation Generation
 * This module handles all AI-powered recommendation logic
 * Architecture: Completely modular for easy provider swapping
 */

// Multiple model options in fallback order - tries each until one works
const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-pro',
  'gemini-1.0-pro'
];

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const API_TIMEOUT = 30000; // 30 seconds timeout

/**
 * Main function to generate AI-powered recommendations
 * @param {Object} analysisData - Complete student performance data
 * @returns {Promise<Array>} Array of recommendation objects
 */
export const generateAIRecommendations = async (analysisData) => {
  try {
    // Validate configuration
    if (!validateGeminiConfig()) {
      console.warn('Gemini API key not configured, using fallback recommendations');
      return generateFallbackRecommendations(analysisData);
    }

    // Build detailed prompt from student data
    const prompt = buildPrompt(analysisData);

    // Call Gemini API
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const response = await callGeminiAPI(apiKey, prompt);

    // Parse and validate response
    const recommendations = parseGeminiResponse(response);

    if (!recommendations || recommendations.length === 0) {
      console.warn('Invalid AI response, using fallback recommendations');
      return generateFallbackRecommendations(analysisData);
    }

    console.log('✓ AI recommendations generated successfully');
    return recommendations;
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return generateFallbackRecommendations(analysisData);
  }
};

/**
 * Build detailed prompt for Gemini with student performance data
 * @param {Object} analysisData - Analytics from dashboardStats
 * @returns {string} Formatted prompt for Gemini API
 */
const buildPrompt = (analysisData) => {
  const {
    overallStats = {},
    subjectWiseStats = {},
    chapterWiseStats = {},
    weakChapters = [],
    strongChapters = [],
    performanceTrend = [],
    difficultyStats = {}
  } = analysisData;

  const studentProfile = `
STUDENT PERFORMANCE PROFILE:
- Total Tests Taken: ${overallStats.totalTests || 0}
- Average Score: ${(overallStats.averageScore || 0).toFixed(1)}%
- Overall Accuracy: ${(overallStats.accuracy || 0).toFixed(1)}%
- Total Study Time: ${overallStats.timeSpent || '0 hours'}

SUBJECT-WISE BREAKDOWN:
${Object.entries(subjectWiseStats)
  .map(([subject, stats]) => `
  ${subject}:
    - Tests: ${stats.count}
    - Avg Score: ${stats.averageScore.toFixed(1)}%
    - Accuracy: ${stats.accuracy.toFixed(1)}%
`)
  .join('')}

WEAK CHAPTERS (< 60% accuracy):
${weakChapters.length > 0 ? weakChapters.map(ch => `- ${ch.chapter}: ${ch.accuracy.toFixed(1)}%`).join('\n') : '- None (Student is doing well!)'}

STRONG CHAPTERS (> 80% accuracy):
${strongChapters.length > 0 ? strongChapters.map(ch => `- ${ch.chapter}: ${ch.accuracy.toFixed(1)}%`).join('\n') : '- Continue improving!'}

DIFFICULTY-WISE PERFORMANCE:
${Object.entries(difficultyStats)
  .map(([level, stats]) => `- ${level}: ${stats.accuracy.toFixed(1)}% accuracy (${stats.correctAnswers}/${stats.totalQuestions})`)
  .join('\n')}

RECENT PERFORMANCE TREND:
${performanceTrend.slice(-5).map(test => `- Test: ${test.score}% (${test.date})`).join('\n')}
`;

  const systemPrompt = `You are an expert educational advisor for competitive exam preparation. Analyze the student's performance data and provide 4-5 highly personalized, actionable recommendations.

Format your response as a JSON array with this exact structure:
[
  {
    "title": "Brief title (max 40 chars)",
    "description": "Detailed description (2-3 sentences)",
    "priority": "High|Medium|Low",
    "actionable": "Specific action to take",
    "estimatedImpact": "Expected improvement (e.g., '+5%')"
  }
]

Requirements:
1. Each recommendation must address actual performance gaps from the data
2. Prioritize weak chapters and difficult topics
3. Consider performance trends and patterns
4. Make recommendations specific and actionable
5. Return ONLY valid JSON, no markdown or extra text`;

  return { systemPrompt, studentProfile };
};

/**
 * Call Gemini API with smart model fallback
 * Tries multiple models in order until one succeeds
 * @param {string} apiKey - Gemini API key
 * @param {Object} prompt - System prompt and student profile
 * @returns {Promise<string>} API response text
 */
const callGeminiAPI = async (apiKey, prompt) => {
  let lastError = null;

  // Try each model in fallback order
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Trying model: ${model}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${prompt.systemPrompt}\n\nSTUDENT DATA:\n${prompt.studentProfile}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(`${API_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Unknown error';
        
        // 404 means model not found, try next one
        if (response.status === 404) {
          lastError = new Error(`Model ${model} not available`);
          console.warn(`Model ${model} not available, trying next...`);
          continue;
        }
        
        // 429 means rate limited - skip this model and try next
        if (response.status === 429) {
          lastError = new Error(`Model ${model} rate limited`);
          console.warn(`Model ${model} rate limited, trying next...`);
          console.warn('Quota info:', errorMessage);
          continue;
        }
        
        // Other errors are fatal
        throw new Error(
          `Gemini API error (${response.status}): ${errorMessage}`
        );
      }

      // Success! Parse and return response
      const data = await response.json();

      // Extract text from Gemini response structure
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        console.log(`✓ Successfully used model: ${model}`);
        return data.candidates[0].content.parts[0].text;
      }

      throw new Error('Invalid Gemini response structure');
    } catch (error) {
      // If it's a 404, continue to next model
      if (error.message.includes('not available')) {
        continue;
      }
      // If it's an abort error (timeout), try next model
      if (error.name === 'AbortError') {
        console.warn(`Model ${model} timeout, trying next...`);
        lastError = error;
        continue;
      }
      // For other errors, remember and try next
      lastError = error;
      console.warn(`Model ${model} failed:`, error.message);
      continue;
    }
  }

  // All models failed
  if (lastError) {
    throw new Error(`All Gemini models failed. Last error: ${lastError.message}`);
  } else {
    throw new Error('Unable to find a working Gemini model');
  }
};

/**
 * Call Gemini API with proper error handling
 * This function can be easily replaced to use Claude, OpenAI, etc.
 * @param {string} apiKey - Gemini API key
 * @param {Object} prompt - System prompt and student profile
 * @returns {Promise<string>} API response text
 */
const callGeminiAPI_OLD = async (apiKey, prompt) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${prompt.systemPrompt}\n\nSTUDENT DATA:\n${prompt.studentProfile}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024
      }
    };

    const response = await fetch(`${API_BASE_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gemini API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();

    // Extract text from Gemini response structure
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Invalid Gemini response structure');
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Gemini API request timeout');
    }
    throw error;
  }
};

/**
 * Parse and validate Gemini response
 * Extracts JSON from response text and validates structure
 * Handles both plain JSON and markdown-wrapped JSON
 * @param {string} responseText - Raw response from Gemini API
 * @returns {Array|null} Parsed recommendations or null if invalid
 */
const parseGeminiResponse = (responseText) => {
  try {
    console.log('Raw response:', responseText.substring(0, 100) + '...');
    
    let parsed;
    let textToTry = responseText.trim();
    
    // Try 1: Parse as JSON directly
    try {
      parsed = JSON.parse(textToTry);
    } catch (e) {
      // Try 2: Extract from markdown code blocks (```json ... ```)
      const jsonMarkdownMatch = textToTry.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMarkdownMatch) {
        console.log('Found JSON in markdown code blocks');
        parsed = JSON.parse(jsonMarkdownMatch[1].trim());
      } else {
        // Try 3: Extract from generic code blocks (``` ... ```)
        const genericMarkdownMatch = textToTry.match(/```\s*([\s\S]*?)\s*```/);
        if (genericMarkdownMatch) {
          console.log('Found JSON in generic code blocks');
          parsed = JSON.parse(genericMarkdownMatch[1].trim());
        } else {
          // Try 4: Look for JSON array pattern
          const jsonArrayMatch = textToTry.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonArrayMatch) {
            console.log('Found JSON array pattern');
            parsed = JSON.parse(jsonArrayMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
      }
    }

    // Validate it's an array
    if (!Array.isArray(parsed)) {
      console.error('Response is not an array:', parsed);
      return null;
    }

    // Validate each recommendation has required fields
    const isValid = parsed.every(rec => rec.title && rec.description && rec.priority);
    if (!isValid) {
      console.error('Invalid recommendation structure in response');
      console.error('Sample:', parsed[0]);
      return null;
    }

    console.log('✓ Successfully parsed', parsed.length, 'recommendations');
    return parsed;
  } catch (error) {
    console.error('Error parsing Gemini response:', error.message);
    console.error('Response text:', responseText.substring(0, 200));
    return null;
  }
};

/**
 * Intelligent fallback recommendations using rule-based system
 * Used when Gemini API is unavailable or returns invalid data
 * @param {Object} analysisData - Analytics data
 * @returns {Array} Array of fallback recommendations
 */
export const generateFallbackRecommendations = (analysisData) => {
  const recommendations = [];
  const {
    overallStats = {},
    weakChapters = [],
    strongChapters = [],
    difficultyStats = {},
    performanceTrend = []
  } = analysisData;

  const avgScore = overallStats.averageScore || 0;
  const accuracy = overallStats.accuracy || 0;

  // Rule 1: Focus on weak chapters
  if (weakChapters.length > 0) {
    const weakest = weakChapters[0];
    recommendations.push({
      title: `Master ${weakest.chapter}`,
      description: `You have ${weakest.accuracy.toFixed(1)}% accuracy in ${weakest.chapter}. This is below your potential. Dedicate focused study time to this chapter and take targeted practice tests.`,
      priority: 'High',
      actionable: 'Solve 10-15 questions from this chapter daily',
      estimatedImpact: '+10-15%'
    });
  }

  // Rule 2: Improve weak difficulty level
  const difficultyLevels = Object.entries(difficultyStats || {});
  if (difficultyLevels.length > 0) {
    const weakestDifficulty = difficultyLevels.reduce((prev, current) =>
      current[1].accuracy < prev[1].accuracy ? current : prev
    );
    if (weakestDifficulty[1].accuracy < 70) {
      recommendations.push({
        title: `Build ${weakestDifficulty[0]} Level Skills`,
        description: `You're struggling with ${weakestDifficulty[0]} level questions (${weakestDifficulty[1].accuracy.toFixed(1)}% accuracy). These are crucial for improving your overall score.`,
        priority: 'High',
        actionable: 'Practice ${weakestDifficulty[0]} questions with detailed solution review',
        estimatedImpact: '+8-12%'
      });
    }
  }

  // Rule 3: Consistency improvement
  if (performanceTrend.length >= 3) {
    const recentScores = performanceTrend.slice(-3).map(t => t.score);
    const variance = Math.sqrt(
      recentScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / recentScores.length
    );
    if (variance > 15) {
      recommendations.push({
        title: 'Improve Consistency',
        description: `Your scores vary significantly (${variance.toFixed(1)} point variance). Focus on building strong fundamentals and consistent problem-solving approaches.`,
        priority: 'High',
        actionable: 'Complete topic-wise tests on fundamentals before mixed tests',
        estimatedImpact: '+5-10%'
      });
    }
  }

  // Rule 4: Maintain strength
  if (strongChapters.length > 0) {
    recommendations.push({
      title: `Continue Excelling in ${strongChapters[0].chapter}`,
      description: `You're performing excellently in ${strongChapters[0].chapter} (${strongChapters[0].accuracy.toFixed(1)}% accuracy). Keep practicing to maintain this strength.`,
      priority: 'Medium',
      actionable: 'Take weekly tests in this chapter to maintain accuracy',
      estimatedImpact: 'Maintain +0%'
    });
  }

  // Rule 5: Speed and accuracy balance
  if (accuracy > 75 && avgScore < 70) {
    recommendations.push({
      title: 'Improve Speed Without Sacrificing Accuracy',
      description: 'You have good accuracy but lower scores, suggesting speed issues. Work on efficient problem-solving techniques.', 
      priority: 'Medium',
      actionable: 'Practice timed mock tests to build speed',
      estimatedImpact: '+5-8%'
    });
  }

  // Rule 6: Accuracy improvement
  if (accuracy < 60) {
    recommendations.push({
      title: 'Focus on Accuracy First',
      description: 'Your accuracy is below 60%, which impacts your score significantly. Before attempting more tests, strengthen your understanding of concepts.',
      priority: 'High',
      actionable: 'Review theory and solve untimed conceptual questions',
      estimatedImpact: '+15-20%'
    });
  }

  // Rule 7: Volume and practice
  if (overallStats.totalTests < 5) {
    recommendations.push({
      title: 'Increase Practice Volume',
      description: `You've taken only ${overallStats.totalTests} tests. More practice is needed to identify patterns and improve systematically.`,
      priority: 'Medium',
      actionable: 'Target 1-2 tests per day for the next week',
      estimatedImpact: '+5-10%'
    });
  }

  // Rule 8: Overall strategy
  if (avgScore >= 80 && recommendations.length < 3) {
    recommendations.push({
      title: 'Excellent Performance - Fine Tuning',
      description: `You're already performing at ${avgScore.toFixed(1)}%! Focus on eliminating careless errors and perfecting your weakest areas to reach excellence.`,
      priority: 'Medium',
      actionable: 'Review past mistakes and build error log',
      estimatedImpact: '+2-5%'
    });
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
};

/**
 * Validate Gemini API configuration
 * @returns {boolean} True if API key is present
 */
export const validateGeminiConfig = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  return !!apiKey && apiKey.trim().length > 0;
};

/**
 * Get AI service status information
 * Useful for monitoring and debugging
 * @returns {Object} Service status details
 */
export const getAIServiceStatus = () => {
  const hasApiKey = validateGeminiConfig();
  return {
    status: hasApiKey ? 'ready' : 'not-configured',
    provider: 'Gemini AI (Multi-Model Fallback)',
    mode: hasApiKey ? 'AI-powered' : 'Fallback (rule-based)',
    availableModels: GEMINI_MODELS.length,
    message: hasApiKey
      ? `AI recommendations enabled - trying ${GEMINI_MODELS.length} models`
      : 'API key not found - using fallback recommendations',
    timestamp: new Date().toISOString()
  };
};
