import json
import os
import random

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()

from ai_client import build_continue_prompt, build_generate_prompt, build_revise_prompt, stream_deepseek, stream_glm
from models import ContinueRequest, GenerateRequest, ReviseRequest, StoryItem
from storage import add, clear, delete as delete_story, get_all

app = FastAPI(title="AI Story Generator")

# 挂载静态文件目录
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 挂载 pictures 目录（供首页蒲公英使用）
pictures_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pictures")
if os.path.isdir(pictures_dir):
    app.mount("/pictures", StaticFiles(directory=pictures_dir), name="pictures")

# 挂载 video 目录
video_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "video")
if os.path.isdir(video_dir):
    app.mount("/video", StaticFiles(directory=video_dir), name="video")

# 挂载 This-July 目录（字体文件）
thisjuly_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "This-July")
if os.path.isdir(thisjuly_dir):
    app.mount("/This-July", StaticFiles(directory=thisjuly_dir), name="thisjuly")


# ── 健康检查 ──
@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ── 生成故事（SSE 流式） ──
@app.post("/api/generate")
async def generate_story(req: GenerateRequest):
    if not req.keywords:
        raise HTTPException(status_code=400, detail="至少需要一个关键词")

    prompt = build_generate_prompt(req.keywords, req.style, req.length, req.userEdit)

    async def event_stream():
        stream = stream_glm if req.model == "glm" else stream_deepseek
        try:
            async for chunk in stream(prompt, api_key=req.apiKey):
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
        except RuntimeError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
        yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── 修改故事（SSE 流式） ──
@app.post("/api/revise")
async def revise_story(req: ReviseRequest):
    if not req.userEdit:
        raise HTTPException(status_code=400, detail="修改意见不能为空")
    if not req.story:
        raise HTTPException(status_code=400, detail="没有可修改的故事")

    prompt = build_revise_prompt(req.keywords, req.style, req.length, req.story, req.userEdit)

    async def event_stream():
        stream = stream_glm if req.model == "glm" else stream_deepseek
        try:
            async for chunk in stream(prompt, api_key=req.apiKey):
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
        except RuntimeError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
        yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── 继续生成（SSE 流式） ──
@app.post("/api/continue")
async def continue_story(req: ContinueRequest):
    if not req.story:
        raise HTTPException(status_code=400, detail="没有可继续的故事")

    prompt = build_continue_prompt(req.keywords, req.style, req.length, req.story)

    async def event_stream():
        stream = stream_glm if req.model == "glm" else stream_deepseek
        try:
            async for chunk in stream(prompt, api_key=req.apiKey):
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
        except RuntimeError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
        yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── 历史记录 CRUD ──
@app.get("/api/history")
async def list_history():
    stories = get_all()
    return {"stories": [s.model_dump() for s in reversed(stories)]}


@app.post("/api/history")
async def add_history(item: StoryItem):
    add(item)
    return {"status": "ok", "id": item.id}


@app.post("/api/history/auto-save")
async def auto_save_history(item: StoryItem):
    """beforeunload 专用：服务端去重后保存"""
    stories = get_all()
    already_saved = any(
        s.words == item.words and s.story == item.story for s in stories
    )
    if not already_saved:
        add(item)
    return {"status": "ok"}


@app.delete("/api/history/{story_id}")
async def delete_history(story_id: str):
    deleted = delete_story(story_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="故事不存在")
    return {"status": "ok"}


@app.delete("/api/history")
async def clear_all_history():
    clear()
    return {"status": "ok"}


# ── 随机关键词 ──
WORD_POOL = [
    "魔法", "梦境", "星空", "孤岛", "时钟", "迷雾", "森林", "鲸鱼", "风筝", "列车",
    "影子", "月光", "城堡", "沙漠", "海洋", "烟火", "钢琴", "蝴蝶", "古书", "面具",
    "机器人", "时间旅行", "外星人", "失落城市", "宝藏", "幽灵", "骑士", "龙", "精灵", "海盗",
    "雨夜", "咖啡", "逆袭", "秘密", "冒险", "勇气", "友谊", "背叛", "救赎", "重生",
    "深渊", "回声", "囚徒", "钥匙", "镜子", "迷路", "流浪", "约定", "信", "画",
]


@app.get("/api/random-words")
async def random_words(n: int = 3):
    pool = list(WORD_POOL)
    result = []
    for _ in range(n):
        idx = random.randrange(len(pool))
        result.append(pool.pop(idx))
    return {"words": result}


# ── 前端页面 ──
@app.get("/")
async def home():
    return FileResponse(os.path.join(static_dir, "home.html"))

@app.get("/generate")
async def generate_page():
    return FileResponse(os.path.join(static_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
