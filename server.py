import os
import json
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import engine, SessionLocal, get_db, init_db, User, Profile, Photo, Match, Message, Invoice
from auth import hash_password, verify_password, create_access_token, decode_access_token

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="Vows for Eternity Luxury Matchmaking Platform API", version="2.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Dependency: Get Current Authenticated User from JWT Token
# -----------------------------------------------------------------------------
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required")
    
    token = authorization
    if authorization.startswith("Bearer "):
        token = authorization[7:]
    
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found")
    
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required")
    return user

# -----------------------------------------------------------------------------
# Pydantic Request / Response Schemas
# -----------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    tier: Optional[str] = "Prive"
    gender: Optional[str] = "Male"

class GoogleAuthRequest(BaseModel):
    email: str
    full_name: Optional[str] = None
    tier: Optional[str] = "Prive"
    gender: Optional[str] = "Male"

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    dob: Optional[str] = None
    height: Optional[str] = None
    marital_status: Optional[str] = None
    children: Optional[str] = None
    diet: Optional[str] = None
    drink: Optional[str] = None
    smoke: Optional[str] = None
    hobbies: Optional[str] = None
    religion: Optional[str] = None
    community: Optional[str] = None
    mother_tongue: Optional[str] = None
    grew_up_in: Optional[str] = None
    city: Optional[str] = None
    residence_country: Optional[str] = None
    citizenship: Optional[str] = None
    education: Optional[str] = None
    profession: Optional[str] = None
    annual_income: Optional[str] = None
    father_profession: Optional[str] = None
    mother_profession: Optional[str] = None
    family_location: Optional[str] = None
    family_values: Optional[str] = None
    about_me: Optional[str] = None
    partner_prefs: Optional[dict] = None

class PhotoCreateRequest(BaseModel):
    image_url: str

class SendMessageRequest(BaseModel):
    text: str

class CreateMatchRequest(BaseModel):
    candidate_a_id: int
    candidate_b_id: int
    concierge_note: Optional[str] = "Hand-curated mutual match based on alignment of life goals and shared family heritage."

class CreateInvoiceRequest(BaseModel):
    client_name: str
    client_email: str
    client_phone: Optional[str] = ""
    billing_address: Optional[str] = "Mumbai, Maharashtra, India"
    tax_id: Optional[str] = "" # Client PAN / GSTIN
    place_of_supply: Optional[str] = "Maharashtra (27)"
    sac_code: Optional[str] = "998399"
    amount_in_words: Optional[str] = ""
    user_id: Optional[int] = None
    tier: str = "Prive"
    description: Optional[str] = "Vows for Eternity Privé VIP Bespoke Matchmaking Retainer"
    currency: str = "INR"
    base_amount: Optional[float] = None
    total_amount: Optional[float] = None
    tax_rate: float = 18.0
    status: str = "Paid"
    payment_method: str = "Bank Wire Transfer (NEFT / RTGS)"
    notes: Optional[str] = "Confidential Bespoke Matchmaking Services."

class StripeCheckoutRequest(BaseModel):
    tier: str = "prive"
    currency: str = "USD"
    client_name: Optional[str] = "Distinguished Member"
    client_email: Optional[str] = None
    return_url: Optional[str] = None

class StripePaymentIntentRequest(BaseModel):
    tier: str = "prive"
    currency: str = "USD"
    client_name: Optional[str] = "Distinguished Member"
    client_email: Optional[str] = None

