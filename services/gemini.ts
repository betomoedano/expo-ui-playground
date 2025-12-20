/**
 * Declutterly - Gemini AI Service
 * Handles image/video analysis for room decluttering
 */

import { AIAnalysisResult, CleaningTask, Priority, TaskDifficulty, RoomType } from '@/types/declutter';

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// You can set this via environment variable or app config
let API_KEY = '';

export function setGeminiApiKey(key: string) {
  API_KEY = key;
}

export function getGeminiApiKey(): string {
  return API_KEY;
}

// System prompt for declutter analysis - ADHD-friendly approach
const DECLUTTER_SYSTEM_PROMPT = `You are a friendly, supportive AI assistant helping people declutter and clean their spaces. You specialize in helping people with ADHD and those who feel overwhelmed by cleaning tasks.

Your approach:
1. Be encouraging and non-judgmental - never shame the user for mess
2. Break down tasks into SMALL, achievable steps (2-10 minutes each)
3. Prioritize "quick wins" - easy tasks that make visible impact
4. Use friendly, motivating language
5. Focus on progress, not perfection
6. Include specific, actionable steps (not vague instructions)

When analyzing a room image:
1. Assess the overall mess level (0-100)
2. Identify specific items/areas that need attention
3. Create a prioritized task list with time estimates
4. Suggest "2-minute wins" for immediate dopamine hits
5. Estimate total cleaning time
6. Provide an encouraging summary

Task difficulty guide:
- "quick": 1-5 minutes, requires no decision making
- "medium": 5-15 minutes, some decisions needed
- "challenging": 15+ minutes, requires focus and decisions

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "messLevel": <number 0-100>,
  "summary": "<brief description of room state>",
  "encouragement": "<motivating message>",
  "roomType": "<bedroom|kitchen|bathroom|livingRoom|office|garage|closet|other>",
  "quickWins": ["<2-min task 1>", "<2-min task 2>", ...],
  "estimatedTotalTime": <total minutes>,
  "tasks": [
    {
      "title": "<task title>",
      "description": "<specific instructions>",
      "emoji": "<relevant emoji>",
      "priority": "<high|medium|low>",
      "difficulty": "<quick|medium|challenging>",
      "estimatedMinutes": <number>,
      "tips": ["<helpful tip 1>", "<helpful tip 2>"],
      "subtasks": [
        {"title": "<subtask 1>"},
        {"title": "<subtask 2>"}
      ]
    }
  ]
}`;

