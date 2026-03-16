import requests
import sys
from datetime import datetime
import json

class YouthClubAPITester:
    def __init__(self, base_url="https://league-manager-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'students': [],
            'competitions': [],
            'point_transactions': []
        }

    def log_result(self, test_name, success, message=""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {test_name}: {message}")
        if success:
            self.tests_passed += 1

    def run_api_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_result(name, True, f"Status {response.status_code}")
                    return True, response_data
                except:
                    self.log_result(name, True, f"Status {response.status_code} (no JSON)")
                    return True, {}
            else:
                self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail')
                    print(f"   Error detail: {error_detail}")
                except:
                    print(f"   Response text: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, data = self.run_api_test(
            "Root API", "GET", "", 200
        )
        return success

    def test_categories(self):
        """Test point categories endpoints"""
        success1, deductions = self.run_api_test(
            "Get Deduction Categories", "GET", "categories/deductions", 200
        )
        
        success2, positive = self.run_api_test(
            "Get Positive Categories", "GET", "categories/positive", 200
        )
        
        # Validate category structure
        if success1 and isinstance(deductions, list) and len(deductions) > 0:
            if 'name' in deductions[0] and 'points' in deductions[0]:
                self.log_result("Deduction Categories Structure", True, f"Found {len(deductions)} categories")
            else:
                self.log_result("Deduction Categories Structure", False, "Missing name or points fields")
        
        if success2 and isinstance(positive, list) and len(positive) > 0:
            if 'name' in positive[0] and 'points' in positive[0]:
                self.log_result("Positive Categories Structure", True, f"Found {len(positive)} categories")
            else:
                self.log_result("Positive Categories Structure", False, "Missing name or points fields")

        return success1 and success2

    def test_student_crud(self):
        """Test student CRUD operations"""
        
        # Test GET students (empty initially)
        success, students = self.run_api_test(
            "Get Students (Initial)", "GET", "students", 200
        )
        
        # Test CREATE student
        test_student = {
            "name": f"طالب اختبار {datetime.now().strftime('%H%M%S')}",
            "phone": "0501234567",
            "photo": None
        }
        
        success, created_student = self.run_api_test(
            "Create Student", "POST", "students", 200, test_student
        )
        
        if success and created_student:
            student_id = created_student.get('id')
            self.created_resources['students'].append(student_id)
            
            # Test GET single student
            success, fetched_student = self.run_api_test(
                "Get Single Student", "GET", f"students/{student_id}", 200
            )
            
            # Test UPDATE student
            update_data = {"name": "طالب محدث"}
            success, updated_student = self.run_api_test(
                "Update Student", "PUT", f"students/{student_id}", 200, update_data
            )
            
            # Test GET students after creation
            success, students_after = self.run_api_test(
                "Get Students (After Create)", "GET", "students", 200
            )
            
            return True
        
        return False

    def test_competitions_crud(self):
        """Test competition CRUD operations"""
        
        # Test GET competitions (empty initially)
        success, competitions = self.run_api_test(
            "Get Competitions (Initial)", "GET", "competitions", 200
        )
        
        # Test CREATE competition
        test_competition = {
            "title": f"منافسة اختبار {datetime.now().strftime('%H%M%S')}",
            "description": "وصف منافسة الاختبار"
        }
        
        success, created_competition = self.run_api_test(
            "Create Competition", "POST", "competitions", 200, test_competition
        )
        
        if success and created_competition:
            competition_id = created_competition.get('id')
            self.created_resources['competitions'].append(competition_id)
            
            # Test GET single competition
            success, fetched_comp = self.run_api_test(
                "Get Single Competition", "GET", f"competitions/{competition_id}", 200
            )
            
            # Test toggle competition
            success, toggle_result = self.run_api_test(
                "Toggle Competition", "PUT", f"competitions/{competition_id}/toggle", 200
            )
            
            return True
        
        return False

    def test_questions_management(self):
        """Test question management for competitions"""
        
        if not self.created_resources['competitions']:
            self.log_result("Question Management", False, "No competitions available for testing")
            return False
        
        competition_id = self.created_resources['competitions'][0]
        
        # Test ADD question
        test_question = {
            "competition_id": competition_id,
            "text": "ما هو اسم النادي؟",
            "points": 10,
            "options": [
                {"text": "نادي بارع", "is_correct": True},
                {"text": "نادي آخر", "is_correct": False},
                {"text": "لا أعرف", "is_correct": False}
            ]
        }
        
        success, created_question = self.run_api_test(
            "Add Question", "POST", f"competitions/{competition_id}/questions", 200, test_question
        )
        
        if success and created_question:
            question_id = created_question.get('id')
            
            # Test DELETE question
            success, delete_result = self.run_api_test(
                "Delete Question", "DELETE", f"competitions/{competition_id}/questions/{question_id}", 200
            )
            
            return True
        
        return False

    def test_points_system(self):
        """Test point transaction system"""
        
        if not self.created_resources['students']:
            self.log_result("Points System", False, "No students available for testing")
            return False
        
        student_id = self.created_resources['students'][0]
        
        # Test ADD positive points
        positive_transaction = {
            "student_id": student_id,
            "category": "اختبار إيجابي",
            "points": 20,
            "is_positive": True
        }
        
        success, created_transaction = self.run_api_test(
            "Add Positive Points", "POST", "points", 200, positive_transaction
        )
        
        # Test ADD negative points (deduction)
        negative_transaction = {
            "student_id": student_id,
            "category": "اختبار سلبي", 
            "points": -10,
            "is_positive": False
        }
        
        success, created_deduction = self.run_api_test(
            "Add Deduction Points", "POST", "points", 200, negative_transaction
        )
        
        # Test GET student points
        success, transactions = self.run_api_test(
            "Get Student Points", "GET", f"points/{student_id}", 200
        )
        
        return True

    def test_quiz_system(self):
        """Test quiz submission system"""
        
        if not self.created_resources['students'] or not self.created_resources['competitions']:
            self.log_result("Quiz System", False, "No students or competitions available")
            return False
        
        student_id = self.created_resources['students'][0]
        competition_id = self.created_resources['competitions'][0]
        
        # First add a question to test with
        test_question = {
            "competition_id": competition_id,
            "text": "سؤال اختبار؟",
            "points": 15,
            "options": [
                {"text": "إجابة صحيحة", "is_correct": True},
                {"text": "إجابة خاطئة", "is_correct": False}
            ]
        }
        
        success, question = self.run_api_test(
            "Add Quiz Question", "POST", f"competitions/{competition_id}/questions", 200, test_question
        )
        
        if success and question:
            question_id = question.get('id')
            
            # Test submit answer
            quiz_answer = {
                "student_id": student_id,
                "competition_id": competition_id,
                "question_id": question_id,
                "selected_option_index": 0  # Correct answer
            }
            
            success, answer_result = self.run_api_test(
                "Submit Quiz Answer", "POST", "quiz/answer", 200, quiz_answer
            )
            
            # Test get submissions
            success, submissions = self.run_api_test(
                "Get Student Submissions", "GET", f"quiz/submissions/{student_id}/{competition_id}", 200
            )
            
            return True
        
        return False

    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        success, leaderboard = self.run_api_test(
            "Get Leaderboard", "GET", "leaderboard", 200
        )
        
        if success and isinstance(leaderboard, list):
            self.log_result("Leaderboard Structure", True, f"Found {len(leaderboard)} students")
        
        return success

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        # Delete competitions (this will also delete questions)
        for comp_id in self.created_resources['competitions']:
            success, _ = self.run_api_test(
                f"Delete Competition {comp_id[:8]}", "DELETE", f"competitions/{comp_id}", 200
            )
        
        # Delete students (this will also delete point transactions)
        for student_id in self.created_resources['students']:
            success, _ = self.run_api_test(
                f"Delete Student {student_id[:8]}", "DELETE", f"students/{student_id}", 200
            )

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🧪 Starting Youth Club API Tests")
        print(f"📡 Testing backend: {self.base_url}")
        print("=" * 60)

        # Test sequence
        tests = [
            ("Root Endpoint", self.test_root_endpoint),
            ("Point Categories", self.test_categories),
            ("Student CRUD", self.test_student_crud),
            ("Competition CRUD", self.test_competitions_crud),
            ("Question Management", self.test_questions_management),
            ("Points System", self.test_points_system),
            ("Quiz System", self.test_quiz_system),
            ("Leaderboard", self.test_leaderboard),
        ]

        for test_name, test_func in tests:
            print(f"\n📋 Running {test_name} Tests...")
            try:
                test_func()
            except Exception as e:
                self.log_result(f"{test_name} Exception", False, str(e))

        # Cleanup
        self.cleanup_resources()

        # Final results
        print("\n" + "=" * 60)
        print(f"📊 TEST RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = YouthClubAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)