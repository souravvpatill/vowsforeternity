import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_FILE = os.path.join(os.path.dirname(__file__), "vfe.db")
DATABASE_URL = f"sqlite:///{DB_FILE}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="client")  # "client" or "admin"
    candidate_ref = Column(String, unique=True, nullable=True)  # e.g. #VFE-8842
    tier = Column(String, default="Prive")   # "Prive", "Select", "Pride"
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Basics
    age = Column(Integer, default=34)
    gender = Column(String, default="Male")  # "Male", "Female"
    dob = Column(String, default="12-Nov-1990")
    height = Column(String, default="6' 0\" (183 cm)")
    marital_status = Column(String, default="Never Married")
    children = Column(String, default="No")
    diet = Column(String, default="Non-Vegetarian")
    drink = Column(String, default="Socially")
    smoke = Column(String, default="No")
    hobbies = Column(String, default="Fine Dining, Reading, Tennis, Art Collecting")
    
    # Cultural & Religious
    religion = Column(String, default="Hindu")
    community = Column(String, default="Baniya / Agarwal")
    mother_tongue = Column(String, default="Hindi")
    grew_up_in = Column(String, default="India & United States")
    
    # Location
    residence_country = Column(String, default="United States")
    city = Column(String, default="New York")
    citizenship = Column(String, default="United States")
    
    # Career & Education
    education = Column(String, default="MBA, Columbia Business School")
    profession = Column(String, default="Managing Director - Private Equity")
    annual_income = Column(String, default="$500,000+ / Ultra HNW")
    
    # Family Details
    father_profession = Column(String, default="Industrialist / Corporate Chairman")
    mother_profession = Column(String, default="Philanthropist & Educationist")
    family_location = Column(String, default="New York & New Delhi")
    family_values = Column(String, default="Traditional with Global Outlook")
    
    # Bio
    about_me = Column(Text, default="Driven by a deep appreciation for culture, education, and shared values. Seeking a compassionate partner with a worldly perspective.")
    
    # Partner Preferences (stored as JSON string)
    partner_prefs_json = Column(Text, default="{}")

    user = relationship("User", back_populates="profile")

    def get_partner_prefs(self):
        try:
            return json.loads(self.partner_prefs_json) if self.partner_prefs_json else {}
        except Exception:
            return {}

    def set_partner_prefs(self, prefs_dict):
        self.partner_prefs_json = json.dumps(prefs_dict)

class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(Text, nullable=False)  # file path or data URI
    display_order = Column(Integer, default=1)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="photos")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    candidate_a_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    candidate_b_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="active")  # "active", "paused", "archived"
    stage = Column(String, default="Connected") # "Connected", "Call Scheduled", "Meeting Arranged"
    concierge_note = Column(Text, default="Curated mutual introduction based on shared family values and lifestyle.")
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate_a = relationship("User", foreign_keys=[candidate_a_id])
    candidate_b = relationship("User", foreign_keys=[candidate_b_id])
    messages = relationship("Message", back_populates="match", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

    match = relationship("Match", back_populates="messages")
    sender = relationship("User")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)  # e.g. VFE-INV-2026-0042
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    client_name = Column(String, nullable=False)
    client_email = Column(String, nullable=False)
    billing_address = Column(Text, default="New York, NY")
    client_phone = Column(String, default="")
    tax_id = Column(String, default="")
    place_of_supply = Column(String, default="Maharashtra (27)")
    sac_code = Column(String, default="998399")
    amount_in_words = Column(String, default="")
    
    tier = Column(String, default="Prive") # "Prive", "Select", "Pride", "Bespoke"
    description = Column(String, default="Vows for Eternity Privé VIP Bespoke Matchmaking Retainer")
    currency = Column(String, default="USD") # "USD" or "INR"
    base_amount = Column(Float, default=15000.00)
    tax_rate = Column(Float, default=18.0) # 18% GST / VAT
    tax_amount = Column(Float, default=2700.00)
    total_amount = Column(Float, default=17700.00)
    
    status = Column(String, default="Paid") # "Paid", "Pending Wire Transfer", "Overdue"
    payment_method = Column(String, default="Wire Transfer / Amex")
    issued_date = Column(String, default="")
    due_date = Column(String, default="")
    notes = Column(Text, default="Thank you for trusting Vows for Eternity with your personalized matchmaking journey.")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="invoices")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
