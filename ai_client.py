import os
import json
from typing import AsyncGenerator, List

import httpx

GLM_API_KEY = os.getenv("GLM_API_KEY", "")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")

GLM_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
GLM_MODEL = "glm-4-flash-250414"
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-v4-flash"


def build_generate_prompt(keywords: List[str], style: str, length: str, user_edit: str = "") -> str:
    length_map = {"短篇": "300字左右", "中篇": "800字左右", "长篇": "1500字左右"}
    base = (
        f"请根据以下三个关键词创作一个故事：\n"
        f"关键词：{'、'.join(keywords)}\n"
        f"风格：{style}\n"
        f"篇幅：{length_map[length]}\n\n"
        f"故事应该自然融入所有关键词，有完整的起承转合。"
    )
    if user_edit:
        base += f"\n\n此外，用户提供了一些想法和设定，请将这些内容融入故事中：\n{user_edit}"
    return base


def build_revise_prompt(
    keywords: List[str], style: str, length: str,
    current_story: str, user_edit: str
) -> str:
    length_map = {"短篇": "300字左右", "中篇": "800字左右", "长篇": "1500字左右"}
    return (
        "你是一位作家，正在修改自己创作的故事。\n\n"
        f"原始关键词：{'、'.join(keywords)}\n"
        f"风格：{style}\n"
        f"篇幅：{length_map[length]}\n\n"
        f"以下是你已经写好的故事：\n"
        f"---\n{current_story}\n"
        f"---\n\n"
        f"读者/编辑给出了以下修改意见：\n{user_edit}\n\n"
        "请根据以上修改意见对故事进行改写。"
        "保留原故事中好的部分，根据意见进行调整。输出修改后的完整故事。"
    )


def build_continue_prompt(
    keywords: List[str], style: str, length: str, current_story: str
) -> str:
    length_map = {"短篇": "300字左右", "中篇": "800字左右", "长篇": "1500字左右"}
    return (
        "你是一位作家，正在续写自己的故事。\n\n"
        f"原始关键词：{'、'.join(keywords)}\n"
        f"风格：{style}\n"
        f"篇幅：{length_map[length]}\n\n"
        f"以下是你已经写好的部分：\n"
        f"---\n{current_story}\n"
        f"---\n\n"
        "请继续往下写，保持同样的风格和叙事节奏。"
        "不要重复已写的内容，直接从断点处续写。"
    )


async def _stream_ai(
    url: str, api_key: str, model: str, prompt: str,
    temperature: float = 0.85, max_tokens: int = 1500,
) -> AsyncGenerator[str, None]:
    """通用 AI 流式调用，逐段 yield 出 delta content。"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream(
            "POST",
            url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True,
            },
        ) as response:
            if response.status_code != 200:
                error_body = await response.aread()
                raise RuntimeError(
                    f"API 错误 ({response.status_code}): {error_body.decode(errors='replace')}"
                )
            async for line in response.aiter_lines():
                if line.startswith("data: ") and line != "data: [DONE]":
                    try:
                        payload = json.loads(line[6:])
                        delta = (
                            payload.get("choices", [{}])[0]
                            .get("delta", {})
                            .get("content")
                        )
                        if delta:
                            yield delta
                    except json.JSONDecodeError:
                        continue


async def stream_glm(prompt: str, api_key: str = "") -> AsyncGenerator[str, None]:
    key = api_key or os.getenv("GLM_API_KEY", "")
    async for chunk in _stream_ai(GLM_URL, key, GLM_MODEL, prompt):
        yield chunk


async def stream_deepseek(prompt: str, api_key: str = "") -> AsyncGenerator[str, None]:
    key = api_key or os.getenv("DEEPSEEK_API_KEY", "")
    async for chunk in _stream_ai(DEEPSEEK_URL, key, DEEPSEEK_MODEL, prompt):
        yield chunk
