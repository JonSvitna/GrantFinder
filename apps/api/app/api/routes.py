import re
import uuid
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.auth import get_current_user_optional
from app.database import get_db
from app.errors import not_found
from app.models import BusinessProfile, Document, MatchResult, Program, SavedItem, Source, Task, User
from app.schemas import ProfileInput, SavedItemInput, TaskUpdateInput
from app.seed import DOCUMENT_SEEDS, PROGRAM_SEEDS, SOURCE_SEEDS
from app.services.matching import generate_matches
from app.services.readiness import calculate_readiness
from app.services.subscriptions import FOUNDER_CAP, active_founder_count, spots_remaining
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


def source_from_model(source: Source | None) -> dict | None:
    if not source:
        return None
    return {
        "id": source.id,
        "name": source.name,
        "agency": source.agency,
        "url": source.url,
        "jurisdiction": source.jurisdiction,
        "source_type": source.source_type,
        "last_checked_at": serialize_date(source.last_checked_at),
        "notes": source.notes,
    }


def program_from_model(program: Program) -> dict:
    return {
        "id": program.id,
        "name": program.name,
        "funding_type": program.funding_type,
        "category": program.category,
        "best_fit": program.best_fit,
        "eligibility_summary": program.eligibility_summary,
        "required_documents": program.required_documents,
        "difficulty": program.difficulty,
        "estimated_time": program.estimated_time,
        "official_url": program.official_url,
        "last_checked_at": serialize_date(program.last_checked_at),
        "confidence": program.confidence,
        "next_action": program.next_action,
        "source_id": program.source_id,
        "source": source_from_model(program.source),
    }


def document_from_model(document: Document) -> dict:
    return {
        "id": document.id,
        "name": document.name,
        "category": document.category,
        "summary": document.summary,
        "who_needs_it": document.who_needs_it,
        "why_it_matters": document.why_it_matters,
        "required_information": document.required_information,
        "common_mistakes": document.common_mistakes,
        "official_url": document.official_url,
        "steps": document.steps,
        "source_id": document.source_id,
        "source": source_from_model(document.source),
    }


def profile_from_model(profile: BusinessProfile) -> dict:
    return {
        "user_id": profile.user_id,
        "business_name": profile.business_name,
        "county": profile.county,
        "stage": profile.stage,
        "industry": profile.industry,
        "entity_type": profile.entity_type,
        "revenue_range": profile.revenue_range,
        "employee_count": profile.employee_count,
        "hiring_plans": profile.hiring_plans,
        "funding_needs": profile.funding_needs,
        "has_ein": profile.has_ein,
        "has_business_bank_account": profile.has_business_bank_account,
        "has_w9": profile.has_w9,
        "has_sam_registration": profile.has_sam_registration,
        "has_emma_account": profile.has_emma_account,
        "interested_in_government_contracts": profile.interested_in_government_contracts,
        "ownership_statuses": profile.ownership_statuses,
        "location_type": profile.location_type,
    }


def task_from_model(task: Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "category": task.category,
        "priority": task.priority,
        "status": task.status,
    }


def saved_from_model(item: SavedItem) -> dict:
    return {
        "id": item.id,
        "user_id": item.user_id,
        "item_type": item.item_type,
        "program_id": item.program_id,
        "document_id": item.document_id,
    }


def build_preview_response(user: User | dict, readiness: dict, db: Session | None = None) -> dict:
    categories = []
    for key, value in readiness.items():
        if key == "missing_paperwork":
            continue
        categories.append({"key": key, "label": value["label"], "reason": value["reason"]})
    count = active_founder_count(db) if db is not None else 0
    user_payload = user if isinstance(user, dict) else {"id": user.id, "email": user.email}
    return {
        "preview": True,
        "user": user_payload,
        "categories": categories,
        "spots_remaining": spots_remaining(count),
        "cap_reached": count >= FOUNDER_CAP,
    }


@router.get("/programs")
def list_programs(db: Session = Depends(get_db)) -> list[dict]:
    try:
        programs = db.scalars(select(Program)).all()
        if programs:
            return [program_from_model(program) for program in programs]
    except SQLAlchemyError:
        db.rollback()
    return [public_program(program) for program in PROGRAM_SEEDS]


