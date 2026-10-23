"""
RAKSHA 2.0 - Groq AI Tactical Commander Intelligence Client
Powered by high-throughput ultra-low-latency Groq LPU inference.
Provides real-time civil defense tactical reasoning, disaster stress analysis,
and NDMA-compliant incident directive generation.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger("RAKSHA_GroqClient")

def _load_groq_key() -> str:
    key = os.getenv("GROQ_API_KEY", "")
    if not key:
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip().startswith("GROQ_API_KEY="):
                            key = line.strip().split("=", 1)[1].strip().strip('"').strip("'")
                            break
            except Exception:
                pass
    return key

GROQ_API_KEY = _load_groq_key()
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODELS = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]

class GroqTacticalCommanderService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or GROQ_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.last_engine_used = "Groq LPU (qwen3.8-27b)"

    def generate_tactical_response(
        self,
        prompt: str,
        system_instruction: str,
        max_tokens: int = 450,
        temperature: float = 0.2
    ) -> Optional[Dict[str, str]]:
        """Calls Groq LPU inference with graceful model fallback."""
        if not self.api_key:
            return None

        for model in DEFAULT_MODELS:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            try:
                res = requests.post(
                    GROQ_API_URL,
                    headers=self.headers,
                    json=payload,
                    timeout=12.0
                )
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        msg = choices[0]["message"]
                        text = (msg.get("content") or "").strip()
                        if not text and "reasoning" in msg:
                            text = (msg.get("reasoning") or "").strip()
                        if text:
                            self.last_engine_used = f"Groq LPU ({model.split('/')[-1].upper()})"
                            return {
                                "text": text,
                                "model": model
                            }
                elif res.status_code == 404:
                    logger.warning(f"Groq model {model} not found, trying fallback...")
                    continue
                else:
                    logger.error(f"Groq API returned HTTP {res.status_code}: {res.text}")
            except Exception as e:
                logger.error(f"Groq API call exception for {model}: {e}")
                continue

        return None

    def answer_commander_query(
        self,
        query: str,
        incident_context: Dict[str, Any]
    ) -> Optional[str]:
        """Generates operational directives for an incident commander question."""
        system_instruction = (
            "You are the RAKSHA AI Tactical Commander, an authoritative NDMA Tier-1 Disaster "
            "Decision Intelligence Officer operating under the National Disaster Management Act 2005. "
            "You synthesize multi-sensor Earth Observation (Sentinel-1 SAR radar backscatter, Sentinel-2 optical), "
            "SRTM elevation transects, Zero-Tolerance Hard Veto rules (slope > 14°, flood runout corridors), "
            "and Sphere standard camp capacities (45 m²/person). "
            "Give direct, concise, militarily and statutorily precise directives. "
            "Always cite concrete metrics, evacuation corridors, speed ceilings, and priority assignments."
        )

        ctx_str = json.dumps(incident_context, indent=2)
        user_prompt = (
            f"LIVE INCIDENT CONTEXT:\n{ctx_str}\n\n"
            f"COMMANDER EMERGENCY QUERY: {query}\n\n"
            "Provide an immediate, authoritative tactical action directive answering this query."
        )

        return self.generate_tactical_response(user_prompt, system_instruction, max_tokens=350)

# Global Singleton
groq_tactical_service = GroqTacticalCommanderService()
