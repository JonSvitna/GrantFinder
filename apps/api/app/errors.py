from fastapi import HTTPException


def not_found(message: str) -> HTTPException:
    return HTTPException(status_code=404, detail={"message": message, "code": "NOT_FOUND", "field_errors": {}})