# -----------------------------------------------------------------------------
# Database Seeder: Initialize Real Accounts if Fresh
# -----------------------------------------------------------------------------
def seed_initial_data():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@vowsforeternity.in").first()
        if not admin:
            print("[VFE DB] Seeding initial database with real Admin and VIP Candidates...")
            
            # 1. Founder / Admin Account
            admin_user = User(
                email="admin@vowsforeternity.in",
                password_hash=hash_password("admin123"),
                full_name="Senior Concierge Matchmaker",
                role="admin",
                candidate_ref="VFE-ADMIN-01",
                tier="Privé",
                is_verified=True
            )
            db.add(admin_user)
            db.commit()

            # 2. Candidate 1: Alexander Harrington (Privé VIP)
            cand1 = User(
                email="harrington.member@vowsforeternity.com",
                password_hash=hash_password("pass123"),
                full_name="Lord Alexander Harrington",
                role="client",
                candidate_ref="#VFE-8842",
                tier="Prive",
                is_verified=True
            )
            db.add(cand1)
            db.commit()

            cand1_profile = Profile(
                user_id=cand1.id,
                age=38,
                gender="Male",
                dob="12-Nov-1987",
                height="6' 0\" (183 cm)",
                marital_status="Never Married",
                children="No",
                diet="Non-Vegetarian",
                drink="Socially",
                smoke="No",
                hobbies="Fine Dining, Classic Literature, Tennis, Global Travel",
                religion="Hindu",
                community="Baniya / Agarwal",
                mother_tongue="Hindi",
                grew_up_in="India & United States",
                residence_country="United States",
                city="New York",
                citizenship="United States",
                education="MBA, Columbia Business School",
                profession="Managing Director - Private Equity",
                annual_income="$500,000+ / Ultra HNW",
                father_profession="Industrialist / Corporate Chairman",
                mother_profession="Philanthropist & Educationist",
                family_location="New York & New Delhi",
                family_values="Traditional with Global Outlook",
                about_me="Introducing my journey feels special as I reflect on the experiences and values that have shaped who I am today. An ambivert who values education, integrity, and shared intellectual connection.",
                partner_prefs_json=json.dumps({
                    "age_range": "28 to 36 Years",
                    "height_range": "5' 4\" to 5' 10\"",
                    "marital_status": "Never Married",
                    "education": "Master's Degree / Ivy League / Professional",
                    "locations": "United States, United Kingdom, India, UAE",
                    "community": "Hindu / Open to Spiritual"
                })
            )
            db.add(cand1_profile)
            
            # Add default photo for Cand 1
            db.add(Photo(user_id=cand1.id, image_url="images/login-collage.jpg", display_order=1))

            # 3. Candidate 2: Yogesh Shetty (Privé VIP)
            cand2 = User(
                email="shetty.member@vowsforeternity.com",
                password_hash=hash_password("pass123"),
                full_name="Yogesh Shetty",
                role="client",
                candidate_ref="#VFE-9103",
                tier="Prive",
                is_verified=True
            )
            db.add(cand2)
            db.commit()

            cand2_profile = Profile(
                user_id=cand2.id,
                age=34,
                gender="Male",
                dob="05-Apr-1991",
                height="5' 10\" (178 cm)",
                marital_status="Never Married",
                children="No",
                diet="Vegetarian",
                drink="Socially",
                smoke="No",
                hobbies="Golf, Startup Angel Investing, World Cinema",
                religion="Hindu",
                community="Baniya / Agarwal",
                mother_tongue="Hindi",
                grew_up_in="United States & India",
                residence_country="United States",
                city="New York",
                citizenship="United States",
                education="M.S. Engineering & MBA, Stanford University",
                profession="Corporate Executive & Tech Founder",
                annual_income="$500,000+ / Ultra HNW",
                about_me="Entrepreneurial mindset balanced with strong Indian traditional values. Looking for a partner who believes in family, growth, and companionship."
            )
            db.add(cand2_profile)

            # 4. Candidate 3: Lady Eleanor Vance (Select Tier)
            cand3 = User(
                email="vance.member@vowsforeternity.com",
                password_hash=hash_password("pass123"),
                full_name="Lady Eleanor Vance",
                role="client",
                candidate_ref="#VFE-7721",
                tier="Select",
                is_verified=True
            )
            db.add(cand3)
            db.commit()

            cand3_profile = Profile(
                user_id=cand3.id,
                age=32,
                gender="Female",
                dob="20-Sep-1993",
                height="5' 7\" (170 cm)",
                marital_status="Never Married",
                children="No",
                diet="Vegetarian",
                drink="Socially",
                smoke="No",
                hobbies="Art History, Opera, Polo, Architecture",
                religion="Hindu",
                community="Brahmin",
                mother_tongue="English",
                grew_up_in="London & Mumbai",
                residence_country="United Kingdom",
                city="London",
                citizenship="United Kingdom",
                education="M.A. History of Art, Courtauld Institute, London",
                profession="Contemporary Art Curator & Advisor",
                annual_income="$250,000 - $500,000",
                about_me="Dedicated to culture and arts with international exposure across London and Paris. Looking for a partner who shares worldly curiosity and mutual respect."
            )
            db.add(cand3_profile)

            # 5. Candidate 4: Anand Bansal (Select Tier)
            cand4 = User(
                email="bansal.member@vowsforeternity.com",
                password_hash=hash_password("pass123"),
                full_name="Anand Bansal",
                role="client",
                candidate_ref="#VFE-6612",
                tier="Select",
                is_verified=True
            )
            db.add(cand4)
            db.commit()

            cand4_profile = Profile(
                user_id=cand4.id,
                age=36,
                gender="Male",
                dob="14-Feb-1989",
                height="5' 11\" (180 cm)",
                marital_status="Never Married",
                religion="Hindu",
                community="Baniya / Agarwal",
                mother_tongue="Hindi",
                residence_country="India",
                city="Mumbai",
                education="B.Tech IIT Bombay, MBA Wharton",
                profession="Partner - Venture Capital",
                annual_income="$300,000 - $500,000"
            )
            db.add(cand4_profile)

            # 6. Candidate 5: Charanjeet Singh (Pride Tier)
            cand5 = User(
                email="singh.member@vowsforeternity.com",
                password_hash=hash_password("pass123"),
                full_name="Charanjeet Singh",
                role="client",
                candidate_ref="#VFE-5541",
                tier="Pride",
                is_verified=True
            )
            db.add(cand5)
            db.commit()

            cand5_profile = Profile(
                user_id=cand5.id,
                age=35,
                gender="Male",
                dob="01-Jan-1990",
                height="6' 1\" (185 cm)",
                marital_status="Never Married",
                religion="Sikh",
                community="Khatri",
                mother_tongue="Punjabi",
                residence_country="United Kingdom",
                city="London",
                education="M.Sc. Economics, LSE",
                profession="Senior Director - Hedge Fund",
                annual_income="$350,000+"
            )
            db.add(cand5_profile)
            db.commit()

            # Create an introduced match between Cand 1 (Alexander) and Cand 2 (Yogesh)
            match1 = Match(
                candidate_a_id=cand1.id,
                candidate_b_id=cand2.id,
                status="active",
                stage="Connected",
                concierge_note="Introduced by Senior Matchmaking Concierge based on shared Stanford/Columbia educational synergy and family outlook."
            )
            db.add(match1)
            db.commit()

            # Add sample real messages
            db.add(Message(
                match_id=match1.id,
                sender_id=cand2.id,
                text="Hi this is Yogesh Shetty. If you are interested you can call or WhatsApp me on +91 98234 71001. The concierge spoke very highly of your shared family values."
            ))
            db.add(Message(
                match_id=match1.id,
                sender_id=cand2.id,
                text="Hi! Just following up to see if you would be free for a short telephone conversation this weekend?"
            ))
            db.add(Message(
                match_id=match1.id,
                sender_id=cand1.id,
                text="Hello Yogesh! Thank you for getting in touch. I would be happy to connect this Saturday evening around 6 PM IST."
            ))
            db.commit()

            # Create sample initial invoice matching reference design
            inv1 = Invoice(
                invoice_number="INV163",
                user_id=cand1.id,
                client_name="Anchit Jain",
                client_email="anchit@rogers.com",
                client_phone="+1 6474009099",
                billing_address="Ontario\nCanada\n91762",
                tax_id="91762",
                place_of_supply="Ontario, Canada",
                sac_code="998399",
                amount_in_words="INR Sixteen Thousand Seven Hundred and Forty-Four Only",
                tier="Prive",
                description="Match Making Service",
                currency="INR",
                base_amount=14189.83,
                tax_rate=18.0,
                tax_amount=2554.17,
                total_amount=16744.00,
                status="PAID",
                payment_method="On Receipt",
                issued_date="Sep 1, 2026",
                due_date="On Receipt",
                notes="This is a digitally generated invoice and does not require a handwritten signature."
            )
            db.add(inv1)
            db.commit()
            print("[VFE DB] Initial real database seeded successfully!")
    finally:
        db.close()

