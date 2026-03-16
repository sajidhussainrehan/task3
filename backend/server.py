from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Admin credentials from env
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    photo: Optional[str] = None
    team: Optional[str] = None
    total_points: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCreate(BaseModel):
    name: str
    phone: str
    photo: Optional[str] = None
    team: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    team: Optional[str] = None

# Teams configuration
TEAMS = [
    {"id": "sadara", "name": "الصدارة", "icon": "crown", "emoji": "👑", "color": "#FFD700", "bg": "#FFF8E1"},
    {"id": "nukhba", "name": "النخبة", "icon": "star", "emoji": "⭐", "color": "#9C27B0", "bg": "#F3E5F5"},
    {"id": "zaama", "name": "الزعامة", "icon": "shield", "emoji": "🛡️", "color": "#F44336", "bg": "#FFEBEE"},
    {"id": "riyada", "name": "الريادة", "icon": "rocket", "emoji": "🚀", "color": "#2196F3", "bg": "#E3F2FD"},
]

class PointCategory(BaseModel):
    name: str
    points: int

class PointTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    category: str
    points: int
    is_positive: bool
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PointTransactionCreate(BaseModel):
    student_id: str
    category: str
    points: int
    is_positive: bool

class QuestionOption(BaseModel):
    text: str
    is_correct: bool = False

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    options: List[QuestionOption]
    points: int = 10

class Competition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    questions: List[Question] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompetitionCreate(BaseModel):
    title: str
    description: Optional[str] = None

class QuestionCreate(BaseModel):
    competition_id: str
    text: str
    options: List[QuestionOption]
    points: int = 10

class QuizAnswer(BaseModel):
    student_id: str
    competition_id: str
    question_id: str
    selected_option_index: int

class QuizSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    competition_id: str
    question_id: str
    selected_option_index: int
    is_correct: bool
    points_earned: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Predefined point categories
DEDUCTION_CATEGORIES = [
    {"name": "الغياب", "points": -60, "emoji": "🚫"},
    {"name": "الكلام البذيء", "points": -60, "emoji": "🤬"},
    {"name": "عدم الاستجابة", "points": -20, "emoji": "🙉"},
    {"name": "التأخر", "points": -10, "emoji": "⏰"},
    {"name": "التأخر عن الصلاة", "points": -60, "emoji": "🕌"},
    {"name": "الغياب في الحلقة", "points": -60, "emoji": "📖"},
]

POSITIVE_CATEGORIES = [
    {"name": "المبادرات", "points": 20, "emoji": "💡"},
    {"name": "الحضور المبكر", "points": 10, "emoji": "🌅"},
    {"name": "الانضباط العام", "points": 20, "emoji": "✅"},
    {"name": "رجل الدوري", "points": 30, "emoji": "🏃"},
    {"name": "الفوز في الدوري", "points": 60, "emoji": "🏆"},
    {"name": "أفضل طبخ", "points": 30, "emoji": "👨‍🍳"},
    {"name": "الإجتماعي", "points": 20, "emoji": "🤝"},
    {"name": "الأذان والصلاة", "points": 20, "emoji": "🕋"},
    {"name": "مشروع الطالب", "points": 20, "emoji": "📊"},
    {"name": "إنجاز الكراسة", "points": 50, "emoji": "📚"},
]

# Star Player Model
class StarPlayer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    title: str = "نجم الدوري"
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StarPlayerCreate(BaseModel):
    student_id: str
    title: str = "نجم الدوري"
    description: Optional[str] = None

# Football League Models
class LeagueMatch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    team1_id: str
    team2_id: str
    team1_score: int = 0
    team2_score: int = 0
    is_played: bool = False
    match_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeagueMatchCreate(BaseModel):
    team1_id: str
    team2_id: str
    match_date: Optional[str] = None

class LeagueMatchUpdate(BaseModel):
    team1_score: int
    team2_score: int
    is_played: bool = True

class TeamStanding(BaseModel):
    team_id: str
    team_name: str
    team_emoji: str
    team_color: str
    played: int = 0
    won: int = 0
    drawn: int = 0
    lost: int = 0
    goals_for: int = 0
    goals_against: int = 0
    goal_difference: int = 0
    points: int = 0

