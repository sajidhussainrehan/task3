"""
Tests for Football League Management, Quiz Answering, and Viewer Page APIs
- League: create match, update score, delete match, get standings
- Quiz: submit answer, verify points awarded
- Viewer: get all data for spectator page
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLeagueMatchAPI:
    """Football League Match CRUD and Standings tests"""
    
    # Store created match IDs for cleanup
    created_match_ids = []
    
    @pytest.fixture(autouse=True)
    def setup_and_teardown(self):
        """Setup and teardown for each test"""
        yield
        # Cleanup: Delete any matches created during tests
        for match_id in self.created_match_ids:
            try:
                requests.delete(f"{BASE_URL}/api/league/matches/{match_id}")
            except:
                pass
        self.created_match_ids.clear()
    
    def test_get_teams(self):
        """Test GET /api/teams returns the 4 teams"""
        response = requests.get(f"{BASE_URL}/api/teams")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        teams = response.json()
        assert len(teams) == 4, f"Expected 4 teams, got {len(teams)}"
        
        team_ids = [t['id'] for t in teams]
        assert 'sadara' in team_ids, "Missing sadara team"
        assert 'nukhba' in team_ids, "Missing nukhba team"
        assert 'zaama' in team_ids, "Missing zaama team"
        assert 'riyada' in team_ids, "Missing riyada team"
        print("✓ GET /api/teams - All 4 teams returned correctly")
    
    def test_create_match(self):
        """Test POST /api/league/matches creates a match"""
        payload = {
            "team1_id": "sadara",
            "team2_id": "nukhba",
            "match_date": "2026-01-15"
        }
        response = requests.post(f"{BASE_URL}/api/league/matches", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        match = response.json()
        assert 'id' in match, "Match should have an id"
        assert match['team1_id'] == 'sadara', f"Expected team1_id=sadara, got {match['team1_id']}"
        assert match['team2_id'] == 'nukhba', f"Expected team2_id=nukhba, got {match['team2_id']}"
        assert match['team1_score'] == 0, f"Expected team1_score=0, got {match['team1_score']}"
        assert match['team2_score'] == 0, f"Expected team2_score=0, got {match['team2_score']}"
        assert match['is_played'] == False, f"Expected is_played=False, got {match['is_played']}"
        
        self.created_match_ids.append(match['id'])
        print(f"✓ POST /api/league/matches - Match created: {match['id']}")
        return match['id']
    
    def test_create_match_same_team_allowed(self):
        """Test creating a match with same team (no server-side validation)"""
        payload = {
            "team1_id": "sadara",
            "team2_id": "sadara"
        }
        # Note: Server allows same team (validation is frontend-only)
        response = requests.post(f"{BASE_URL}/api/league/matches", json=payload)
        # This may be 200 or 400 depending on backend validation
        if response.status_code == 200:
            self.created_match_ids.append(response.json()['id'])
            print("✓ Server allows same team match (frontend validates)")
        else:
            print(f"✓ Server rejects same team match: {response.status_code}")
    
    def test_get_matches(self):
        """Test GET /api/league/matches returns all matches"""
        response = requests.get(f"{BASE_URL}/api/league/matches")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        matches = response.json()
        assert isinstance(matches, list), "Expected list of matches"
        print(f"✓ GET /api/league/matches - Returned {len(matches)} matches")
    
    def test_update_match_score(self):
        """Test PUT /api/league/matches/:id updates match score"""
        # First create a match
        payload = {
            "team1_id": "zaama",
            "team2_id": "riyada"
        }
        create_res = requests.post(f"{BASE_URL}/api/league/matches", json=payload)
        assert create_res.status_code == 200
        match_id = create_res.json()['id']
        self.created_match_ids.append(match_id)
        
        # Update the score
        update_payload = {
            "team1_score": 3,
            "team2_score": 1,
            "is_played": True
        }
        update_res = requests.put(f"{BASE_URL}/api/league/matches/{match_id}", json=update_payload)
        assert update_res.status_code == 200, f"Expected 200, got {update_res.status_code}: {update_res.text}"
        
        # Verify the update by getting all matches
        get_res = requests.get(f"{BASE_URL}/api/league/matches")
        matches = get_res.json()
        updated_match = next((m for m in matches if m['id'] == match_id), None)
        
        assert updated_match is not None, "Match not found after update"
        assert updated_match['team1_score'] == 3, f"Expected team1_score=3, got {updated_match['team1_score']}"
        assert updated_match['team2_score'] == 1, f"Expected team2_score=1, got {updated_match['team2_score']}"
        assert updated_match['is_played'] == True, f"Expected is_played=True, got {updated_match['is_played']}"
        
        print(f"✓ PUT /api/league/matches/{match_id} - Score updated to 3-1")
    
    def test_update_nonexistent_match(self):
        """Test PUT /api/league/matches with invalid ID returns 404"""
        update_payload = {
            "team1_score": 1,
            "team2_score": 0,
            "is_played": True
        }
        response = requests.put(f"{BASE_URL}/api/league/matches/nonexistent-id-123", json=update_payload)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ PUT /api/league/matches with invalid ID - Returns 404")
    
    def test_delete_match(self):
        """Test DELETE /api/league/matches/:id deletes the match"""
        # First create a match
        payload = {
            "team1_id": "sadara",
            "team2_id": "riyada"
        }
        create_res = requests.post(f"{BASE_URL}/api/league/matches", json=payload)
        assert create_res.status_code == 200
        match_id = create_res.json()['id']
        
        # Delete the match
        delete_res = requests.delete(f"{BASE_URL}/api/league/matches/{match_id}")
        assert delete_res.status_code == 200, f"Expected 200, got {delete_res.status_code}"
        
        # Verify it's deleted by checking matches list
        get_res = requests.get(f"{BASE_URL}/api/league/matches")
        matches = get_res.json()
        deleted_match = next((m for m in matches if m['id'] == match_id), None)
        assert deleted_match is None, "Match should be deleted"
        
        print(f"✓ DELETE /api/league/matches/{match_id} - Match deleted")
    
    def test_delete_nonexistent_match(self):
        """Test DELETE /api/league/matches with invalid ID returns 404"""
        response = requests.delete(f"{BASE_URL}/api/league/matches/nonexistent-id-456")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ DELETE /api/league/matches with invalid ID - Returns 404")
    
    def test_standings_calculation(self):
        """Test GET /api/league/standings calculates standings correctly"""
        # Get current standings
        response = requests.get(f"{BASE_URL}/api/league/standings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        standings = response.json()
        assert isinstance(standings, list), "Expected list of standings"
        assert len(standings) == 4, f"Expected 4 teams in standings, got {len(standings)}"
        
        # Verify each team has required fields
        required_fields = ['team_id', 'team_name', 'team_emoji', 'team_color', 'played', 'won', 'drawn', 'lost', 'goals_for', 'goals_against', 'goal_difference', 'points']
        for team in standings:
            for field in required_fields:
                assert field in team, f"Missing field '{field}' in standings"
        
        # Verify standings are sorted by points (descending)
        for i in range(len(standings) - 1):
            assert standings[i]['points'] >= standings[i+1]['points'], "Standings not sorted by points"
        
        print(f"✓ GET /api/league/standings - Returned standings for 4 teams, sorted by points")
    
    def test_standings_update_after_match(self):
        """Test standings update correctly after match result"""
        # Create and complete a match
        create_payload = {
            "team1_id": "sadara",
            "team2_id": "nukhba"
        }
        create_res = requests.post(f"{BASE_URL}/api/league/matches", json=create_payload)
        assert create_res.status_code == 200
        match_id = create_res.json()['id']
        self.created_match_ids.append(match_id)
        
        # Get initial standings
        initial_standings = requests.get(f"{BASE_URL}/api/league/standings").json()
        sadara_initial = next((t for t in initial_standings if t['team_id'] == 'sadara'), None)
        
        # Update match result: sadara wins 2-0
        update_payload = {
            "team1_score": 2,
            "team2_score": 0,
            "is_played": True
        }
        requests.put(f"{BASE_URL}/api/league/matches/{match_id}", json=update_payload)
        
        # Get updated standings
        updated_standings = requests.get(f"{BASE_URL}/api/league/standings").json()
        sadara_updated = next((t for t in updated_standings if t['team_id'] == 'sadara'), None)
        
        # Verify sadara's stats increased
        assert sadara_updated['played'] == sadara_initial['played'] + 1, "Played count should increase by 1"
        assert sadara_updated['won'] == sadara_initial['won'] + 1, "Won count should increase by 1"
        assert sadara_updated['goals_for'] == sadara_initial['goals_for'] + 2, "Goals for should increase by 2"
        assert sadara_updated['points'] == sadara_initial['points'] + 3, "Points should increase by 3 (win)"
        
        print("✓ Standings update correctly after match result")


class TestQuizAnswerAPI:
    """Quiz answering and points awarding tests"""
    
    test_competition_id = None
    test_student_id = None
    
    @classmethod
    def setup_class(cls):
        """Setup: Find a student and active competition with questions"""
        # Get students
        students_res = requests.get(f"{BASE_URL}/api/students")
        if students_res.status_code == 200 and students_res.json():
            cls.test_student_id = students_res.json()[0]['id']
        
        # Get competitions
        comps_res = requests.get(f"{BASE_URL}/api/competitions")
        if comps_res.status_code == 200:
            competitions = comps_res.json()
            # Find active competition with questions
            for comp in competitions:
                if comp.get('is_active') and comp.get('questions') and len(comp['questions']) > 0:
                    cls.test_competition_id = comp['id']
                    break
    
    def test_get_competitions(self):
        """Test GET /api/competitions returns list of competitions"""
        response = requests.get(f"{BASE_URL}/api/competitions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        competitions = response.json()
        assert isinstance(competitions, list), "Expected list of competitions"
        print(f"✓ GET /api/competitions - Returned {len(competitions)} competitions")
    
    def test_quiz_answer_requires_valid_student(self):
        """Test POST /api/quiz/answer fails with invalid student"""
        payload = {
            "student_id": "nonexistent-student-123",
            "competition_id": self.test_competition_id or "some-comp",
            "question_id": "some-question",
            "selected_option_index": 0
        }
        response = requests.post(f"{BASE_URL}/api/quiz/answer", json=payload)
        # Should fail with 404 (competition/student not found) or 400
        assert response.status_code in [400, 404], f"Expected 400/404, got {response.status_code}"
        print("✓ POST /api/quiz/answer - Rejects invalid student/competition")
    
    def test_quiz_answer_requires_valid_competition(self):
        """Test POST /api/quiz/answer fails with invalid competition"""
        if not self.test_student_id:
            pytest.skip("No student available for test")
        
        payload = {
            "student_id": self.test_student_id,
            "competition_id": "nonexistent-competition-123",
            "question_id": "some-question",
            "selected_option_index": 0
        }
        response = requests.post(f"{BASE_URL}/api/quiz/answer", json=payload)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ POST /api/quiz/answer - Returns 404 for invalid competition")
    
    def test_quiz_answer_flow(self):
        """Test complete quiz answer flow with points awarding"""
        # This test requires an active competition with questions
        if not self.test_student_id:
            print("⚠ Skipping quiz answer flow test - no student available")
            pytest.skip("No student available for test")
        
        # Create a test competition
        comp_payload = {
            "title": f"TEST_Quiz_Competition_{uuid.uuid4().hex[:8]}",
            "description": "Test competition for quiz flow"
        }
        comp_res = requests.post(f"{BASE_URL}/api/competitions", json=comp_payload)
        assert comp_res.status_code == 200, f"Failed to create competition: {comp_res.text}"
        competition = comp_res.json()
        comp_id = competition['id']
        
        try:
            # Add a question to the competition
            question_payload = {
                "competition_id": comp_id,
                "text": "What is 2+2?",
                "points": 15,
                "options": [
                    {"text": "3", "is_correct": False},
                    {"text": "4", "is_correct": True},
                    {"text": "5", "is_correct": False}
                ]
            }
            q_res = requests.post(f"{BASE_URL}/api/competitions/{comp_id}/questions", json=question_payload)
            assert q_res.status_code == 200, f"Failed to add question: {q_res.text}"
            question = q_res.json()
            question_id = question['id']
            
            # Get student's current points
            student_res = requests.get(f"{BASE_URL}/api/students/{self.test_student_id}")
            initial_points = student_res.json().get('total_points', 0)
            
            # Submit correct answer
            answer_payload = {
                "student_id": self.test_student_id,
                "competition_id": comp_id,
                "question_id": question_id,
                "selected_option_index": 1  # Correct answer
            }
            answer_res = requests.post(f"{BASE_URL}/api/quiz/answer", json=answer_payload)
            assert answer_res.status_code == 200, f"Expected 200, got {answer_res.status_code}: {answer_res.text}"
            
            answer_data = answer_res.json()
            assert answer_data['is_correct'] == True, "Answer should be marked correct"
            assert answer_data['points_earned'] == 15, f"Expected 15 points, got {answer_data['points_earned']}"
            
            # Verify student points increased
            student_after = requests.get(f"{BASE_URL}/api/students/{self.test_student_id}").json()
            assert student_after['total_points'] == initial_points + 15, "Student points should increase by 15"
            
            # Try to answer same question again - should fail
            duplicate_res = requests.post(f"{BASE_URL}/api/quiz/answer", json=answer_payload)
            assert duplicate_res.status_code == 400, "Should not allow duplicate answers"
            
            print("✓ POST /api/quiz/answer - Complete quiz flow works correctly")
            
        finally:
            # Cleanup: Delete test competition
            requests.delete(f"{BASE_URL}/api/competitions/{comp_id}")
    
    def test_get_quiz_submissions(self):
        """Test GET /api/quiz/submissions/:student_id/:competition_id"""
        if not self.test_student_id or not self.test_competition_id:
            pytest.skip("No student or competition available for test")
        
        response = requests.get(f"{BASE_URL}/api/quiz/submissions/{self.test_student_id}/{self.test_competition_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        submissions = response.json()
        assert isinstance(submissions, list), "Expected list of submissions"
        print(f"✓ GET /api/quiz/submissions - Returned {len(submissions)} submissions")


class TestViewerPageAPI:
    """Viewer/Spectator page all-data API tests"""
    
    def test_viewer_all_data(self):
        """Test GET /api/viewer/all-data returns complete data"""
        response = requests.get(f"{BASE_URL}/api/viewer/all-data")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify all required fields are present
        required_fields = ['students', 'teams', 'competitions', 'matches', 'standings', 'star_player', 'deduction_categories', 'positive_categories']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Verify data types
        assert isinstance(data['students'], list), "students should be a list"
        assert isinstance(data['teams'], list), "teams should be a list"
        assert isinstance(data['competitions'], list), "competitions should be a list"
        assert isinstance(data['matches'], list), "matches should be a list"
        assert isinstance(data['standings'], list), "standings should be a list"
        assert isinstance(data['deduction_categories'], list), "deduction_categories should be a list"
        assert isinstance(data['positive_categories'], list), "positive_categories should be a list"
        
        # Verify teams count
        assert len(data['teams']) == 4, f"Expected 4 teams, got {len(data['teams'])}"
        
        # Verify standings count
        assert len(data['standings']) == 4, f"Expected 4 teams in standings, got {len(data['standings'])}"
        
        # Verify category counts
        assert len(data['deduction_categories']) > 0, "Should have deduction categories"
        assert len(data['positive_categories']) > 0, "Should have positive categories"
        
        print(f"✓ GET /api/viewer/all-data - Complete data returned")
        print(f"  - Students: {len(data['students'])}")
        print(f"  - Competitions: {len(data['competitions'])}")
        print(f"  - Matches: {len(data['matches'])}")
        print(f"  - Star player: {'Yes' if data['star_player'] else 'No'}")
    
    def test_viewer_standings_sorted(self):
        """Test viewer standings are properly sorted by points"""
        response = requests.get(f"{BASE_URL}/api/viewer/all-data")
        assert response.status_code == 200
        
        standings = response.json()['standings']
        
        # Verify sorted by points (descending)
        for i in range(len(standings) - 1):
            assert standings[i]['points'] >= standings[i+1]['points'], "Standings should be sorted by points"
        
        print("✓ Viewer standings are properly sorted by points")
    
    def test_viewer_students_sorted_by_points(self):
        """Test viewer students are sorted by total_points"""
        response = requests.get(f"{BASE_URL}/api/viewer/all-data")
        assert response.status_code == 200
        
        students = response.json()['students']
        
        # Verify sorted by points (descending)
        for i in range(len(students) - 1):
            assert students[i]['total_points'] >= students[i+1]['total_points'], "Students should be sorted by points"
        
        print("✓ Viewer students are properly sorted by points")


class TestCategoryAPI:
    """Point categories API tests"""
    
    def test_get_deduction_categories(self):
        """Test GET /api/categories/deductions"""
        response = requests.get(f"{BASE_URL}/api/categories/deductions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        categories = response.json()
        assert isinstance(categories, list), "Expected list of categories"
        assert len(categories) > 0, "Should have deduction categories"
        
        # Verify each category has required fields
        for cat in categories:
            assert 'name' in cat, "Category should have name"
            assert 'points' in cat, "Category should have points"
            assert cat['points'] < 0, f"Deduction points should be negative: {cat['points']}"
        
        print(f"✓ GET /api/categories/deductions - Returned {len(categories)} categories")
    
    def test_get_positive_categories(self):
        """Test GET /api/categories/positive"""
        response = requests.get(f"{BASE_URL}/api/categories/positive")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        categories = response.json()
        assert isinstance(categories, list), "Expected list of categories"
        assert len(categories) > 0, "Should have positive categories"
        
        # Verify each category has required fields
        for cat in categories:
            assert 'name' in cat, "Category should have name"
            assert 'points' in cat, "Category should have points"
            assert cat['points'] > 0, f"Positive points should be positive: {cat['points']}"
        
        print(f"✓ GET /api/categories/positive - Returned {len(categories)} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
