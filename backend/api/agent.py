from fastapi import APIRouter, HTTPException
from core.store import get_context
from engine.agent import AetherAgent
from engine.decision_engine import DecisionEngine
from models.schemas import AgentRequest, AgentResponse

router = APIRouter()

@router.post("/agent/{dataset_id}", response_model=AgentResponse)
async def ask_agent(dataset_id: str, request: AgentRequest):
    context = get_context(dataset_id)

    if context is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis context not found. Please analyze the dataset first."
        )

    try:
        intent = context.get("intent", "exploratory")
        profile = context.get("profile", "mixed")

        # Agent now uses context only — no raw df needed
        agent = AetherAgent(context, intent, profile)
        answer = agent.answer(request.question)

        # Richer guided actions from Decision Engine
        actions = DecisionEngine(context).get_recommendations()

        return {
            "answer": answer,
            "actions": actions,
            "dataset_id": dataset_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Error: {str(e)}")