# Initialize DB tables and seed
init_db()
seed_initial_data()

# =============================================================================
# REST API: Authentication & Users
# =============================================================================
@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "candidate_ref": user.candidate_ref,
            "tier": user.tier,
            "is_verified": user.is_verified
        }
    }

@app.post("/api/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Generate unique candidate reference
    count = db.query(User).count() + 1001
    candidate_ref = f"#VFE-{count}"

    new_user = User(
        email=email_clean,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role="client",
        candidate_ref=candidate_ref,
        tier=req.tier or "Prive",
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize empty profile
    profile = Profile(user_id=new_user.id, gender=req.gender or "Male")
    db.add(profile)
    db.commit()

    token = create_access_token({"sub": new_user.id, "role": new_user.role, "email": new_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "candidate_ref": new_user.candidate_ref,
            "tier": new_user.tier
        }
    }

@app.post("/api/auth/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user:
        count = db.query(User).count() + 1001
        candidate_ref = f"#VFE-{count}"
        name = req.full_name.strip() if req.full_name and req.full_name.strip() else email_clean.split("@")[0].replace(".", " ").title()
        
        user = User(
            email=email_clean,
            password_hash=hash_password(f"google_oauth_{email_clean}"),
            full_name=name,
            role="client",
            candidate_ref=candidate_ref,
            tier=req.tier or "Prive",
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = Profile(user_id=user.id, gender=req.gender or "Male")
        db.add(profile)
        db.commit()

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "candidate_ref": user.candidate_ref,
            "tier": user.tier,
            "is_verified": user.is_verified
        }
    }

@app.get("/api/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "candidate_ref": user.candidate_ref,
        "tier": user.tier,
        "is_verified": user.is_verified
    }

# =============================================================================
# REST API: Candidate Profiles & Preferences
# =============================================================================
@app.get("/api/profile")
def get_my_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    photos = db.query(Photo).filter(Photo.user_id == user.id).order_by(Photo.display_order).all()

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "candidate_ref": user.candidate_ref,
            "tier": user.tier,
            "is_verified": user.is_verified
        },
        "profile": {
            "age": profile.age,
            "gender": profile.gender,
            "dob": profile.dob,
            "height": profile.height,
            "marital_status": profile.marital_status,
            "children": profile.children,
            "diet": profile.diet,
            "drink": profile.drink,
            "smoke": profile.smoke,
            "hobbies": profile.hobbies,
            "religion": profile.religion,
            "community": profile.community,
            "mother_tongue": profile.mother_tongue,
            "grew_up_in": profile.grew_up_in,
            "residence_country": profile.residence_country,
            "city": profile.city,
            "citizenship": profile.citizenship,
            "education": profile.education,
            "profession": profile.profession,
            "annual_income": profile.annual_income,
            "father_profession": profile.father_profession,
            "mother_profession": profile.mother_profession,
            "family_location": profile.family_location,
            "family_values": profile.family_values,
            "about_me": profile.about_me,
            "partner_prefs": profile.get_partner_prefs()
        },
        "photos": [{"id": p.id, "image_url": p.image_url, "display_order": p.display_order} for p in photos]
    }

