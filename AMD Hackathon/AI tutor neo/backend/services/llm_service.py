"""
LLM service for generating pedagogical hints using Groq API.

This module provides AI-powered hint generation that guides students
through problem-solving without revealing final answers.
"""

import os
import json
import asyncio
import logging
from typing import Dict
from groq import AsyncGroq

logger = logging.getLogger(__name__)


class LLMService:
    """
    Service for generating AI-powered math tutoring hints.
    
    Uses Groq API with pedagogical constraints to provide step-by-step
    guidance without revealing final answers.
    """
    
    def __init__(self, api_key: str, model: str = "llama-3.1-8b-instant"):
        """
        Initialize LLM service with Groq API credentials.
        
        Args:
            api_key: Groq API key for authentication
            model: Model identifier (default: mixtral-8x7b-32768)
        """
        self.api_key = api_key
        self.model = model
        self.client = AsyncGroq(api_key=api_key)
    
    async def get_hint(self, problem: str, level: str) -> Dict[str, str]:
        """
        Generate pedagogical hint using Groq API.
        
        Args:
            problem: Mathematical expression to solve
            level: Student difficulty level (beginner/intermediate/advanced)
        
        Returns:
            dict with keys:
                - hint (str): Step-by-step guidance
                - next_question (str): Guiding question for thinking
                - difficulty (str): Assessed difficulty (easy/medium/hard)
        
        Raises:
            Exception: If API call fails or times out
            
        Examples:
            >>> service = LLMService(api_key="...")
            >>> await service.get_hint("x^2 + 3x = 5", "beginner")
            {
                'hint': 'Start by moving all terms to one side...',
                'next_question': 'What form should the equation be in?',
                'difficulty': 'medium'
            }
        """
        try:
            # Build prompt with pedagogical constraints
            prompt = self._build_prompt(problem, level)
            
            # Call Groq API with timeout
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful math tutor who guides students without giving away answers."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.7,
                    max_tokens=500
                ),
                timeout=10.0  # 10 second timeout
            )
            
            # Parse and validate response
            result = self._parse_response(response)
            return result
        
        except asyncio.TimeoutError:
            logger.error(f"LLM request timeout for problem: {problem}")
            raise Exception("AI service timeout")
        
        except Exception as e:
            logger.error(f"LLM request failed: {str(e)}")
            raise Exception(f"AI service error: {str(e)}")
    
    def _build_prompt(self, problem: str, level: str) -> str:
        """
        Build prompt with pedagogical constraints.
        
        Args:
            problem: Mathematical problem
            level: Student level (beginner/intermediate/advanced)
        
        Returns:
            str: Formatted prompt for LLM
        """
        prompt = f"""You are a math tutor helping a {level} student. The student is working on: {problem}

RULES:
1. Do NOT give the final answer
2. Provide a hint about the NEXT step they should take
3. Ask a guiding question to encourage thinking
4. Keep your response under 200 words
5. Assess the difficulty as easy, medium, or hard

Respond in JSON format:
{{
  "hint": "your step-by-step hint here",
  "next_question": "a question to guide their thinking",
  "difficulty": "easy|medium|hard"
}}

Respond ONLY with valid JSON, no additional text."""
        
        return prompt
    
    def _parse_response(self, response) -> Dict[str, str]:
        """
        Parse LLM response and extract structured data.
        
        Args:
            response: Groq API response object
        
        Returns:
            dict with hint, next_question, and difficulty
        
        Raises:
            Exception: If response cannot be parsed
        """
        try:
            # Extract content from response
            content = response.choices[0].message.content.strip()
            
            # Try to parse as JSON
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                # If not valid JSON, try to extract JSON from markdown code blocks
                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    content = content[json_start:json_end].strip()
                    data = json.loads(content)
                elif "```" in content:
                    json_start = content.find("```") + 3
                    json_end = content.find("```", json_start)
                    content = content[json_start:json_end].strip()
                    data = json.loads(content)
                else:
                    raise
            
            # Validate required fields
            if "hint" not in data or "next_question" not in data or "difficulty" not in data:
                raise ValueError("Response missing required fields")
            
            # Validate difficulty value
            if data["difficulty"] not in ["easy", "medium", "hard"]:
                data["difficulty"] = "medium"  # Default to medium if invalid
            
            return {
                "hint": data["hint"],
                "next_question": data["next_question"],
                "difficulty": data["difficulty"]
            }
        
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {str(e)}")
            # Return fallback response
            return {
                "hint": "Let's break this problem down step by step. What operation should you perform first?",
                "next_question": "What mathematical principle applies here?",
                "difficulty": "medium"
            }