# Weekly Tasks Models
TASK_TYPES = [
    {"id": "adhan", "name": "الأذان والإقامة والصلاة", "emoji": "🕌", "needs_assignment": True},
    {"id": "speech", "name": "كلمة بعد المغرب والعشاء", "emoji": "🎤", "needs_assignment": True},
    {"id": "activity", "name": "فعالية الفريق", "emoji": "🎯", "needs_assignment": False},
    {"id": "social", "name": "الاجتماعي", "emoji": "🤝", "needs_assignment": False, "has_items": True},
]

SOCIAL_ITEMS = ["قهوة", "شاي", "حلى", "سمبوسة"]

class WeeklyTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_type: str
    team_id: str
    assigned_student_id: Optional[str] = None
    week_start: str  # Monday date string
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SocialReservation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    team_id: str
    student_id: str
    item: str
    week_start: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SpecialDinner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    team_id: str
    assigned_student_id: Optional[str] = None
    week_start: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# =================== AUTH MODELS ===================

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    success: bool
    message: str

# =================== TEACHER MODELS ===================

QURAN_CATEGORIES = [
    {"name": "حفظ", "points": 10, "emoji": "📖"},
    {"name": "مراجعة", "points": 5, "emoji": "🔄"},
    {"name": "متون", "points": 3, "emoji": "📜"},
]

