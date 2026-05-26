import re
import uuid
from datetime import date

from fastapi import APIRouter

from app.errors import not_found
from app.schemas import ProfileInput, SavedItemInput, TaskUpdateInput
from app.seed import DOCUMENT_SEEDS, PROGRAM_SEEDS, SOURCE_SEEDS
from app.services.matching import generate_matches
from app.services.readiness import calculate_readiness
from app.services.tasks import generate_tasks

router = APIRouter(prefix="/api")

USERS: dict[str, dict] = {}
USERS_BY_EMAIL: dict[str, str] = {}
DASHBOARDS: dict[str, dict] = {}
MATCHES: dict[str, list[dict]] = {}
TASKS: dict[str, list[dict]] = {}
SAVED_ITEMS: dict[str, list[dict]] = {}


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def serialize_date(value):
    if isinstance(value, date):
        return value.isoformat()
    return value


def public_source(seed: dict) -> dict:
    return {**seed, "id": slugify(seed["name"]), "last_checked_at": serialize_date(seed.get("last_checked_at"))}


def public_program(seed: dict) -> dict:
    source = next((item for item in SOURCE_SEEDS if item["name"] == seed["source_name"]), None)
    return {
        **{key: serialize_date(value) for key, value in seed.items() if key != "source_name"},
        "id": slugify(seed["name"]),
        "source_id": slugify(seed["source_name"]),
        "source": public_source(source) if source else None,
    }


def public_document(seed: dict) -> dict:
    source = next((item for item in SOURCE_SEEDS if item["name"] == seed["source_name"]), None)
    return {
        **{key: serialize_date(value) for key, value in seed.items() if key != "source_name"},
        "id": slugify(seed["name"]),
        "source_id": slugify(seed["source_name"]),
        "source": public_source(source) if source else None,
    }


def profile_dict(profile: ProfileInput) -> dict:
    return profile.model_dump()


@router.get("/programs")
def list_programs() -> list[dict]:
    return [public_program(program) for program in PROGRAM_SEEDS]


@router.get("/programs/{program_id}")
def get_program(program_id: str) -> dict:
    program = next((item for item in PROGRAM_SEEDS if slugify(item["name"]) == program_id), None)
    if not program:
        raise not_found("Program not found.")
    return public_program(program)


@router.get("/documents")
def list_documents() -> list[dict]:
    return [public_document(document) for document in DOCUMENT_SEEDS]


@router.get("/documents/{document_id}")
def get_document(document_id: str) -> dict:
    document = next((item for item in DOCUMENT_SEEDS if slugify(item["name"]) == document_id), None)
    if not document:
        raise not_found("Document not found.")
    return public_document(document)


@router.post("/profiles")
def submit_profile(profile: ProfileInput) -> dict:
    email = profile.email.lower()
    user_id = USERS_BY_EMAIL.get(email) or str(uuid.uuid4())
    USERS_BY_EMAIL[email] = user_id
    USERS[user_id] = {"id": user_id, "email": email}

    raw_profile = profile_dict(profile)
    raw_profile["user_id"] = user_id
    readiness = calculate_readiness(raw_profile)
    matches = generate_matches(raw_profile, [public_program(program) for program in PROGRAM_SEEDS])
    tasks = [{**task, "id": str(uuid.uuid4())} for task in generate_tasks(raw_profile)]

    MATCHES[user_id] = matches
    TASKS[user_id] = tasks
    DASHBOARDS[user_id] = {
        "user": USERS[user_id],
        "profile": raw_profile,
        "readiness": readiness,
        "matches": matches[:5],
        "tasks": tasks,
        "saved_items": SAVED_ITEMS.get(user_id, []),
        "priority_actions": tasks[:5],
    }

    return DASHBOARDS[user_id]


@router.get("/profiles/{user_id}/dashboard")
def get_dashboard(user_id: str) -> dict:
    dashboard = DASHBOARDS.get(user_id)
    if not dashboard:
        raise not_found("Dashboard not found. Complete the wizard first.")
    dashboard["saved_items"] = SAVED_ITEMS.get(user_id, [])
    dashboard["tasks"] = TASKS.get(user_id, [])
    return dashboard


@router.get("/profiles/{user_id}/matches")
def get_matches(user_id: str) -> list[dict]:
    if user_id not in MATCHES:
        raise not_found("Matches not found. Complete the wizard first.")
    return MATCHES[user_id]


@router.post("/saved-items")
def save_item(item: SavedItemInput) -> dict:
    saved = {"id": str(uuid.uuid4()), **item.model_dump()}
    SAVED_ITEMS.setdefault(item.user_id, []).append(saved)
    return saved


@router.delete("/saved-items/{saved_item_id}")
def delete_saved_item(saved_item_id: str) -> dict:
    for user_id, items in SAVED_ITEMS.items():
        remaining = [item for item in items if item["id"] != saved_item_id]
        if len(remaining) != len(items):
            SAVED_ITEMS[user_id] = remaining
            return {"deleted": True}
    raise not_found("Saved item not found.")


@router.patch("/tasks/{task_id}")
def update_task(task_id: str, payload: TaskUpdateInput) -> dict:
    for tasks in TASKS.values():
        for task in tasks:
            if task["id"] == task_id:
                task["status"] = payload.status
                return task
    raise not_found("Task not found.")


@router.get("/admin/sources")
def admin_sources() -> list[dict]:
    programs = [public_program(program) for program in PROGRAM_SEEDS]
    documents = [public_document(document) for document in DOCUMENT_SEEDS]
    sources = []
    for source in SOURCE_SEEDS:
        source_id = slugify(source["name"])
        sources.append(
            {
                **public_source(source),
                "program_count": len([program for program in programs if program["source_id"] == source_id]),
                "document_count": len([document for document in documents if document["source_id"] == source_id]),
            }
        )
    return sources


@router.get("/ai/simplify/mock")
def mock_simplifier(text: str = "Government paperwork") -> dict[str, str]:
    return {
        "summary": f"In plain English: {text} is something to review before you apply or register.",
        "next_step": "Open the official source, gather the required information, and confirm details before submitting anything.",
    }
