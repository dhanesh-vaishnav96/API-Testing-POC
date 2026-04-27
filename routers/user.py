from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import hash_password, get_current_user
from database import get_db
from models import User
from schemas import UserCreate, UserUpdate, UserResponse, MessageResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user (requires JWT)",
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new user. Requires authentication."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    new_user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully", "id": new_user.id}


@router.get(
    "",
    response_model=List[UserResponse],
    summary="Get all users",
)
def get_all_users(db: Session = Depends(get_db)):
    """Return a list of all users."""
    users = db.query(User).order_by(User.id).all()
    return users


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get a user by ID",
)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Return a single user by their ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )
    return user


@router.put(
    "/{user_id}",
    response_model=MessageResponse,
    summary="Update a user by ID",
)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing user's name, email, or password."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )

    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        # Check uniqueness
        dup = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use by another user",
            )
        user.email = payload.email
    if payload.password is not None:
        user.password = hash_password(payload.password)

    db.commit()
    return {"message": "User updated successfully", "id": user_id}


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    summary="Delete a user by ID",
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Delete a user by their ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully", "id": user_id}