class Teacher(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    username: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeacherCreate(BaseModel):
    name: str
    username: str
    password: str

class TeacherLogin(BaseModel):
    username: str
    password: str

class TeacherStudentAssignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    teacher_id: str
    student_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuranPointTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    category: str  # حفظ, مراجعة, متون
    points: int
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuranPointCreate(BaseModel):
    student_id: str
    category: str
    points: int
    notes: Optional[str] = None

# Root API
@api_router.get("/")
async def root():
    return {"message": "نادي بارع الشبابي API"}

# =================== ADMIN AUTH APIs ===================

@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(credentials: AdminLogin):
    if credentials.username == ADMIN_USERNAME and credentials.password == ADMIN_PASSWORD:
        return {"success": True, "message": "تم تسجيل الدخول بنجاح"}
    raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")

@api_router.get("/admin/verify")
async def verify_admin(username: str, password: str):
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return {"valid": True}
    return {"valid": False}

# =================== TEACHER APIs ===================

@api_router.get("/quran-categories")
async def get_quran_categories():
    return QURAN_CATEGORIES

@api_router.post("/teachers", response_model=Teacher)
async def create_teacher(teacher: TeacherCreate):
    # Check if username already exists
    existing = await db.teachers.find_one({"username": teacher.username})
    if existing:
        raise HTTPException(status_code=400, detail="اسم المستخدم مستخدم بالفعل")
    
    teacher_obj = Teacher(
        name=teacher.name,
        username=teacher.username,
        password_hash=pwd_context.hash(teacher.password)
    )
    doc = teacher_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.teachers.insert_one(doc)
    # Don't return password_hash
    teacher_obj.password_hash = ""
    return teacher_obj

@api_router.get("/teachers")
async def get_teachers():
    teachers = await db.teachers.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    for t in teachers:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return teachers

@api_router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str):
    result = await db.teachers.delete_one({"id": teacher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المعلم غير موجود")
    # Remove all assignments for this teacher
    await db.teacher_assignments.delete_many({"teacher_id": teacher_id})
    return {"message": "تم حذف المعلم بنجاح"}

@api_router.post("/teachers/login", response_model=AdminLoginResponse)
async def teacher_login(credentials: TeacherLogin):
    teacher = await db.teachers.find_one({"username": credentials.username})
    if not teacher:
        raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")
    
    if not pwd_context.verify(credentials.password, teacher["password_hash"]):
        raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")
    
    return {"success": True, "message": "تم تسجيل الدخول بنجاح", "teacher_id": teacher["id"], "name": teacher["name"]}

# Teacher-Student Assignments (Supervisor assigns students to teachers)
@api_router.post("/teacher-assignments")
async def assign_student_to_teacher(data: dict):
    teacher_id = data.get("teacher_id")
    student_id = data.get("student_id")
    
    if not teacher_id or not student_id:
        raise HTTPException(status_code=400, detail="يرجى تحديد المعلم والطالب")
    
    # Check if teacher exists
    teacher = await db.teachers.find_one({"id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=404, detail="المعلم غير موجود")
    
    # Check if student exists
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Check if student already assigned to this teacher
    existing = await db.teacher_assignments.find_one({"teacher_id": teacher_id, "student_id": student_id})
    if existing:
        raise HTTPException(status_code=400, detail="الطالب مخصص بالفعل لهذا المعلم")
    
    # Check if teacher already has 3 students
    current_count = await db.teacher_assignments.count_documents({"teacher_id": teacher_id})
    if current_count >= 3:
        raise HTTPException(status_code=400, detail="المعلم لديه بالفعل الحد الأقصى من الطلاب (3)")
    
    assignment = TeacherStudentAssignment(teacher_id=teacher_id, student_id=student_id)
    doc = assignment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.teacher_assignments.insert_one(doc)
    
    return {"message": "تم تخصيص الطالب للمعلم بنجاح"}

@api_router.get("/teacher-assignments/{teacher_id}")
async def get_teacher_students(teacher_id: str):
    assignments = await db.teacher_assignments.find({"teacher_id": teacher_id}, {"_id": 0}).to_list(10)
    student_ids = [a["student_id"] for a in assignments]
    
    students = []
    for sid in student_ids:
        student = await db.students.find_one({"id": sid}, {"_id": 0})
        if student:
            if isinstance(student.get('created_at'), str):
                student['created_at'] = datetime.fromisoformat(student['created_at'])
            students.append(student)
    
    return students

@api_router.get("/teacher-assignments/student/{student_id}")
async def get_student_teachers(student_id: str):
    assignments = await db.teacher_assignments.find({"student_id": student_id}, {"_id": 0}).to_list(10)
    teacher_ids = [a["teacher_id"] for a in assignments]
    
    teachers = []
    for tid in teacher_ids:
        teacher = await db.teachers.find_one({"id": tid}, {"_id": 0, "password_hash": 0})
        if teacher:
            if isinstance(teacher.get('created_at'), str):
                teacher['created_at'] = datetime.fromisoformat(teacher['created_at'])
            teachers.append(teacher)
    
    return teachers

@api_router.delete("/teacher-assignments")
async def remove_student_from_teacher(data: dict):
    teacher_id = data.get("teacher_id")
    student_id = data.get("student_id")
    
    result = await db.teacher_assignments.delete_one({"teacher_id": teacher_id, "student_id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="التخصيص غير موجود")
    
    return {"message": "تم إزالة تخصيص الطالب"}

# Quran Points APIs (Teachers add points for their assigned students)
@api_router.post("/quran-points", response_model=QuranPointTransaction)
async def add_quran_points(data: dict):
    teacher_id = data.get("teacher_id")
    student_id = data.get("student_id")
    category = data.get("category")
    points = data.get("points")
    notes = data.get("notes")
    
    # Verify teacher is assigned to this student
    assignment = await db.teacher_assignments.find_one({"teacher_id": teacher_id, "student_id": student_id})
    if not assignment:
        raise HTTPException(status_code=403, detail="المعلم غير مخصص لهذا الطالب")
    
    # Create transaction
    trans_obj = QuranPointTransaction(
        student_id=student_id,
        teacher_id=teacher_id,
        category=category,
        points=points,
        notes=notes
    )
    doc = trans_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.quran_points.insert_one(doc)
    
    # Update student's total points
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if student:
        new_total = student.get('total_points', 0) + points
        await db.students.update_one(
            {"id": student_id},
            {"$set": {"total_points": new_total}}
        )
    
    return trans_obj

@api_router.get("/quran-points/teacher/{teacher_id}")
async def get_teacher_quran_points(teacher_id: str):
    transactions = await db.quran_points.find(
        {"teacher_id": teacher_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Add student info to each transaction
    result = []
    for t in transactions:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        student = await db.students.find_one({"id": t["student_id"]}, {"_id": 0, "name": 1, "photo": 1})
        if student:
            t['student'] = student
        result.append(t)
    
    return result

@api_router.get("/quran-points/student/{student_id}")
async def get_student_quran_points(student_id: str):
    transactions = await db.quran_points.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for t in transactions:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    
    return transactions

@api_router.get("/teacher/dashboard/{teacher_id}")
async def get_teacher_dashboard(teacher_id: str):
    """Get all data a teacher needs for their dashboard"""
    # Get teacher info
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0, "password_hash": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="المعلم غير موجود")
    
    # Get assigned students
    students = await get_teacher_students(teacher_id)
    
    # Get recent quran points added by this teacher
    recent_points = await db.quran_points.find(
        {"teacher_id": teacher_id}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    for t in recent_points:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        student = await db.students.find_one({"id": t["student_id"]}, {"_id": 0, "name": 1, "photo": 1})
        if student:
            t['student'] = student
    
    return {
        "teacher": teacher,
        "students": students,
        "recent_points": recent_points,
        "categories": QURAN_CATEGORIES
    }

# Point Categories
@api_router.get("/categories/deductions")
async def get_deduction_categories():
    return DEDUCTION_CATEGORIES

@api_router.get("/categories/positive")
async def get_positive_categories():
    return POSITIVE_CATEGORIES

# Teams API
@api_router.get("/teams")
async def get_teams():
    return TEAMS

@api_router.get("/teams/{team_id}/students")
async def get_team_students(team_id: str):
    students = await db.students.find({"team": team_id}, {"_id": 0}).sort("total_points", -1).to_list(100)
    for s in students:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return students

# Star Player APIs
@api_router.post("/star-player", response_model=StarPlayer)
async def set_star_player(star: StarPlayerCreate):
    # Deactivate current star player
    await db.star_players.update_many({"is_active": True}, {"$set": {"is_active": False}})
    
    # Create new star player
    star_obj = StarPlayer(**star.model_dump())
    doc = star_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.star_players.insert_one(doc)
    return star_obj

@api_router.get("/star-player")
async def get_star_player():
    star = await db.star_players.find_one({"is_active": True}, {"_id": 0})
    if not star:
        return None
    if isinstance(star.get('created_at'), str):
        star['created_at'] = datetime.fromisoformat(star['created_at'])
    
    # Get student info
    student = await db.students.find_one({"id": star['student_id']}, {"_id": 0})
    if student:
        star['student'] = student
    return star

@api_router.delete("/star-player")
async def remove_star_player():
    await db.star_players.update_many({"is_active": True}, {"$set": {"is_active": False}})
    return {"message": "تم إزالة نجم الدوري"}

# Football League APIs
@api_router.post("/league/matches", response_model=LeagueMatch)
async def create_match(match: LeagueMatchCreate):
    match_obj = LeagueMatch(**match.model_dump())
    doc = match_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.league_matches.insert_one(doc)
    return match_obj

@api_router.get("/league/matches")
async def get_matches():
    matches = await db.league_matches.find({}, {"_id": 0}).to_list(100)
    for m in matches:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return matches

@api_router.put("/league/matches/{match_id}")
async def update_match(match_id: str, update: LeagueMatchUpdate):
    result = await db.league_matches.update_one(
        {"id": match_id},
        {"$set": update.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="المباراة غير موجودة")
    return {"message": "تم تحديث نتيجة المباراة"}

@api_router.delete("/league/matches/{match_id}")
async def delete_match(match_id: str):
    result = await db.league_matches.delete_one({"id": match_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المباراة غير موجودة")
    return {"message": "تم حذف المباراة"}

@api_router.get("/league/standings")
async def get_standings():
    matches = await db.league_matches.find({"is_played": True}, {"_id": 0}).to_list(100)
    
    # Calculate standings for each team
    standings = {}
    for team in TEAMS:
        standings[team['id']] = {
            "team_id": team['id'],
            "team_name": team['name'],
            "team_emoji": team['emoji'],
            "team_color": team['color'],
            "played": 0,
            "won": 0,
            "drawn": 0,
            "lost": 0,
            "goals_for": 0,
            "goals_against": 0,
            "goal_difference": 0,
            "points": 0
        }
    
    for match in matches:
        t1 = match['team1_id']
        t2 = match['team2_id']
        s1 = match['team1_score']
        s2 = match['team2_score']
        
        if t1 in standings and t2 in standings:
            # Update played
            standings[t1]['played'] += 1
            standings[t2]['played'] += 1
            
            # Update goals
            standings[t1]['goals_for'] += s1
            standings[t1]['goals_against'] += s2
            standings[t2]['goals_for'] += s2
            standings[t2]['goals_against'] += s1
            
            # Update wins/draws/losses and points
            if s1 > s2:
                standings[t1]['won'] += 1
                standings[t1]['points'] += 3
                standings[t2]['lost'] += 1
            elif s2 > s1:
                standings[t2]['won'] += 1
                standings[t2]['points'] += 3
                standings[t1]['lost'] += 1
            else:
                standings[t1]['drawn'] += 1
                standings[t2]['drawn'] += 1
                standings[t1]['points'] += 1
                standings[t2]['points'] += 1
    
    # Calculate goal difference
    for team_id in standings:
        standings[team_id]['goal_difference'] = standings[team_id]['goals_for'] - standings[team_id]['goals_against']
    
    # Sort by points, then goal difference, then goals for
    sorted_standings = sorted(
        standings.values(),
        key=lambda x: (x['points'], x['goal_difference'], x['goals_for']),
        reverse=True
    )
    
    return sorted_standings

# Viewer Page Data API (for read-only access)
@api_router.get("/viewer/all-data")
async def get_all_data_for_viewer():
    students = await db.students.find({}, {"_id": 0}).sort("total_points", -1).to_list(1000)
    competitions = await db.competitions.find({}, {"_id": 0}).to_list(100)
    matches = await db.league_matches.find({}, {"_id": 0}).to_list(100)
    star = await db.star_players.find_one({"is_active": True}, {"_id": 0})
    
    # Get star player student info
    if star:
        student = await db.students.find_one({"id": star['student_id']}, {"_id": 0})
        if student:
            star['student'] = student
    
    # Get standings
    standings_data = []
    played_matches = [m for m in matches if m.get('is_played')]
    standings = {}
    for team in TEAMS:
        standings[team['id']] = {
            "team_id": team['id'],
            "team_name": team['name'],
            "team_emoji": team['emoji'],
            "team_color": team['color'],
            "team_bg": team['bg'],
            "played": 0, "won": 0, "drawn": 0, "lost": 0,
            "goals_for": 0, "goals_against": 0, "goal_difference": 0, "points": 0
        }
    
    for match in played_matches:
        t1, t2 = match['team1_id'], match['team2_id']
        s1, s2 = match['team1_score'], match['team2_score']
        if t1 in standings and t2 in standings:
            standings[t1]['played'] += 1
            standings[t2]['played'] += 1
            standings[t1]['goals_for'] += s1
            standings[t1]['goals_against'] += s2
            standings[t2]['goals_for'] += s2
            standings[t2]['goals_against'] += s1
            if s1 > s2:
                standings[t1]['won'] += 1
                standings[t1]['points'] += 3
                standings[t2]['lost'] += 1
            elif s2 > s1:
                standings[t2]['won'] += 1
                standings[t2]['points'] += 3
                standings[t1]['lost'] += 1
            else:
                standings[t1]['drawn'] += 1
                standings[t2]['drawn'] += 1
                standings[t1]['points'] += 1
                standings[t2]['points'] += 1
    
    for team_id in standings:
        standings[team_id]['goal_difference'] = standings[team_id]['goals_for'] - standings[team_id]['goals_against']
    
    standings_data = sorted(standings.values(), key=lambda x: (x['points'], x['goal_difference'], x['goals_for']), reverse=True)
    
    return {
        "students": students,
        "teams": TEAMS,
        "competitions": competitions,
        "matches": matches,
        "standings": standings_data,
        "star_player": star,
        "deduction_categories": DEDUCTION_CATEGORIES,
        "positive_categories": POSITIVE_CATEGORIES
    }

# Student APIs
@api_router.post("/students", response_model=Student)
async def create_student(student: StudentCreate):
    student_obj = Student(**student.model_dump())
    doc = student_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.students.insert_one(doc)
    return student_obj

@api_router.get("/students", response_model=List[Student])
async def get_students():
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for s in students:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return students

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    if isinstance(student.get('created_at'), str):
        student['created_at'] = datetime.fromisoformat(student['created_at'])
    return student

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, update: StudentUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="لا توجد بيانات للتحديث")
    
    result = await db.students.update_one({"id": student_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if isinstance(student.get('created_at'), str):
        student['created_at'] = datetime.fromisoformat(student['created_at'])
    return student

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    # Also delete related point transactions
    await db.point_transactions.delete_many({"student_id": student_id})
    await db.quiz_submissions.delete_many({"student_id": student_id})
    return {"message": "تم حذف الطالب بنجاح"}

# Point Transaction APIs
@api_router.post("/points", response_model=PointTransaction)
async def add_points(transaction: PointTransactionCreate):
    # Get the student
    student = await db.students.find_one({"id": transaction.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Create transaction
    trans_obj = PointTransaction(**transaction.model_dump())
    doc = trans_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.point_transactions.insert_one(doc)
    
    # Update student's total points
    new_total = student.get('total_points', 0) + transaction.points
    await db.students.update_one(
        {"id": transaction.student_id},
        {"$set": {"total_points": new_total}}
    )
    
    return trans_obj

@api_router.get("/points/{student_id}", response_model=List[PointTransaction])
async def get_student_points(student_id: str):
    transactions = await db.point_transactions.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for t in transactions:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return transactions

# Competition APIs
@api_router.post("/competitions", response_model=Competition)
async def create_competition(competition: CompetitionCreate):
    comp_obj = Competition(**competition.model_dump())
    doc = comp_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.competitions.insert_one(doc)
    return comp_obj

@api_router.get("/competitions", response_model=List[Competition])
async def get_competitions():
    competitions = await db.competitions.find({}, {"_id": 0}).to_list(100)
    for c in competitions:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return competitions

@api_router.get("/competitions/{competition_id}", response_model=Competition)
async def get_competition(competition_id: str):
    competition = await db.competitions.find_one({"id": competition_id}, {"_id": 0})
    if not competition:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    if isinstance(competition.get('created_at'), str):
        competition['created_at'] = datetime.fromisoformat(competition['created_at'])
    return competition

@api_router.delete("/competitions/{competition_id}")
async def delete_competition(competition_id: str):
    result = await db.competitions.delete_one({"id": competition_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    return {"message": "تم حذف المنافسة بنجاح"}

@api_router.put("/competitions/{competition_id}/toggle")
async def toggle_competition(competition_id: str):
    competition = await db.competitions.find_one({"id": competition_id}, {"_id": 0})
    if not competition:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    
    new_status = not competition.get('is_active', True)
    await db.competitions.update_one(
        {"id": competition_id},
        {"$set": {"is_active": new_status}}
    )
    return {"is_active": new_status}

# Question APIs
@api_router.post("/competitions/{competition_id}/questions")
async def add_question(competition_id: str, question: QuestionCreate):
    competition = await db.competitions.find_one({"id": competition_id}, {"_id": 0})
    if not competition:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    
    question_obj = Question(
        text=question.text,
        options=question.options,
        points=question.points
    )
    
    questions = competition.get('questions', [])
    questions.append(question_obj.model_dump())
    
    await db.competitions.update_one(
        {"id": competition_id},
        {"$set": {"questions": questions}}
    )
    
    return question_obj

@api_router.delete("/competitions/{competition_id}/questions/{question_id}")
async def delete_question(competition_id: str, question_id: str):
    competition = await db.competitions.find_one({"id": competition_id}, {"_id": 0})
    if not competition:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    
    questions = competition.get('questions', [])
    questions = [q for q in questions if q.get('id') != question_id]
    
    await db.competitions.update_one(
        {"id": competition_id},
        {"$set": {"questions": questions}}
    )
    
    return {"message": "تم حذف السؤال بنجاح"}

# Quiz Submission APIs
@api_router.post("/quiz/answer")
async def submit_answer(answer: QuizAnswer):
    # Check if already answered
    existing = await db.quiz_submissions.find_one({
        "student_id": answer.student_id,
        "competition_id": answer.competition_id,
        "question_id": answer.question_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="لقد أجبت على هذا السؤال من قبل")
    
    # Get the competition and question
    competition = await db.competitions.find_one({"id": answer.competition_id}, {"_id": 0})
    if not competition:
        raise HTTPException(status_code=404, detail="المنافسة غير موجودة")
    
    if not competition.get('is_active', True):
        raise HTTPException(status_code=400, detail="المنافسة غير نشطة")
    
    question = None
    for q in competition.get('questions', []):
        if q.get('id') == answer.question_id:
            question = q
            break
    
    if not question:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    
    # Check if answer is correct
    options = question.get('options', [])
    if answer.selected_option_index < 0 or answer.selected_option_index >= len(options):
        raise HTTPException(status_code=400, detail="اختيار غير صالح")
    
    is_correct = options[answer.selected_option_index].get('is_correct', False)
    points_earned = question.get('points', 0) if is_correct else 0
    
    # Create submission
    submission = QuizSubmission(
        student_id=answer.student_id,
        competition_id=answer.competition_id,
        question_id=answer.question_id,
        selected_option_index=answer.selected_option_index,
        is_correct=is_correct,
        points_earned=points_earned
    )
    
    doc = submission.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.quiz_submissions.insert_one(doc)
    
    # Update student points if correct
    if is_correct:
        student = await db.students.find_one({"id": answer.student_id}, {"_id": 0})
        if student:
            new_total = student.get('total_points', 0) + points_earned
            await db.students.update_one(
                {"id": answer.student_id},
                {"$set": {"total_points": new_total}}
            )
    
    return {
        "is_correct": is_correct,
        "points_earned": points_earned,
        "message": "إجابة صحيحة! أحسنت" if is_correct else "إجابة خاطئة، حاول في السؤال التالي"
    }

@api_router.get("/quiz/submissions/{student_id}/{competition_id}")
async def get_student_submissions(student_id: str, competition_id: str):
    submissions = await db.quiz_submissions.find({
        "student_id": student_id,
        "competition_id": competition_id
    }, {"_id": 0}).to_list(100)
    return submissions

# Leaderboard API
@api_router.get("/leaderboard")
async def get_leaderboard():
    students = await db.students.find({}, {"_id": 0}).sort("total_points", -1).to_list(100)
    for s in students:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return students

@api_router.post("/students/regenerate-ids")
async def regenerate_all_student_ids():
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    updated = 0
    for student in students:
        old_id = student["id"]
        new_id = str(uuid.uuid4())
        await db.students.update_one({"id": old_id}, {"$set": {"id": new_id}})
        await db.point_transactions.update_many({"student_id": old_id}, {"$set": {"student_id": new_id}})
        await db.quiz_submissions.update_many({"student_id": old_id}, {"$set": {"student_id": new_id}})
        await db.star_players.update_many({"student_id": old_id}, {"$set": {"student_id": new_id}})
        updated += 1
    return {"message": f"تم تحديث {updated} طالب", "updated": updated}

# =================== WEEKLY TASKS APIs ===================

def get_current_week_monday():
    """Get this week's Monday date string"""
    from datetime import timedelta
    today = datetime.now(timezone.utc)
    monday = today - timedelta(days=today.weekday())
    return monday.strftime("%Y-%m-%d")

@api_router.get("/tasks/types")
async def get_task_types():
    return TASK_TYPES

@api_router.get("/tasks/social-items")
async def get_social_items():
    return SOCIAL_ITEMS

@api_router.post("/tasks/distribute")
async def distribute_weekly_tasks():
    """Distribute weekly tasks to all teams"""
    week = get_current_week_monday()
    existing = await db.weekly_tasks.find_one({"week_start": week, "is_active": True})
    if existing:
        return {"message": "المهام موزعة بالفعل لهذا الأسبوع"}
    
    tasks = []
    for team in TEAMS:
        for task_type in TASK_TYPES:
            task = WeeklyTask(
                task_type=task_type["id"],
                team_id=team["id"],
                week_start=week
            )
            task_dict = task.model_dump()
            tasks.append(task_dict)
    
    if tasks:
        await db.weekly_tasks.insert_many(tasks)
    return {"message": f"تم توزيع {len(tasks)} مهمة", "week": week}

@api_router.delete("/tasks/clear")
async def clear_weekly_tasks():
    """Clear all active weekly tasks (Friday cleanup)"""
    week = get_current_week_monday()
    await db.weekly_tasks.update_many(
        {"week_start": week, "is_active": True},
        {"$set": {"is_active": False}}
    )
    await db.special_dinners.update_many(
        {"week_start": week, "is_active": True},
        {"$set": {"is_active": False}}
    )
    return {"message": "تم إزالة جميع المهام"}

@api_router.get("/tasks/active")
async def get_active_tasks():
    """Get all active weekly tasks"""
    week = get_current_week_monday()
    tasks = await db.weekly_tasks.find({"week_start": week, "is_active": True}, {"_id": 0}).to_list(100)
    reservations = await db.social_reservations.find({"week_start": week}, {"_id": 0}).to_list(100)
    dinners = await db.special_dinners.find({"week_start": week, "is_active": True}, {"_id": 0}).to_list(100)
    return {"tasks": tasks, "reservations": reservations, "dinners": dinners, "week": week}

@api_router.get("/tasks/team/{team_id}")
async def get_team_tasks(team_id: str):
    """Get active tasks for a specific team"""
    week = get_current_week_monday()
    tasks = await db.weekly_tasks.find({"team_id": team_id, "week_start": week, "is_active": True}, {"_id": 0}).to_list(20)
    reservations = await db.social_reservations.find({"team_id": team_id, "week_start": week}, {"_id": 0}).to_list(20)
    dinners = await db.special_dinners.find({"team_id": team_id, "week_start": week, "is_active": True}, {"_id": 0}).to_list(5)
    return {"tasks": tasks, "reservations": reservations, "dinners": dinners}

@api_router.put("/tasks/{task_id}/assign")
async def assign_task_to_student(task_id: str, data: dict):
    """Admin assigns a student to a task (like Adhan)"""
    student_id = data.get("student_id")
    result = await db.weekly_tasks.update_one(
        {"id": task_id},
        {"$set": {"assigned_student_id": student_id}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    return {"message": "تم تعيين الطالب للمهمة"}

@api_router.post("/tasks/social/reserve")
async def reserve_social_item(data: dict):
    """Student reserves a social item"""
    student_id = data.get("student_id")
    task_id = data.get("task_id")
    team_id = data.get("team_id")
    item = data.get("item")
    week = get_current_week_monday()
    
    if item not in SOCIAL_ITEMS:
        raise HTTPException(status_code=400, detail="صنف غير صالح")
    
    # Check if student already reserved
    existing = await db.social_reservations.find_one({
        "student_id": student_id, "team_id": team_id, "week_start": week
    })
    if existing:
        raise HTTPException(status_code=400, detail="لقد اخترت صنفاً بالفعل")
    
    # Check if item already taken in this team
    taken = await db.social_reservations.find_one({
        "team_id": team_id, "item": item, "week_start": week
    })
    if taken:
        raise HTTPException(status_code=400, detail="هذا الصنف محجوز من طالب آخر")
    
    reservation = SocialReservation(
        task_id=task_id,
        team_id=team_id,
        student_id=student_id,
        item=item,
        week_start=week
    )
    await db.social_reservations.insert_one(reservation.model_dump())
    return {"message": f"تم حجز {item} بنجاح"}

@api_router.post("/tasks/special-dinner")
async def create_special_dinner(data: dict):
    """Admin creates a special dinner task for a team"""
    team_id = data.get("team_id")
    student_id = data.get("student_id")
    week = get_current_week_monday()
    
    dinner = SpecialDinner(
        team_id=team_id,
        assigned_student_id=student_id,
        week_start=week
    )
    await db.special_dinners.insert_one(dinner.model_dump())
    return {"message": "تم إضافة مهمة العشاء المتميز"}

@api_router.delete("/tasks/special-dinner/{dinner_id}")
async def delete_special_dinner(dinner_id: str):
    await db.special_dinners.delete_one({"id": dinner_id})
    return {"message": "تم حذف مهمة العشاء المتميز"}

# Auto-scheduler check endpoint
@api_router.post("/tasks/auto-schedule")
async def auto_schedule_tasks():
    """Check and auto-distribute/clear tasks based on day"""
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    day = now.weekday()  # 0=Mon, 4=Fri
    week = get_current_week_monday()
    
    if day == 0:  # Monday - distribute
        existing = await db.weekly_tasks.find_one({"week_start": week, "is_active": True})
        if not existing:
            tasks = []
            for team in TEAMS:
                for task_type in TASK_TYPES:
                    task = WeeklyTask(task_type=task_type["id"], team_id=team["id"], week_start=week)
                    tasks.append(task.model_dump())
            if tasks:
                await db.weekly_tasks.insert_many(tasks)
            return {"action": "distributed", "count": len(tasks)}
    elif day == 4:  # Friday - clear
        await db.weekly_tasks.update_many({"week_start": week, "is_active": True}, {"$set": {"is_active": False}})
        await db.special_dinners.update_many({"week_start": week, "is_active": True}, {"$set": {"is_active": False}})
        return {"action": "cleared"}
    
    return {"action": "none", "day": day}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