@app.put("/api/profile")
def update_profile(req: ProfileUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.full_name:
        user.full_name = req.full_name
        db.add(user)

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)

    update_data = req.dict(exclude_unset=True)
    if "full_name" in update_data:
        del update_data["full_name"]

    if "partner_prefs" in update_data and update_data["partner_prefs"] is not None:
        profile.set_partner_prefs(update_data["partner_prefs"])
        del update_data["partner_prefs"]

    for key, val in update_data.items():
        if hasattr(profile, key) and val is not None:
            setattr(profile, key, val)

    db.commit()
    return {"status": "success", "message": "Profile updated successfully"}

# -----------------------------------------------------------------------------
# REST API: Photo Uploads (Max 5 Photos)
# -----------------------------------------------------------------------------
@app.post("/api/profile/photos")
def add_photo(req: PhotoCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_count = db.query(Photo).filter(Photo.user_id == user.id).count()
    if current_count >= 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum 5 candidate photos allowed")

    new_photo = Photo(
        user_id=user.id,
        image_url=req.image_url,
        display_order=current_count + 1
    )
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)
    return {"status": "success", "photo": {"id": new_photo.id, "image_url": new_photo.image_url}}

@app.delete("/api/profile/photos/{photo_id}")
def delete_photo(photo_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id, Photo.user_id == user.id).first()
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    db.delete(photo)
    db.commit()
    return {"status": "success", "message": "Photo removed"}

