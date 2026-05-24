from pydantic import BaseModel
from typing import List


class GenerateRequest(BaseModel):
    keywords: List[str]
    style: str
    length: str
    model: str
    apiKey: str = ""
    userEdit: str = ""


class ReviseRequest(BaseModel):
    keywords: List[str]
    style: str
    length: str
    model: str
    story: str
    userEdit: str
    apiKey: str = ""


class ContinueRequest(BaseModel):
    keywords: List[str]
    style: str
    length: str
    model: str
    story: str
    apiKey: str = ""


class StoryItem(BaseModel):
    id: str
    time: float
    words: List[str]
    story: str
    model: str