@router.get("/programs/{program_id}")
def get_program(program_id: str, db: Session = Depends(get_db)) -> dict:
    try:
        program = db.get(Program, program_id)
        if program:
            return program_from_model(program)
    except SQLAlchemyError:
        db.rollback()
    program = next((item for item in PROGRAM_SEEDS if slugify(item["name"]) == program_id), None)
    if not program:
        raise not_found("Program not found.")
    return public_program(program)


@router.get("/documents")
def list_documents(db: Session = Depends(get_db)) -> list[dict]:
    try:
        documents = db.scalars(select(Document)).all()
        if documents:
            return [document_from_model(document) for document in documents]
    except SQLAlchemyError:
        db.rollback()
    return [public_document(document) for document in DOCUMENT_SEEDS]


@router.get("/documents/{document_id}")
def get_document(document_id: str, db: Session = Depends(get_db)) -> dict:
    try:
        document = db.get(Document, document_id)
        if document:
            return document_from_model(document)
    except SQLAlchemyError:
        db.rollback()
    document = next((item for item in DOCUMENT_SEEDS if slugify(item["name"]) == document_id), None)
    if not document:
        raise not_found("Document not found.")
    return public_document(document)


@router.post("/profiles")
def submit_profile(
    profile: ProfileInput,
    db: Session = Depends(get_db),
    auth_user: User | None = Depends(get_current_user_optional),
) -> dict:
    try:
        return submit_profile_db(profile, db, auth_user)
    except SQLAlchemyError:
        db.rollback()
        return submit_profile_memory(profile, auth_user)


def submit_profile_memory(profile: ProfileInput, auth_user: User | None = None) -> dict:
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

    gate_user = auth_user
    if auth_user is None or auth_user.subscription_status != "active":
        return build_preview_response(USERS[user_id], readiness, db=None)

    return DASHBOARDS[user_id]


def submit_profile_db(profile: ProfileInput, db: Session, auth_user: User | None = None) -> dict:
    email = profile.email.lower()
    user = db.scalar(select(User).where(User.email == email)) or User(email=email)
    db.add(user)
    db.flush()

    raw_profile = profile_dict(profile)
    business_profile = db.scalar(select(BusinessProfile).where(BusinessProfile.user_id == user.id)) or BusinessProfile(user_id=user.id)
    for key, value in raw_profile.items():
        if key != "email":
            setattr(business_profile, key, value)
    db.add(business_profile)
    db.flush()

    programs = db.scalars(select(Program)).all()
    program_payloads = [program_from_model(program) for program in programs] or [public_program(program) for program in PROGRAM_SEEDS]
    readiness = calculate_readiness(raw_profile)
    matches = generate_matches(raw_profile, program_payloads)

    db.execute(delete(MatchResult).where(MatchResult.profile_id == business_profile.id))
    program_ids = {program["id"] for program in program_payloads}
    for match in matches:
        if match["program"]["id"] in program_ids and db.get(Program, match["program"]["id"]):
            db.add(
                MatchResult(
                    profile_id=business_profile.id,
                    program_id=match["program"]["id"],
                    score=match["score"],
                    confidence=match["confidence"],
                    fit_reason=match["fit_reason"],
                    next_action=match["next_action"],
                )
            )

    existing_tasks = db.scalars(select(Task).where(Task.user_id == user.id)).all()
    if not existing_tasks:
        for task in generate_tasks(raw_profile):
            db.add(Task(user_id=user.id, profile_id=business_profile.id, **task))
    db.commit()

    tasks = [task_from_model(task) for task in db.scalars(select(Task).where(Task.user_id == user.id)).all()]
    saved_items = [saved_from_model(item) for item in db.scalars(select(SavedItem).where(SavedItem.user_id == user.id)).all()]

    effective_user = auth_user or user
    if effective_user.subscription_status != "active":
        return build_preview_response(effective_user, readiness, db)

    return {
        "user": {"id": user.id, "email": user.email},
        "profile": {**raw_profile, "user_id": user.id},
        "readiness": readiness,
        "matches": matches[:5],
        "tasks": tasks,
        "saved_items": saved_items,
        "priority_actions": tasks[:5],
    }