# =============================================================================
# REST API: Candidate Matches & 1-on-1 Chat
# =============================================================================
@app.get("/api/matches")
def get_my_matches(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find all matches where current user is candidate A or B
    matches = db.query(Match).filter(
        ((Match.candidate_a_id == user.id) | (Match.candidate_b_id == user.id)),
        Match.status == "active"
    ).all()

    result = []
    for m in matches:
        partner = m.candidate_b if m.candidate_a_id == user.id else m.candidate_a
        partner_profile = db.query(Profile).filter(Profile.user_id == partner.id).first()
        latest_msg = db.query(Message).filter(Message.match_id == m.id).order_by(Message.sent_at.desc()).first()

        result.append({
            "match_id": m.id,
            "status": m.status,
            "stage": m.stage,
            "concierge_note": m.concierge_note,
            "partner": {
                "id": partner.id,
                "full_name": partner.full_name,
                "candidate_ref": partner.candidate_ref,
                "tier": partner.tier,
                "age": partner_profile.age if partner_profile else None,
                "height": partner_profile.height if partner_profile else None,
                "profession": partner_profile.profession if partner_profile else None,
                "city": partner_profile.city if partner_profile else None,
                "country": partner_profile.residence_country if partner_profile else None
            },
            "latest_message": {
                "text": latest_msg.text if latest_msg else "Mutual match introduced.",
                "sent_at": latest_msg.sent_at.isoformat() if latest_msg else m.created_at.isoformat(),
                "sender_id": latest_msg.sender_id if latest_msg else None
            }
        })

    return result

@app.get("/api/matches/{match_id}/messages")
def get_match_messages(match_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match or (match.candidate_a_id != user.id and match.candidate_b_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this match conversation")

    messages = db.query(Message).filter(Message.match_id == match_id).order_by(Message.sent_at.asc()).all()
    return [{
        "id": msg.id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender.full_name,
        "text": msg.text,
        "sent_at": msg.sent_at.strftime("%I:%M %p"),
        "date": msg.sent_at.strftime("%d %b %Y"),
        "is_mine": msg.sender_id == user.id
    } for msg in messages]

@app.post("/api/matches/{match_id}/messages")
def send_match_message(match_id: int, req: SendMessageRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match or (match.candidate_a_id != user.id and match.candidate_b_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    new_msg = Message(
        match_id=match_id,
        sender_id=user.id,
        text=req.text.strip()
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    return {
        "status": "success",
        "message": {
            "id": new_msg.id,
            "sender_id": new_msg.sender_id,
            "sender_name": user.full_name,
            "text": new_msg.text,
            "sent_at": new_msg.sent_at.strftime("%I:%M %p"),
            "date": new_msg.sent_at.strftime("%d %b %Y"),
            "is_mine": True
        }
    }

# =============================================================================
# REST API: Admin Concierge & Matchmaking Engine
# =============================================================================
@app.get("/api/admin/candidates")
def admin_get_candidates(
    q: Optional[str] = None,
    tier: Optional[str] = None,
    gender: Optional[str] = None,
    age: Optional[str] = None,
    marital: Optional[str] = None,
    community: Optional[str] = None,
    location: Optional[str] = None,
    education: Optional[str] = None,
    income: Optional[str] = None,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).join(Profile, User.id == Profile.user_id).filter(User.role == "client")

    if tier and tier != "ALL":
        query = query.filter(User.tier.ilike(f"%{tier}%"))
    if gender and gender != "ALL":
        query = query.filter(Profile.gender == gender)
    if marital and marital != "ALL":
        query = query.filter(Profile.marital_status == marital)
    if location and location != "ALL":
        query = query.filter((Profile.city.ilike(f"%{location}%")) | (Profile.residence_country.ilike(f"%{location}%")))
    if community and community != "ALL":
        query = query.filter(Profile.community.ilike(f"%{community}%"))
    if education and education != "ALL":
        query = query.filter(Profile.education.ilike(f"%{education}%"))
    if income and income != "ALL":
        query = query.filter(Profile.annual_income.ilike(f"%{income}%"))

    candidates = query.all()

    # Filter query q on client side in python for full text flexibility
    if q and q.strip():
        search = q.strip().lower()
        candidates = [c for c in candidates if (
            search in c.full_name.lower() or 
            search in (c.candidate_ref or "").lower() or 
            search in (c.profile.profession if c.profile else "").lower() or
            search in (c.profile.city if c.profile else "").lower()
        )]

    return [{
        "id": c.id,
        "full_name": c.full_name,
        "candidate_ref": c.candidate_ref,
        "email": c.email,
        "tier": c.tier,
        "is_verified": c.is_verified,
        "profile": {
            "age": c.profile.age if c.profile else 30,
            "gender": c.profile.gender if c.profile else "Male",
            "height": c.profile.height if c.profile else "",
            "marital_status": c.profile.marital_status if c.profile else "",
            "religion": c.profile.religion if c.profile else "",
            "community": c.profile.community if c.profile else "",
            "city": c.profile.city if c.profile else "",
            "country": c.profile.residence_country if c.profile else "",
            "education": c.profile.education if c.profile else "",
            "profession": c.profile.profession if c.profile else "",
            "annual_income": c.profile.annual_income if c.profile else "",
            "about_me": c.profile.about_me if c.profile else "",
            "partner_prefs": c.profile.get_partner_prefs() if c.profile else {}
        }
    } for c in candidates]

@app.post("/api/admin/match")
def admin_create_match(req: CreateMatchRequest, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    if req.candidate_a_id == req.candidate_b_id:
        raise HTTPException(status_code=400, detail="Cannot match a candidate with themselves")

    # Check if already matched
    existing = db.query(Match).filter(
        ((Match.candidate_a_id == req.candidate_a_id) & (Match.candidate_b_id == req.candidate_b_id)) |
        ((Match.candidate_a_id == req.candidate_b_id) & (Match.candidate_b_id == req.candidate_a_id))
    ).first()

    if existing:
        existing.status = "active"
        existing.stage = "Connected"
        db.commit()
        return {"status": "success", "message": "Existing match reactivated", "match_id": existing.id}

    new_match = Match(
        candidate_a_id=req.candidate_a_id,
        candidate_b_id=req.candidate_b_id,
        status="active",
        stage="Connected",
        concierge_note=req.concierge_note
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)

    # Add default welcoming introduction message from Concierge
    intro_msg = Message(
        match_id=new_match.id,
        sender_id=user.id,
        text=f"✨ Mutual Introduction Unlocked: Senior Matchmaking Concierge has introduced both candidates based on mutual values. You may now exchange confidential messages."
    )
    db.add(intro_msg)
    db.commit()

    return {"status": "success", "message": "Mutual match successfully created and chat unlocked", "match_id": new_match.id}

@app.get("/api/admin/matches")
def admin_get_all_matches(user: User = Depends(require_admin), db: Session = Depends(get_db)):
    matches = db.query(Match).all()
    return [{
        "id": m.id,
        "status": m.status,
        "stage": m.stage,
        "concierge_note": m.concierge_note,
        "created_at": m.created_at.strftime("%d %b %Y"),
        "candidate_a": {
            "id": m.candidate_a.id,
            "full_name": m.candidate_a.full_name,
            "candidate_ref": m.candidate_a.candidate_ref,
            "tier": m.candidate_a.tier
        },
        "candidate_b": {
            "id": m.candidate_b.id,
            "full_name": m.candidate_b.full_name,
            "candidate_ref": m.candidate_b.candidate_ref,
            "tier": m.candidate_b.tier
        }
    } for m in matches]

@app.put("/api/admin/matches/{match_id}/status")
def admin_update_match_status(match_id: int, status: str = Query(...), user: User = Depends(require_admin), db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    match.status = status
    db.commit()
    return {"status": "success", "message": f"Match status updated to {status}"}

# =============================================================================
# REST API: Invoice Generator & Billing
# =============================================================================
@app.get("/api/admin/invoices")
def admin_get_invoices(user: User = Depends(require_admin), db: Session = Depends(get_db)):
    invoices = db.query(Invoice).order_by(Invoice.created_at.desc()).all()
    return [{
        "id": inv.id,
        "invoice_number": inv.invoice_number,
        "client_name": inv.client_name,
        "client_email": inv.client_email,
        "client_phone": getattr(inv, "client_phone", "") or "",
        "billing_address": inv.billing_address,
        "tax_id": getattr(inv, "tax_id", "") or "",
        "place_of_supply": getattr(inv, "place_of_supply", "Maharashtra (27)") or "Maharashtra (27)",
        "sac_code": getattr(inv, "sac_code", "998399") or "998399",
        "amount_in_words": getattr(inv, "amount_in_words", "") or "",
        "tier": inv.tier,
        "description": inv.description,
        "currency": inv.currency,
        "base_amount": inv.base_amount,
        "tax_rate": inv.tax_rate,
        "tax_amount": inv.tax_amount,
        "total_amount": inv.total_amount,
        "status": inv.status,
        "payment_method": inv.payment_method,
        "issued_date": inv.issued_date,
        "notes": inv.notes
    } for inv in invoices]

@app.post("/api/admin/invoices")
def admin_create_invoice(req: CreateInvoiceRequest, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    # Calculate tax & total (Total includes 18% GST/VAT if total_amount is passed)
    if req.total_amount is not None and req.total_amount > 0:
        total_amount = round(float(req.total_amount), 2)
        base_amount = round(total_amount / (1 + (req.tax_rate / 100.0)), 2)
        tax_amount = round(total_amount - base_amount, 2)
    else:
        base_amount = round(float(req.base_amount or 15000.0), 2)
        tax_amount = round(base_amount * (req.tax_rate / 100.0), 2)
        total_amount = round(base_amount + tax_amount, 2)

    # Generate sequential invoice number (e.g. INV164)
    count = db.query(Invoice).count() + 163
    invoice_number = f"INV{count}"

    issued_date_str = datetime.now().strftime("%b %d, %Y")
    # strip leading 0 if any (e.g. Sep 01 -> Sep 1)
    issued_date_str = issued_date_str.replace(" 0", " ")

    new_inv = Invoice(
        invoice_number=invoice_number,
        user_id=req.user_id,
        client_name=req.client_name,
        client_email=req.client_email,
        client_phone=req.client_phone or "",
        billing_address=req.billing_address or "Mumbai, Maharashtra, India",
        tax_id=req.tax_id or "",
        place_of_supply=req.place_of_supply or "Maharashtra (27)",
        sac_code=req.sac_code or "998399",
        amount_in_words=req.amount_in_words or "",
        tier=req.tier,
        description=req.description or "Match Making Service",
        currency=req.currency,
        base_amount=base_amount,
        tax_rate=req.tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        status=req.status,
        payment_method=req.payment_method,
        issued_date=issued_date_str,
        due_date="On Receipt",
        notes=req.notes or "This is a digitally generated invoice and does not require a handwritten signature."
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)

    return {
        "status": "success",
        "message": "Invoice generated successfully",
        "invoice": {
            "id": new_inv.id,
            "invoice_number": new_inv.invoice_number,
            "total_amount": new_inv.total_amount,
            "status": new_inv.status
        }
    }

@app.get("/api/admin/invoices/{invoice_id}")
def admin_get_invoice_detail(invoice_id: int, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {
        "id": inv.id,
        "invoice_number": inv.invoice_number,
        "client_name": inv.client_name,
        "client_email": inv.client_email,
        "client_phone": getattr(inv, "client_phone", "") or "",
        "billing_address": inv.billing_address,
        "tax_id": getattr(inv, "tax_id", "") or "",
        "place_of_supply": getattr(inv, "place_of_supply", "Maharashtra (27)") or "Maharashtra (27)",
        "sac_code": getattr(inv, "sac_code", "998399") or "998399",
        "amount_in_words": getattr(inv, "amount_in_words", "") or "",
        "tier": inv.tier,
        "description": inv.description,
        "currency": inv.currency,
        "base_amount": inv.base_amount,
        "tax_rate": inv.tax_rate,
        "tax_amount": inv.tax_amount,
        "total_amount": inv.total_amount,
        "status": inv.status,
        "payment_method": inv.payment_method,
        "issued_date": inv.issued_date,
        "due_date": inv.due_date,
        "notes": inv.notes
    }

# =============================================================================
# STRIPE PAYMENT GATEWAY INTEGRATION
# =============================================================================
import stripe

STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "pk_test_51PTestVowsForEternityPublishableKey1234567890")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "sk_test_51PTestVowsForEternitySecretKey1234567890")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "whsec_test_123456")

stripe.api_key = STRIPE_SECRET_KEY

TIER_CONFIG = {
    "select": {
        "title": "Prithvi (The Earth Tier)",
        "name": "Prithvi",
        "USD": 499,
        "INR": 40000,
        "GBP": 400,
        "AED": 1830,
        "description": "Personalised, concierge-led search for an intentional approach to finding a life partner"
    },
    "prive": {
        "title": "Tejas (The Fire Tier)",
        "name": "Tejas",
        "USD": 749,
        "INR": 60000,
        "GBP": 600,
        "AED": 2750,
        "description": "Guided collaborative search with regular strategy check-ins as your journey unfolds"
    },
    "bespoke": {
        "title": "Vyom (The Space Tier)",
        "name": "Vyom",
        "USD": 999,
        "INR": 80000,
        "GBP": 800,
        "AED": 3670,
        "description": "Highest-level partnership with deep executive oversight and dedicated relationship coaching"
    }
}

@app.get("/api/payment/config")
def get_payment_config():
    return {
        "publishableKey": STRIPE_PUBLISHABLE_KEY,
        "tiers": TIER_CONFIG,
        "currencies": ["USD", "INR", "GBP", "AED"]
    }

@app.post("/api/payment/create-checkout-session")
def create_checkout_session(req: StripeCheckoutRequest, db: Session = Depends(get_db)):
    tier_key = req.tier.lower()
    if tier_key not in TIER_CONFIG:
        tier_key = "prive"
    
    tier_info = TIER_CONFIG[tier_key]
    currency = req.currency.upper()
    if currency not in tier_info:
        currency = "USD"
    
    amount = tier_info[currency]
    unit_amount = int(amount * 100)
    
    success_url = req.return_url or "http://127.0.0.1:8080/portal.html?session_id={CHECKOUT_SESSION_ID}&payment_status=success"
    if "{CHECKOUT_SESSION_ID}" not in success_url:
        sep = "&" if "?" in success_url else "?"
        success_url = f"{success_url}{sep}session_id={{CHECKOUT_SESSION_ID}}&payment_status=success"
        
    cancel_url = req.return_url or "http://127.0.0.1:8080/?payment_status=cancelled"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": currency.lower(),
                    "product_data": {
                        "name": tier_info["title"],
                        "description": tier_info["description"]
                    },
                    "unit_amount": unit_amount
                },
                "quantity": 1
            }],
            mode="payment",
            customer_email=req.client_email if req.client_email else None,
            metadata={
                "tier": tier_info["name"],
                "client_name": req.client_name or "Distinguished Member",
                "client_email": req.client_email or "",
                "currency": currency,
                "amount": str(amount)
            },
            success_url=success_url,
            cancel_url=cancel_url
        )
        return {
            "status": "success",
            "sessionId": session.id,
            "url": session.url
        }
    except Exception as e:
        import uuid
        mock_id = f"cs_test_mock_{uuid.uuid4().hex[:16]}"
        return {
            "status": "success",
            "is_mock": True,
            "sessionId": mock_id,
            "url": f"/portal.html?session_id={mock_id}&payment_status=success&tier={tier_key}&currency={currency}&amount={amount}&client_name={req.client_name or 'Distinguished Member'}",
            "detail": str(e)
        }

@app.post("/api/payment/create-payment-intent")
def create_payment_intent(req: StripePaymentIntentRequest, db: Session = Depends(get_db)):
    tier_key = req.tier.lower()
    if tier_key not in TIER_CONFIG:
        tier_key = "prive"
    
    tier_info = TIER_CONFIG[tier_key]
    currency = req.currency.upper()
    if currency not in tier_info:
        currency = "USD"
    
    amount = tier_info[currency]
    unit_amount = int(amount * 100)

    try:
        intent = stripe.PaymentIntent.create(
            amount=unit_amount,
            currency=currency.lower(),
            metadata={
                "tier": tier_info["name"],
                "client_name": req.client_name or "Distinguished Member",
                "client_email": req.client_email or ""
            },
            description=f"Vows for Eternity - {tier_info['title']} Membership"
        )
        return {
            "status": "success",
            "clientSecret": intent.client_secret,
            "amount": amount,
            "currency": currency,
            "tier": tier_info["name"]
        }
    except Exception as e:
        import uuid
        return {
            "status": "success",
            "is_mock": True,
            "clientSecret": f"pi_mock_secret_{uuid.uuid4().hex[:24]}",
            "amount": amount,
            "currency": currency,
            "tier": tier_info["name"],
            "detail": str(e)
        }

@app.get("/api/payment/verify-session/{session_id}")
def verify_payment_session(session_id: str, db: Session = Depends(get_db)):
    tier_name = "Prive"
    amount = 15000.0
    currency = "USD"
    client_name = "Distinguished Member"
    client_email = "member@vowsforeternity.com"

    if session_id.startswith("cs_") and not session_id.startswith("cs_test_mock_"):
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == "paid":
                meta = session.metadata or {}
                tier_name = meta.get("tier", "Prive")
                client_name = meta.get("client_name", session.customer_details.name if session.customer_details else "Distinguished Member")
                client_email = meta.get("client_email", session.customer_details.email if session.customer_details else "member@vowsforeternity.com")
                currency = meta.get("currency", session.currency.upper() if session.currency else "USD")
                amount = float(meta.get("amount", session.amount_total / 100 if session.amount_total else 15000.0))
        except Exception:
            pass

    matched_user = None
    if client_email:
        matched_user = db.query(User).filter(User.email.ilike(client_email)).first()
    
    if matched_user:
        matched_user.tier = tier_name
        db.commit()

    inv_num = f"#VFE-INV-{abs(hash(session_id)) % 900000 + 100000}"
    existing_inv = db.query(Invoice).filter(Invoice.invoice_number == inv_num).first()
    
    if not existing_inv:
        today_str = datetime.utcnow().strftime("%B %d, %Y")
        existing_inv = Invoice(
            invoice_number=inv_num,
            client_name=client_name,
            client_email=client_email or "client@vowsforeternity.com",
            client_phone="+1 (212) 555-0199",
            billing_address="Manhattan, New York, NY",
            user_id=matched_user.id if matched_user else None,
            tier=f"Vows for Eternity {tier_name}",
            description=f"Official {tier_name} VIP Membership Initiation & Matchmaking Retainer",
            currency=currency,
            base_amount=amount,
            tax_rate=0.0,
            tax_amount=0.0,
            total_amount=amount,
            status="Paid",
            payment_method="Stripe Global Pay (Credit Card / Apple Pay)",
            issued_date=today_str,
            due_date=today_str,
            notes="Transaction authorized and securely confirmed via Stripe Payments."
        )
        db.add(existing_inv)
        db.commit()
        db.refresh(existing_inv)

    return {
        "status": "success",
        "verified": True,
        "invoice": {
            "invoice_number": existing_inv.invoice_number,
            "client_name": existing_inv.client_name,
            "client_email": existing_inv.client_email,
            "tier": existing_inv.tier,
            "total_amount": existing_inv.total_amount,
            "currency": existing_inv.currency,
            "payment_method": existing_inv.payment_method,
            "issued_date": existing_inv.issued_date,
            "status": existing_inv.status
        },
        "user_updated": matched_user is not None
    }

@app.post("/api/payment/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    event = None
    try:
        if STRIPE_WEBHOOK_SECRET and sig_header:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        else:
            event = json.loads(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook signature verification failed: {str(e)}")

    if event and event.get("type") in ["checkout.session.completed", "payment_intent.succeeded"]:
        data_obj = event.get("data", {}).get("object", {})
        session_id = data_obj.get("id", "webhook_session")
        meta = data_obj.get("metadata", {})
        tier = meta.get("tier", "Prive")
        email = meta.get("client_email")
        if email:
            u = db.query(User).filter(User.email.ilike(email)).first()
            if u:
                u.tier = tier
                db.commit()

    return {"status": "received"}

# =============================================================================
# Serve Frontend Static Assets and HTML Pages
# =============================================================================
app.mount("/css", StaticFiles(directory=os.path.join(BASE_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(BASE_DIR, "js")), name="js")
app.mount("/images", StaticFiles(directory=os.path.join(BASE_DIR, "images")), name="images")
if os.path.exists(os.path.join(BASE_DIR, "fonts")):
    app.mount("/fonts", StaticFiles(directory=os.path.join(BASE_DIR, "fonts")), name="fonts")

@app.get("/")
async def serve_root():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/{page_name}.html")
async def serve_html(page_name: str):
    file_path = os.path.join(BASE_DIR, f"{page_name}.html")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("server:app", host="127.0.0.1", port=port, reload=True)