// Helper to convert base64 image for API
function createImagePart(base64Image: string, mimeType: string = 'image/jpeg') {
  // Remove data URL prefix if present
  const base64Data = base64Image.includes('base64,')
    ? base64Image.split('base64,')[1]
    : base64Image;

  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Parse AI response into structured data
function parseAIResponse(responseText: string): AIAnalysisResult {
  try {
    // Try to extract JSON from the response
    let jsonStr = responseText;

    // Handle markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Transform tasks to include IDs
    const tasks: CleaningTask[] = (parsed.tasks || []).map((task: any) => ({
      id: generateId(),
      title: task.title || 'Task',
      description: task.description || '',
      emoji: task.emoji || '📋',
      priority: (task.priority || 'medium') as Priority,
      difficulty: (task.difficulty || 'medium') as TaskDifficulty,
      estimatedMinutes: task.estimatedMinutes || 5,
      completed: false,
      tips: task.tips || [],
      subtasks: (task.subtasks || []).map((st: any) => ({
        id: generateId(),
        title: st.title,
        completed: false,
      })),
    }));

    return {
      messLevel: Math.min(100, Math.max(0, parsed.messLevel || 50)),
      summary: parsed.summary || 'Room analyzed successfully.',
      encouragement: parsed.encouragement || "You've got this! Every small step counts.",
      tasks,
      quickWins: parsed.quickWins || [],
      estimatedTotalTime: parsed.estimatedTotalTime || tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0),
      roomType: parsed.roomType as RoomType,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.log('Raw response:', responseText);

    // Return a fallback response
    return {
      messLevel: 50,
      summary: 'Unable to fully analyze the image. Here are some general cleaning tasks.',
      encouragement: "Let's start with some basic cleaning tasks!",
      tasks: getDefaultTasks(),
      quickWins: ['Pick up any trash you can see', 'Put one item back in its place'],
      estimatedTotalTime: 30,
    };
  }
}

// Default tasks when AI analysis fails
function getDefaultTasks(): CleaningTask[] {
  return [
    {
      id: generateId(),
      title: 'Quick Trash Pickup',
      description: 'Walk around and pick up any obvious trash or items for recycling',
      emoji: '🗑️',
      priority: 'high',
      difficulty: 'quick',
      estimatedMinutes: 3,
      completed: false,
      tips: ['Grab a bag before you start', "Don't overthink - if it's trash, toss it!"],
    },
    {
      id: generateId(),
      title: 'Clear One Surface',
      description: 'Pick one surface (table, counter, desk) and clear everything off it',
      emoji: '✨',
      priority: 'high',
      difficulty: 'medium',
      estimatedMinutes: 10,
      completed: false,
      tips: ['Start with the most visible surface', 'Sort items into keep, trash, and relocate piles'],
    },
    {
      id: generateId(),
      title: 'Gather Dishes',
      description: 'Collect any dishes, cups, or utensils from around the room',
      emoji: '🍽️',
      priority: 'medium',
      difficulty: 'quick',
      estimatedMinutes: 5,
      completed: false,
      tips: ['Use a tray or basket to carry everything at once'],
    },
    {
      id: generateId(),
      title: 'Pick Up Clothes',
      description: 'Gather any clothing items and put in hamper or fold/hang',
      emoji: '👕',
      priority: 'medium',
      difficulty: 'medium',
      estimatedMinutes: 10,
      completed: false,
      tips: ["Don't fold now - just gather!", 'Make a laundry pile for later'],
    },
  ];
}

// Main analysis function - analyzes an image of a room
export async function analyzeRoomImage(
  base64Image: string,
  additionalContext?: string
): Promise<AIAnalysisResult> {
  if (!API_KEY) {
    throw new Error('Gemini API key not set. Please set your API key in settings.');
  }

  const userPrompt = additionalContext
    ? `Analyze this room and create a decluttering plan. Additional context: ${additionalContext}`
    : 'Analyze this room and create a decluttering plan. Be encouraging and break tasks into small, manageable steps.';

  const requestBody = {
    contents: [
      {
        parts: [
          { text: DECLUTTER_SYSTEM_PROMPT },
          { text: userPrompt },
          createImagePart(base64Image),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('No response from AI');
    }

    return parseAIResponse(responseText);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Analyze progress between two photos
export async function analyzeProgress(
  beforeImage: string,
  afterImage: string
): Promise<{
  progressPercentage: number;
  completedTasks: string[];
  remainingTasks: string[];
  encouragement: string;
}> {
  if (!API_KEY) {
    throw new Error('Gemini API key not set');
  }

  const progressPrompt = `Compare these two images of the same room. The first image is "before" and the second is "after" cleaning.

Analyze the progress made and respond with JSON:
{
  "progressPercentage": <0-100>,
  "completedTasks": ["<what was cleaned/organized>"],
  "remainingTasks": ["<what still needs work>"],
  "encouragement": "<celebrate their progress!>"
}

Be very encouraging! Focus on what WAS accomplished, not what wasn't.`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: progressPrompt },
          { text: 'Before image:' },
          createImagePart(beforeImage),
          { text: 'After image:' },
          createImagePart(afterImage),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Parse JSON from response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      progressPercentage: parsed.progressPercentage || 50,
      completedTasks: parsed.completedTasks || [],
      remainingTasks: parsed.remainingTasks || [],
      encouragement: parsed.encouragement || 'Great progress! Keep going!',
    };
  } catch (error) {
    console.error('Progress analysis error:', error);
    return {
      progressPercentage: 50,
      completedTasks: ['Made visible progress'],
      remainingTasks: ['Continue with remaining tasks'],
      encouragement: "You're doing great! Every bit of progress counts!",
    };
  }
}

// Get a motivational message
export async function getMotivation(context: string): Promise<string> {
  if (!API_KEY) {
    return getRandomMotivation();
  }

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            { text: `You are a supportive friend helping someone clean their space. They might be feeling overwhelmed or unmotivated. Give them a short (1-2 sentences), warm, encouraging message. Context: ${context}. Be genuine, not cheesy.` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 100,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || getRandomMotivation();
  } catch {
    return getRandomMotivation();
  }
}

// Fallback motivational messages
function getRandomMotivation(): string {
  const messages = [
    "You don't have to do everything today. Just start with one small thing.",
    "Progress over perfection. Every item you put away is a win!",
    "Your future self will thank you for whatever you do right now.",
    "It's okay if it's not perfect. Done is better than perfect.",
    "You're stronger than the mess. Let's tackle this together!",
    "Remember: you don't have to feel motivated to start. Motivation often comes after starting.",
    "10 minutes is better than 0 minutes. What can you do in just 10 minutes?",
    "The hardest part is starting. You've already done that by being here!",
    "Celebrate every small win. You're making progress!",
    "Your space doesn't define you, but improving it can help you feel better.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