@router.get("/profiles/{user_id}/dashboard")
def get_dashboard(user_id: str, db: Session = Depends(get_db)) -> dict:
    try:
        user = db.get(User, user_id)
        profile = db.scalar(select(BusinessProfile).where(BusinessProfile.user_id == user_id)) if user else None
        if user and profile:
            raw_profile = profile_from_model(profile)
            programs = [program_from_model(program) for program in db.scalars(select(Program)).all()]
            matches = generate_matches(raw_profile, programs or [public_program(program) for program in PROGRAM_SEEDS])
            tasks = [task_from_model(task) for task in db.scalars(select(Task).where(Task.user_id == user_id)).all()]
            saved_items = [saved_from_model(item) for item in db.scalars(select(SavedItem).where(SavedItem.user_id == user_id)).all()]
            return {
                "user": {"id": user.id, "email": user.email},
                "profile": raw_profile,
                "readiness": calculate_readiness(raw_profile),
                "matches": matches[:5],
                "tasks": tasks,
                "saved_items": saved_items,
                "priority_actions": tasks[:5],
            }
    except SQLAlchemyError:
        db.rollback()
    dashboard = DASHBOARDS.get(user_id)
    if not dashboard:
        raise not_found("Dashboard not found. Complete the wizard first.")
    dashboard["saved_items"] = SAVED_ITEMS.get(user_id, [])
    dashboard["tasks"] = TASKS.get(user_id, [])
    return dashboard


@router.get("/profiles/{user_id}/matches")
def get_matches(user_id: str, db: Session = Depends(get_db)) -> list[dict]:
    try:
        profile = db.scalar(select(BusinessProfile).where(BusinessProfile.user_id == user_id))
        if profile:
            raw_profile = profile_from_model(profile)
            programs = [program_from_model(program) for program in db.scalars(select(Program)).all()]
            return generate_matches(raw_profile, programs or [public_program(program) for program in PROGRAM_SEEDS])
    except SQLAlchemyError:
        db.rollback()
    if user_id not in MATCHES:
        raise not_found("Matches not found. Complete the wizard first.")
    return MATCHES[user_id]


@router.post("/saved-items")
def save_item(item: SavedItemInput, db: Session = Depends(get_db)) -> dict:
    try:
        saved_item = SavedItem(**item.model_dump())
        db.add(saved_item)
        db.commit()
        db.refresh(saved_item)
        return saved_from_model(saved_item)
    except SQLAlchemyError:
        db.rollback()
    saved = {"id": str(uuid.uuid4()), **item.model_dump()}
    SAVED_ITEMS.setdefault(item.user_id, []).append(saved)
    return saved


@router.delete("/saved-items/{saved_item_id}")
def delete_saved_item(saved_item_id: str, db: Session = Depends(get_db)) -> dict:
    try:
        saved_item = db.get(SavedItem, saved_item_id)
        if saved_item:
            db.delete(saved_item)
            db.commit()
            return {"deleted": True}
    except SQLAlchemyError:
        db.rollback()
    for user_id, items in SAVED_ITEMS.items():
        remaining = [item for item in items if item["id"] != saved_item_id]
        if len(remaining) != len(items):
            SAVED_ITEMS[user_id] = remaining
            return {"deleted": True}
    raise not_found("Saved item not found.")


@router.patch("/tasks/{task_id}")
def update_task(task_id: str, payload: TaskUpdateInput, db: Session = Depends(get_db)) -> dict:
    try:
        task = db.get(Task, task_id)
        if task:
            task.status = payload.status
            db.add(task)
            db.commit()
            db.refresh(task)
            return task_from_model(task)
    except SQLAlchemyError:
        db.rollback()
    for tasks in TASKS.values():
        for task in tasks:
            if task["id"] == task_id:
                task["status"] = payload.status
                return task
    raise not_found("Task not found.")


@router.get("/admin/sources")
def admin_sources(db: Session = Depends(get_db)) -> list[dict]:
    try:
        db_sources = db.scalars(select(Source)).all()
        if db_sources:
            return [
                {
                    **source_from_model(source),
                    "program_count": len(source.programs),
                    "document_count": len(source.documents),
                }
                for source in db_sources
            ]
    except SQLAlchemyError:
        db.rollback()
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
