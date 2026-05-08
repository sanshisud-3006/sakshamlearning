"""
Saksham Learning - Backend API integration tests
Hits the public REACT_APP_BACKEND_URL with /api prefix.
"""
import os
import io
import uuid
import pytest
import requests

BASE_URL = "https://custom-build-24.preview.emergentagent.com"
ADMIN_EMAIL = "info@sakshamlearning.com"
ADMIN_PASSWORD = "Saksham@2026"
PARENT_EMAIL = "parent@test.com"
PARENT_PASSWORD = "Parent@123"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_token():
    return _login(ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture(scope="session")
def parent_token():
    return _login(PARENT_EMAIL, PARENT_PASSWORD)


# -------------------- Site / Public --------------------
class TestSiteConfig:
    def test_site_config(self):
        r = requests.get(f"{BASE_URL}/api/site/config", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["whatsapp_number"]
        assert d["razorpay_mock"] is True
        assert "Every child is capable" in d["tagline"]


# -------------------- Auth --------------------
class TestAuth:
    def test_register_new_user(self):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "Pass1234", "name": "Test New"
        }, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "user"

    def test_login_admin(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["role"] == "admin"
        assert "access_token" in d

    def test_login_parent(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PARENT_EMAIL, "password": PARENT_PASSWORD}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["role"] == "user"

    def test_login_invalid(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": "wrong"}, timeout=20)
        assert r.status_code == 401

    def test_me_with_bearer(self, parent_token):
        r = requests.get(f"{BASE_URL}/api/auth/me",
                         headers={"Authorization": f"Bearer {parent_token}"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["email"] == PARENT_EMAIL

    def test_me_without_token(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert r.status_code == 401


# -------------------- Worksheets --------------------
class TestWorksheets:
    def test_list_worksheets(self):
        r = requests.get(f"{BASE_URL}/api/worksheets?limit=200", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 100, f"Expected 100+ worksheets, got {len(items)}"

    def test_filter_subject_maths(self):
        r = requests.get(f"{BASE_URL}/api/worksheets?subject=maths&limit=200", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        assert all(i["subject"] == "maths" for i in items)

    def test_filter_grade_3(self):
        r = requests.get(f"{BASE_URL}/api/worksheets?grade=3&limit=200", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        assert all(i["grade"] == "3" for i in items)

    def test_filter_level_easy(self):
        r = requests.get(f"{BASE_URL}/api/worksheets?level=easy&limit=200", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert all(i["level"] == "easy" for i in items)

    def test_filter_is_free(self):
        r = requests.get(f"{BASE_URL}/api/worksheets?is_free=true&limit=200", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert all(i["is_free"] is True for i in items)
        assert len(items) >= 1

    def test_search_phonics(self):
        r = requests.get(f"{BASE_URL}/api/worksheets?search=phonics", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        assert any("phonics" in i["title"].lower() or "phonics" in i["description"].lower() for i in items)

    def test_get_single_worksheet(self):
        r = requests.get(f"{BASE_URL}/api/worksheets?limit=1", timeout=20)
        wid = r.json()[0]["worksheet_id"]
        r2 = requests.get(f"{BASE_URL}/api/worksheets/{wid}", timeout=20)
        assert r2.status_code == 200
        assert r2.json()["worksheet_id"] == wid

    def test_get_worksheet_404(self):
        r = requests.get(f"{BASE_URL}/api/worksheets/ws_doesnotexist", timeout=20)
        assert r.status_code == 404


# -------------------- Testimonials & Blog --------------------
class TestContent:
    def test_testimonials(self):
        r = requests.get(f"{BASE_URL}/api/testimonials", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 6

    def test_blog_list(self):
        r = requests.get(f"{BASE_URL}/api/blog", timeout=20)
        assert r.status_code == 200
        posts = r.json()
        assert len(posts) >= 3
        # excerpt without content
        for p in posts:
            assert "content" not in p

    def test_blog_detail(self):
        # use one of seeded slugs
        slug = "easy-first-learning-hack"
        r = requests.get(f"{BASE_URL}/api/blog/{slug}", timeout=20)
        assert r.status_code == 200
        assert r.json()["slug"] == slug
        assert "content" in r.json()

    def test_blog_detail_404(self):
        r = requests.get(f"{BASE_URL}/api/blog/non-existent-slug", timeout=20)
        assert r.status_code == 404


# -------------------- Newsletter --------------------
class TestNewsletter:
    def test_subscribe(self):
        email = f"sub_{uuid.uuid4().hex[:8]}@test.com"
        r = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={"email": email}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True
        assert d["email"] == email


# -------------------- Orders / Mock Payment / Library --------------------
class TestOrdersFlow:
    def test_create_order_unauthenticated(self):
        r = requests.post(f"{BASE_URL}/api/orders/create", json={"items": []}, timeout=20)
        assert r.status_code == 401

    def test_full_purchase_flow(self, parent_token):
        h = {"Authorization": f"Bearer {parent_token}"}
        # pick a non-free worksheet
        r = requests.get(f"{BASE_URL}/api/worksheets?is_free=false&limit=1", timeout=20)
        wid = r.json()[0]["worksheet_id"]

        # create order
        r2 = requests.post(f"{BASE_URL}/api/orders/create",
                           json={"items": [{"worksheet_id": wid, "quantity": 1}]},
                           headers=h, timeout=20)
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body["is_mock"] is True
        assert body["razorpay_key_id"] is None
        order = body["order"]
        assert order["razorpay_order_id"] is None
        assert order["status"] == "created"
        order_id = order["order_id"]

        # verify with mock
        r3 = requests.post(f"{BASE_URL}/api/orders/verify",
                           json={"order_id": order_id, "mock": True},
                           headers=h, timeout=20)
        assert r3.status_code == 200, r3.text
        assert r3.json()["status"] == "paid"

        # library should now include the worksheet
        r4 = requests.get(f"{BASE_URL}/api/me/library", headers=h, timeout=20)
        assert r4.status_code == 200
        lib = r4.json()
        assert any(it["worksheet_id"] == wid for it in lib)

        # orders history
        r5 = requests.get(f"{BASE_URL}/api/me/orders", headers=h, timeout=20)
        assert r5.status_code == 200
        orders = r5.json()
        assert any(o["order_id"] == order_id and o["status"] == "paid" for o in orders)


# -------------------- Admin --------------------
class TestAdmin:
    def test_admin_stats_admin_ok(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=h, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "total_orders" in d
        assert "total_worksheets" in d

    def test_admin_stats_non_admin_403(self, parent_token):
        h = {"Authorization": f"Bearer {parent_token}"}
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=h, timeout=20)
        assert r.status_code == 403

    def test_admin_lists(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        for path in ["/api/admin/worksheets", "/api/admin/orders", "/api/admin/users", "/api/admin/newsletter"]:
            r = requests.get(f"{BASE_URL}{path}", headers=h, timeout=20)
            assert r.status_code == 200, f"{path}: {r.status_code}"
            assert isinstance(r.json(), list)

    def test_admin_create_worksheet(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        files = {"pdf": ("dummy.pdf", io.BytesIO(b"%PDF-1.4 dummy"), "application/pdf")}
        data = {
            "title": f"TEST_WS_{uuid.uuid4().hex[:6]}",
            "description": "Created by automated test",
            "grade": "3", "subject": "maths", "level": "easy",
            "price": "59", "pages": "8", "is_free": "false", "is_published": "true",
        }
        r = requests.post(f"{BASE_URL}/api/admin/worksheets", headers=h, data=data, files=files, timeout=30)
        assert r.status_code == 200, r.text
        ws = r.json()
        assert ws["title"].startswith("TEST_WS_")
        # cleanup
        requests.delete(f"{BASE_URL}/api/admin/worksheets/{ws['worksheet_id']}", headers=h, timeout=20)

    def test_admin_testimonial_create_delete(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        r = requests.post(f"{BASE_URL}/api/admin/testimonials", headers=h, json={
            "parent_name": "TEST_Parent", "location": "Test City",
            "quote": "Great worksheets!", "child_grade": "3", "rating": 5, "is_featured": True,
        }, timeout=20)
        assert r.status_code == 200, r.text
        tid = r.json()["testimonial_id"]
        rd = requests.delete(f"{BASE_URL}/api/admin/testimonials/{tid}", headers=h, timeout=20)
        assert rd.status_code == 200

    def test_admin_blog_create_delete(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        slug = f"test-post-{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{BASE_URL}/api/admin/blog", headers=h, json={
            "title": "TEST Post", "slug": slug, "excerpt": "x", "content": "## hello",
            "is_published": True,
        }, timeout=20)
        assert r.status_code == 200, r.text
        pid = r.json()["post_id"]
        rd = requests.delete(f"{BASE_URL}/api/admin/blog/{pid}", headers=h, timeout=20)
        assert rd.status_code == 200
