"""
Saksham Learning - Backend API
FastAPI + MongoDB + JWT/Google Auth + Razorpay
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import uuid
import bcrypt
import jwt
import logging
import secrets
import hmac
import hashlib
import requests
import razorpay
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ------------------ Config ------------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
TEST_USER_EMAIL = os.environ.get("TEST_USER_EMAIL", "parent@test.com")
TEST_USER_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "Parent@123")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RAZORPAY_MOCK_MODE = os.environ.get("RAZORPAY_MOCK_MODE", "true").lower() == "true"
WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "919999999999")

UPLOAD_DIR = ROOT_DIR / "uploads"
WORKSHEETS_DIR = UPLOAD_DIR / "worksheets"
SAMPLES_DIR = UPLOAD_DIR / "samples"
WORKSHEETS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

# ------------------ DB ------------------
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# ------------------ App ------------------
app = FastAPI(title="Saksham Learning API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger("saksham")

# ------------------ Razorpay ------------------
rzp_client = None
if RAZORPAY_KEY_ID and not RAZORPAY_MOCK_MODE:
    try:
        rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except Exception as e:
        log.warning(f"Razorpay init failed, using mock mode: {e}")

# ------------------ Helpers ------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

async def get_user_from_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        return user
    except Exception:
        return None

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )

# ------------------ Models ------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class GoogleSessionIn(BaseModel):
    session_id: str

class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    picture: Optional[str] = None
    created_at: str

class WorksheetIn(BaseModel):
    title: str
    description: str
    grade: str  # "KG", "1", ..., "9"
    subject: Literal["english", "maths", "science", "sst"]
    level: Literal["easy", "moderate", "difficult"]
    price: int  # in rupees (whole)
    pages: int = 1
    cover_image: Optional[str] = None
    is_free: bool = False
    is_published: bool = True

class WorksheetOut(WorksheetIn):
    worksheet_id: str
    has_pdf: bool = False
    has_sample: bool = False
    created_at: str

class CartItemIn(BaseModel):
    worksheet_id: str
    quantity: int = 1

class CreateOrderIn(BaseModel):
    items: List[CartItemIn]

class VerifyPaymentIn(BaseModel):
    order_id: str  # our order id
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    mock: bool = False

class NewsletterIn(BaseModel):
    email: EmailStr

class TestimonialIn(BaseModel):
    parent_name: str
    location: str
    quote: str
    child_grade: Optional[str] = None
    rating: int = 5
    is_featured: bool = True

class BlogPostIn(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    cover_image: Optional[str] = None
    author: str = "Saksham Learning"
    is_published: bool = True

# ------------------ Auth Endpoints ------------------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "role": "user",
        "auth_provider": "password",
        "picture": None,
        "created_at": utc_now_iso(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, email, "user")
    set_auth_cookie(response, token)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {"user": user_doc, "access_token": token}

@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["user_id"], user["email"], user.get("role", "user"))
    set_auth_cookie(response, token)
    user.pop("password_hash", None)
    return {"user": user, "access_token": token}

@api.post("/auth/google-session")
async def google_session(payload: GoogleSessionIn, response: Response):
    """Exchange Emergent session_id for our JWT. Creates or links user by email."""
    try:
        r = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
            timeout=10,
        )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google session")
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Auth provider error: {e}")

    email = data["email"].lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name", email.split("@")[0]),
            "password_hash": None,
            "role": "user",
            "auth_provider": "google",
            "picture": data.get("picture"),
            "created_at": utc_now_iso(),
        }
        await db.users.insert_one(user)
    else:
        # link & update profile picture/name on subsequent login
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"picture": data.get("picture"), "name": user.get("name") or data.get("name")}},
        )
        user["picture"] = data.get("picture")

    token = create_access_token(user["user_id"], user["email"], user.get("role", "user"))
    set_auth_cookie(response, token)
    user.pop("password_hash", None)
    return {"user": user, "access_token": token}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

# ------------------ Public Catalog ------------------
@api.get("/worksheets")
async def list_worksheets(
    grade: Optional[str] = None,
    subject: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    is_free: Optional[bool] = None,
    limit: int = Query(60, ge=1, le=200),
):
    q: dict = {"is_published": True}
    if grade:
        q["grade"] = grade
    if subject:
        q["subject"] = subject
    if level:
        q["level"] = level
    if is_free is not None:
        q["is_free"] = is_free
    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    docs = await db.worksheets.find(q, {"_id": 0, "pdf_path": 0, "sample_path": 0}).sort("created_at", -1).to_list(limit)
    return docs

@api.get("/worksheets/{worksheet_id}")
async def get_worksheet(worksheet_id: str):
    doc = await db.worksheets.find_one({"worksheet_id": worksheet_id}, {"_id": 0, "pdf_path": 0, "sample_path": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    return doc

@api.get("/worksheets/{worksheet_id}/sample")
async def download_sample(worksheet_id: str):
    doc = await db.worksheets.find_one({"worksheet_id": worksheet_id})
    if not doc or not doc.get("sample_path"):
        raise HTTPException(status_code=404, detail="No sample available")
    p = Path(doc["sample_path"])
    if not p.exists():
        raise HTTPException(status_code=404, detail="Sample file missing")
    return StreamingResponse(
        open(p, "rb"),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc["title"]}-sample.pdf"'},
    )

# ------------------ Cart / Orders / Razorpay ------------------
@api.post("/orders/create")
async def create_order(payload: CreateOrderIn, user: dict = Depends(get_current_user)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    ids = [i.worksheet_id for i in payload.items]
    sheets = await db.worksheets.find({"worksheet_id": {"$in": ids}, "is_published": True}, {"_id": 0}).to_list(200)
    sheet_map = {s["worksheet_id"]: s for s in sheets}
    line_items = []
    total = 0
    for it in payload.items:
        s = sheet_map.get(it.worksheet_id)
        if not s:
            raise HTTPException(status_code=400, detail=f"Worksheet {it.worksheet_id} not found")
        if s.get("is_free"):
            continue  # free items don't go to checkout
        price = int(s["price"])
        line_items.append({
            "worksheet_id": s["worksheet_id"],
            "title": s["title"],
            "price": price,
            "quantity": 1,
        })
        total += price
    if total <= 0:
        raise HTTPException(status_code=400, detail="No paid items in order")

    order_id = f"order_{uuid.uuid4().hex[:14]}"
    rzp_order_id = None
    use_mock = RAZORPAY_MOCK_MODE or rzp_client is None

    if not use_mock:
        try:
            rzp_order = rzp_client.order.create({
                "amount": total * 100,
                "currency": "INR",
                "receipt": order_id[:40],
                "payment_capture": 1,
                "notes": {"user_id": user["user_id"], "internal_order_id": order_id},
            })
            rzp_order_id = rzp_order["id"]
        except Exception as e:
            log.warning(f"Razorpay create_order failed, falling back to mock: {e}")
            use_mock = True

    order_doc = {
        "order_id": order_id,
        "user_id": user["user_id"],
        "user_email": user["email"],
        "items": line_items,
        "total_amount": total,
        "currency": "INR",
        "status": "created",  # created -> paid -> failed
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": None,
        "is_mock": use_mock,
        "created_at": utc_now_iso(),
    }
    await db.orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    return {
        "order": order_doc,
        "razorpay_key_id": RAZORPAY_KEY_ID if not use_mock else None,
        "is_mock": use_mock,
    }

@api.post("/orders/verify")
async def verify_order(payload: VerifyPaymentIn, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": payload.order_id}, {"_id": 0})
    if not order or order["user_id"] != user["user_id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] == "paid":
        return {"status": "paid", "order_id": order["order_id"]}

    if payload.mock or order.get("is_mock"):
        await db.orders.update_one(
            {"order_id": order["order_id"]},
            {"$set": {"status": "paid", "razorpay_payment_id": f"mock_pay_{uuid.uuid4().hex[:12]}", "paid_at": utc_now_iso()}},
        )
    else:
        if not (payload.razorpay_payment_id and payload.razorpay_order_id and payload.razorpay_signature):
            raise HTTPException(status_code=400, detail="Missing Razorpay payment fields")
        body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode()
        expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, payload.razorpay_signature):
            await db.orders.update_one({"order_id": order["order_id"]}, {"$set": {"status": "failed"}})
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        await db.orders.update_one(
            {"order_id": order["order_id"]},
            {"$set": {"status": "paid", "razorpay_payment_id": payload.razorpay_payment_id, "paid_at": utc_now_iso()}},
        )

    # add to user's library
    library_items = []
    for it in order["items"]:
        library_items.append({
            "user_id": user["user_id"],
            "worksheet_id": it["worksheet_id"],
            "order_id": order["order_id"],
            "purchased_at": utc_now_iso(),
        })
    if library_items:
        # avoid duplicates: upsert per (user, worksheet)
        for li in library_items:
            await db.library.update_one(
                {"user_id": li["user_id"], "worksheet_id": li["worksheet_id"]},
                {"$set": li},
                upsert=True,
            )
    return {"status": "paid", "order_id": order["order_id"]}

@api.get("/me/orders")
async def my_orders(user: dict = Depends(get_current_user)):
    docs = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs

@api.get("/me/library")
async def my_library(user: dict = Depends(get_current_user)):
    items = await db.library.find({"user_id": user["user_id"]}, {"_id": 0}).sort("purchased_at", -1).to_list(500)
    if not items:
        return []
    sheet_ids = [i["worksheet_id"] for i in items]
    sheets = await db.worksheets.find({"worksheet_id": {"$in": sheet_ids}}, {"_id": 0, "pdf_path": 0, "sample_path": 0}).to_list(500)
    sheet_map = {s["worksheet_id"]: s for s in sheets}
    enriched = []
    for it in items:
        s = sheet_map.get(it["worksheet_id"])
        if s:
            enriched.append({**s, "purchased_at": it["purchased_at"], "order_id": it["order_id"]})
    return enriched

@api.get("/me/library/{worksheet_id}/download")
async def download_purchased(worksheet_id: str, user: dict = Depends(get_current_user)):
    owned = await db.library.find_one({"user_id": user["user_id"], "worksheet_id": worksheet_id})
    if not owned:
        raise HTTPException(status_code=403, detail="You do not own this worksheet")
    sheet = await db.worksheets.find_one({"worksheet_id": worksheet_id})
    if not sheet or not sheet.get("pdf_path"):
        raise HTTPException(status_code=404, detail="PDF not found")
    p = Path(sheet["pdf_path"])
    if not p.exists():
        raise HTTPException(status_code=404, detail="File missing on server")
    return StreamingResponse(
        open(p, "rb"),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{sheet["title"]}.pdf"'},
    )

# ------------------ Newsletter ------------------
@api.post("/newsletter/subscribe")
async def subscribe(payload: NewsletterIn):
    email = payload.email.lower().strip()
    await db.newsletter.update_one(
        {"email": email},
        {"$setOnInsert": {"email": email, "subscribed_at": utc_now_iso()}},
        upsert=True,
    )
    return {"ok": True, "email": email}

# ------------------ Testimonials & Blog ------------------
@api.get("/testimonials")
async def list_testimonials():
    docs = await db.testimonials.find({"is_featured": True}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs

@api.get("/blog")
async def list_blog():
    docs = await db.blog.find({"is_published": True}, {"_id": 0, "content": 0}).sort("created_at", -1).to_list(50)
    return docs

@api.get("/blog/{slug}")
async def get_blog(slug: str):
    doc = await db.blog.find_one({"slug": slug, "is_published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")
    return doc

# ------------------ Site config (whatsapp etc) ------------------
@api.get("/site/config")
async def site_config():
    return {
        "whatsapp_number": WHATSAPP_NUMBER,
        "razorpay_mock": RAZORPAY_MOCK_MODE,
        "razorpay_key_id": RAZORPAY_KEY_ID if not RAZORPAY_MOCK_MODE else None,
        "tagline": "Every child is capable — of learning at their pace, in their place.",
    }

# ------------------ Admin ------------------
@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    total_orders = await db.orders.count_documents({"status": "paid"})
    revenue_agg = await db.orders.aggregate([
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
    ]).to_list(1)
    revenue = revenue_agg[0]["total"] if revenue_agg else 0
    total_users = await db.users.count_documents({"role": "user"})
    total_worksheets = await db.worksheets.count_documents({})
    total_subs = await db.newsletter.count_documents({})
    return {
        "total_orders": total_orders,
        "revenue": revenue,
        "total_users": total_users,
        "total_worksheets": total_worksheets,
        "newsletter_subscribers": total_subs,
    }

@api.post("/admin/worksheets")
async def admin_create_worksheet(
    title: str = Form(...),
    description: str = Form(...),
    grade: str = Form(...),
    subject: str = Form(...),
    level: str = Form(...),
    price: int = Form(...),
    pages: int = Form(1),
    is_free: bool = Form(False),
    is_published: bool = Form(True),
    cover_image: Optional[str] = Form(None),
    pdf: Optional[UploadFile] = File(None),
    sample_pdf: Optional[UploadFile] = File(None),
    _: dict = Depends(require_admin),
):
    worksheet_id = f"ws_{uuid.uuid4().hex[:12]}"
    pdf_path = None
    sample_path = None
    if pdf is not None:
        pdf_path = str(WORKSHEETS_DIR / f"{worksheet_id}.pdf")
        with open(pdf_path, "wb") as f:
            f.write(await pdf.read())
    if sample_pdf is not None:
        sample_path = str(SAMPLES_DIR / f"{worksheet_id}-sample.pdf")
        with open(sample_path, "wb") as f:
            f.write(await sample_pdf.read())
    doc = {
        "worksheet_id": worksheet_id,
        "title": title,
        "description": description,
        "grade": grade,
        "subject": subject,
        "level": level,
        "price": int(price),
        "pages": int(pages),
        "is_free": is_free,
        "is_published": is_published,
        "cover_image": cover_image,
        "pdf_path": pdf_path,
        "sample_path": sample_path,
        "has_pdf": pdf_path is not None,
        "has_sample": sample_path is not None,
        "created_at": utc_now_iso(),
    }
    await db.worksheets.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("pdf_path", None)
    doc.pop("sample_path", None)
    return doc

@api.put("/admin/worksheets/{worksheet_id}")
async def admin_update_worksheet(worksheet_id: str, payload: WorksheetIn, _: dict = Depends(require_admin)):
    update = payload.model_dump()
    res = await db.worksheets.update_one({"worksheet_id": worksheet_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    doc = await db.worksheets.find_one({"worksheet_id": worksheet_id}, {"_id": 0, "pdf_path": 0, "sample_path": 0})
    return doc

@api.delete("/admin/worksheets/{worksheet_id}")
async def admin_delete_worksheet(worksheet_id: str, _: dict = Depends(require_admin)):
    doc = await db.worksheets.find_one({"worksheet_id": worksheet_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    for k in ("pdf_path", "sample_path"):
        p = doc.get(k)
        if p and Path(p).exists():
            try:
                Path(p).unlink()
            except Exception:
                pass
    await db.worksheets.delete_one({"worksheet_id": worksheet_id})
    return {"ok": True}

@api.get("/admin/worksheets")
async def admin_list_worksheets(_: dict = Depends(require_admin)):
    docs = await db.worksheets.find({}, {"_id": 0, "pdf_path": 0, "sample_path": 0}).sort("created_at", -1).to_list(500)
    return docs

@api.get("/admin/orders")
async def admin_list_orders(_: dict = Depends(require_admin)):
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs

@api.get("/admin/users")
async def admin_list_users(_: dict = Depends(require_admin)):
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return docs

@api.get("/admin/newsletter")
async def admin_list_newsletter(_: dict = Depends(require_admin)):
    docs = await db.newsletter.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(2000)
    return docs

@api.post("/admin/testimonials")
async def admin_create_testimonial(payload: TestimonialIn, _: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["testimonial_id"] = f"t_{uuid.uuid4().hex[:10]}"
    doc["created_at"] = utc_now_iso()
    await db.testimonials.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/admin/testimonials/{testimonial_id}")
async def admin_delete_testimonial(testimonial_id: str, _: dict = Depends(require_admin)):
    await db.testimonials.delete_one({"testimonial_id": testimonial_id})
    return {"ok": True}

@api.post("/admin/blog")
async def admin_create_blog(payload: BlogPostIn, _: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["post_id"] = f"p_{uuid.uuid4().hex[:10]}"
    doc["created_at"] = utc_now_iso()
    existing = await db.blog.find_one({"slug": doc["slug"]})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    await db.blog.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/admin/blog/{post_id}")
async def admin_update_blog(post_id: str, payload: BlogPostIn, _: dict = Depends(require_admin)):
    res = await db.blog.update_one({"post_id": post_id}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return await db.blog.find_one({"post_id": post_id}, {"_id": 0})

@api.delete("/admin/blog/{post_id}")
async def admin_delete_blog(post_id: str, _: dict = Depends(require_admin)):
    await db.blog.delete_one({"post_id": post_id})
    return {"ok": True}

# ------------------ Startup: indexes + seed ------------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.worksheets.create_index("worksheet_id", unique=True)
    await db.worksheets.create_index([("subject", 1), ("grade", 1), ("level", 1)])
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("user_id")
    await db.library.create_index([("user_id", 1), ("worksheet_id", 1)], unique=True)
    await db.blog.create_index("slug", unique=True)
    await db.newsletter.create_index("email", unique=True)
    await seed_admin_and_data()

async def seed_admin_and_data():
    # Admin (idempotent)
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": ADMIN_EMAIL,
            "name": "Saksham Admin",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "auth_provider": "password",
            "picture": None,
            "created_at": utc_now_iso(),
        })
        log.info(f"Seeded admin: {ADMIN_EMAIL}")
    else:
        if not admin.get("password_hash") or not verify_password(ADMIN_PASSWORD, admin["password_hash"]):
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "role": "admin"}},
            )

    # Test parent user
    test_u = await db.users.find_one({"email": TEST_USER_EMAIL})
    if not test_u:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": TEST_USER_EMAIL,
            "name": "Test Parent",
            "password_hash": hash_password(TEST_USER_PASSWORD),
            "role": "user",
            "auth_provider": "password",
            "picture": None,
            "created_at": utc_now_iso(),
        })

    # Seed worksheets if none
    count = await db.worksheets.count_documents({})
    if count == 0:
        sample = build_seed_worksheets()
        await db.worksheets.insert_many(sample)
        log.info(f"Seeded {len(sample)} worksheets")

    # Seed testimonials if none
    if await db.testimonials.count_documents({}) == 0:
        await db.testimonials.insert_many(build_seed_testimonials())

    # Seed blog if none
    if await db.blog.count_documents({}) == 0:
        await db.blog.insert_many(build_seed_blog())

def build_seed_worksheets():
    """Realistic seed catalog spanning grades, subjects and levels."""
    grades = ["KG", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
    subject_titles = {
        "english": [
            ("Phonics & Word Building", "Practice common phonemes, blends, and sight words."),
            ("Grammar Essentials", "Nouns, verbs, adjectives — with real-world examples."),
            ("Reading Comprehension", "Short passages with thoughtful questions to build understanding."),
            ("Creative Writing Prompts", "Open-ended prompts to spark imagination and clarity."),
        ],
        "maths": [
            ("Numbers & Place Value", "Build a strong foundation in place value with visual aids."),
            ("Addition & Subtraction Mastery", "Step-by-step practice from basic to two-digit problems."),
            ("Multiplication & Division", "Tables, word problems, and quick mental-math drills."),
            ("Fractions & Decimals", "Conceptual practice with diagrams and worded problems."),
        ],
        "science": [
            ("Living & Non-Living Things", "Explore the world around with curiosity-led activities."),
            ("Plants & Animals", "Diagrams, classifications, and observation tasks."),
            ("Our Body", "Systems and senses — explained simply for young learners."),
            ("Force, Work & Energy", "Concept clarity with real-life examples for upper grades."),
        ],
        "sst": [
            ("Family & Community", "Understanding roles, relationships and society around us."),
            ("India: Our Country", "States, capitals, monuments, and culture mapped beautifully."),
            ("Maps & Directions", "Hands-on practice reading and creating simple maps."),
            ("Civics & Government", "Constitution basics, rights and duties — for upper grades."),
        ],
    }
    levels = [("easy", 49), ("moderate", 79), ("difficult", 99)]
    images = {
        "english": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
        "maths": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
        "science": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800",
        "sst": "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800",
    }
    docs = []
    now = utc_now_iso()
    for grade in grades:
        for subject, titles in subject_titles.items():
            # KG: only first 2 topics, only easy/moderate
            topic_pool = titles[:2] if grade == "KG" else titles
            level_pool = levels[:2] if grade == "KG" else levels
            for (topic, desc) in topic_pool:
                for (lvl, price) in level_pool:
                    docs.append({
                        "worksheet_id": f"ws_{uuid.uuid4().hex[:12]}",
                        "title": f"{topic} — Grade {grade}",
                        "description": f"{desc} Aligned with CBSE NCF-SE 2023. {lvl.capitalize()} level practice with full answer key.",
                        "grade": grade,
                        "subject": subject,
                        "level": lvl,
                        "price": price,
                        "pages": {"easy": 8, "moderate": 12, "difficult": 16}[lvl],
                        "is_free": False,
                        "is_published": True,
                        "cover_image": images[subject],
                        "pdf_path": None,
                        "sample_path": None,
                        "has_pdf": False,
                        "has_sample": False,
                        "created_at": now,
                    })
    # Mark a few as free samples
    for i in (0, 12, 25, 40):
        if i < len(docs):
            docs[i]["is_free"] = True
            docs[i]["price"] = 0
            docs[i]["title"] = docs[i]["title"] + " (Free Sample)"
    return docs

def build_seed_testimonials():
    now = utc_now_iso()
    base = [
        ("Anjali Sharma", "Delhi", "My daughter went from dreading worksheets to asking for them. The 3-level system means she always starts with confidence.", "Grade 3", 5),
        ("Rohan Mehta", "Mumbai", "Finally, a brand that gets it. Thoughtfully made by a real teacher — you can feel it on every page.", "Grade 6", 5),
        ("Priya Iyer", "Bengaluru", "We tried so many apps. Saksham worksheets are the only thing my son actually completes — and enjoys.", "Grade 2", 5),
        ("Dr. Aman Kapoor", "Gurugram", "Aligned, affordable, and beautifully designed. The answer keys save us hours every week.", "Grade 8", 5),
        ("Neha Verma", "Lucknow", "The Easy level rebuilt my child's confidence after a tough term. Worth every rupee.", "Grade 4", 5),
        ("Sandeep Rao", "Hyderabad", "Three levels — same topic. Brilliant pedagogy. My twins each get exactly what they need.", "Grade 5", 5),
    ]
    return [
        {
            "testimonial_id": f"t_{uuid.uuid4().hex[:10]}",
            "parent_name": n, "location": loc, "quote": q,
            "child_grade": cg, "rating": r, "is_featured": True,
            "created_at": now,
        }
        for (n, loc, q, cg, r) in base
    ]

def build_seed_blog():
    now = utc_now_iso()
    posts = [
        {
            "title": "Why 'Easy First' is the Most Powerful Learning Hack for Children",
            "slug": "easy-first-learning-hack",
            "excerpt": "Confidence builds capability. Here's why we always recommend starting with the Easy level — even for advanced kids.",
            "cover_image": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200",
            "content": "## Confidence Before Content\n\nFifteen years in classrooms taught me one truth: a child who feels capable will outwork a child who feels confused — every single time.\n\nThat's why the Saksham 3-level system was born. Each topic is the same — but the slope is different.\n\n### How to use it\n1. Always start at Easy. Yes, even if your child is 'ahead'. Wins build momentum.\n2. Move to Moderate only when Easy feels effortless.\n3. Use Difficult to stretch — never to test.\n\nLearning is not a race. It's a ladder. We're just here to make sure every rung is the right height.",
        },
        {
            "title": "The 15-Minute Daily Habit That Changes Everything",
            "slug": "fifteen-minute-daily-habit",
            "excerpt": "Forget marathon study sessions. Tiny, consistent practice is what makes children sharp, calm, and curious.",
            "cover_image": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200",
            "content": "## Small, Daily, Done\n\nThe brain learns through spacing — not cramming. Fifteen focused minutes a day beats two hours on a Sunday.\n\n### Make it ritual, not chore\n- Same time, same place. The brain loves cues.\n- One worksheet. One topic. Done.\n- Celebrate completion, not perfection.\n\nIn a year, that's 90 hours of focused, joyful learning. Your child won't just be ahead — they'll be in love with learning.",
        },
        {
            "title": "How to Choose the Right Difficulty Level (Without Guesswork)",
            "slug": "choose-the-right-difficulty",
            "excerpt": "Stop guessing. Use this 60-second test to know exactly which Saksham level your child should start with.",
            "cover_image": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200",
            "content": "## The 60-Second Test\n\nGive your child the first 5 questions of any Easy worksheet.\n\n- 5/5 in under 5 minutes? → Move to Moderate.\n- 3-4/5 with effort? → Stay at Easy. Build the muscle.\n- Struggled with 1-2? → Easy is exactly where they need to be.\n\nLevels are not about ability. They're about *fit*.",
        },
    ]
    return [
        {
            **p,
            "post_id": f"p_{uuid.uuid4().hex[:10]}",
            "author": "Saksham Learning",
            "is_published": True,
            "created_at": now,
        }
        for p in posts
    ]

# ------------------ Mount ------------------
app.include_router(api)

origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
