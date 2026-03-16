"""
Tests for Weekly Tasks System - Arabic Youth Club App
Features tested:
- Task Distribution: POST /api/tasks/distribute creates 16 tasks (4 tasks x 4 teams)
- Active Tasks: GET /api/tasks/active returns active tasks, reservations, dinners
- Team Tasks: GET /api/tasks/team/:teamId returns team-specific tasks
- Task Assignment: PUT /api/tasks/:taskId/assign - admin assigns student to task
- Social Item Reservation: POST /api/tasks/social/reserve - student reserves social item
- Reservation Validation: Same student cannot reserve twice, same item cannot be reserved twice per team
- Special Dinner: POST /api/tasks/special-dinner - admin creates special dinner
- Delete Dinner: DELETE /api/tasks/special-dinner/:id - admin deletes dinner
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Social items as defined in backend
SOCIAL_ITEMS = ["قهوة", "شاي", "حلى", "سمبوسة"]

class TestWeeklyTasksDistribution:
    """Tests for task distribution and retrieval"""
    
    test_students = []
    created_dinner_ids = []
    
    @classmethod
    def setup_class(cls):
        """Get existing students for testing"""
        response = requests.get(f"{BASE_URL}/api/students")
        if response.status_code == 200:
            cls.test_students = response.json()
    
    @pytest.fixture(autouse=True)
    def cleanup_dinners(self):
        """Cleanup any dinners created during tests"""
        yield
        for dinner_id in self.created_dinner_ids:
            try:
                requests.delete(f"{BASE_URL}/api/tasks/special-dinner/{dinner_id}")
            except:
                pass
        self.created_dinner_ids.clear()
    
    def test_get_task_types(self):
        """Test GET /api/tasks/types returns the 4 task types"""
        response = requests.get(f"{BASE_URL}/api/tasks/types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        types = response.json()
        assert isinstance(types, list), "Expected list of task types"
        assert len(types) == 4, f"Expected 4 task types, got {len(types)}"
        
        type_ids = [t['id'] for t in types]
        assert 'adhan' in type_ids, "Missing adhan task type"
        assert 'speech' in type_ids, "Missing speech task type"
        assert 'activity' in type_ids, "Missing activity task type"
        assert 'social' in type_ids, "Missing social task type"
        
        print("✓ GET /api/tasks/types - All 4 task types returned")
    
    def test_get_social_items(self):
        """Test GET /api/tasks/social-items returns the 4 social items"""
        response = requests.get(f"{BASE_URL}/api/tasks/social-items")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        items = response.json()
        assert isinstance(items, list), "Expected list of social items"
        assert len(items) == 4, f"Expected 4 social items, got {len(items)}"
        
        for item in SOCIAL_ITEMS:
            assert item in items, f"Missing social item: {item}"
        
        print(f"✓ GET /api/tasks/social-items - Returned: {items}")
    
    def test_distribute_tasks(self):
        """Test POST /api/tasks/distribute creates 16 tasks (4 tasks x 4 teams)"""
        response = requests.post(f"{BASE_URL}/api/tasks/distribute")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'message' in data, "Response should have message"
        assert 'week' in data or 'المهام موزعة' in data.get('message', ''), "Response should have week or indicate already distributed"
        
        print(f"✓ POST /api/tasks/distribute - Response: {data}")
    
    def test_get_active_tasks(self):
        """Test GET /api/tasks/active returns active tasks, reservations, dinners"""
        response = requests.get(f"{BASE_URL}/api/tasks/active")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify structure
        assert 'tasks' in data, "Response should have 'tasks'"
        assert 'reservations' in data, "Response should have 'reservations'"
        assert 'dinners' in data, "Response should have 'dinners'"
        assert 'week' in data, "Response should have 'week'"
        
        tasks = data['tasks']
        assert isinstance(tasks, list), "Tasks should be a list"
        
        # If tasks are distributed, should be 16 tasks (4 teams x 4 task types)
        if len(tasks) > 0:
            assert len(tasks) == 16, f"Expected 16 tasks (4x4), got {len(tasks)}"
            
            # Verify task structure
            for task in tasks:
                assert 'id' in task, "Task should have id"
                assert 'task_type' in task, "Task should have task_type"
                assert 'team_id' in task, "Task should have team_id"
                assert 'week_start' in task, "Task should have week_start"
                assert 'is_active' in task, "Task should have is_active"
                assert task['is_active'] == True, "Active tasks should have is_active=True"
        
        print(f"✓ GET /api/tasks/active - Returned {len(tasks)} tasks, {len(data['reservations'])} reservations, {len(data['dinners'])} dinners")
        return data
    
    def test_get_team_tasks(self):
        """Test GET /api/tasks/team/:teamId returns team-specific tasks"""
        team_id = "sadara"
        response = requests.get(f"{BASE_URL}/api/tasks/team/{team_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        assert 'tasks' in data, "Response should have 'tasks'"
        assert 'reservations' in data, "Response should have 'reservations'"
        assert 'dinners' in data, "Response should have 'dinners'"
        
        tasks = data['tasks']
        
        # Verify all tasks belong to the team
        for task in tasks:
            assert task['team_id'] == team_id, f"Task should belong to team {team_id}, got {task['team_id']}"
        
        # Should have 4 tasks per team
        if len(tasks) > 0:
            assert len(tasks) == 4, f"Expected 4 tasks for team {team_id}, got {len(tasks)}"
        
        print(f"✓ GET /api/tasks/team/{team_id} - Returned {len(tasks)} tasks")
        return data


class TestTaskAssignment:
    """Tests for task assignment by admin"""
    
    test_students = []
    
    @classmethod
    def setup_class(cls):
        """Get existing students for testing"""
        response = requests.get(f"{BASE_URL}/api/students")
        if response.status_code == 200:
            cls.test_students = response.json()
    
    def test_assign_task_to_student(self):
        """Test PUT /api/tasks/:taskId/assign - admin assigns student to task"""
        # First get active tasks
        tasks_res = requests.get(f"{BASE_URL}/api/tasks/active")
        assert tasks_res.status_code == 200
        tasks = tasks_res.json().get('tasks', [])
        
        if not tasks:
            pytest.skip("No active tasks to test assignment")
        
        if not self.test_students:
            pytest.skip("No students available for test")
        
        # Find an adhan task for sadara team
        adhan_task = next((t for t in tasks if t['task_type'] == 'adhan' and t['team_id'] == 'sadara'), None)
        if not adhan_task:
            adhan_task = tasks[0]
        
        # Find a student from the same team
        team_students = [s for s in self.test_students if s.get('team') == adhan_task['team_id']]
        if not team_students:
            team_students = self.test_students
        
        student = team_students[0]
        task_id = adhan_task['id']
        
        # Assign student to task
        response = requests.put(
            f"{BASE_URL}/api/tasks/{task_id}/assign",
            json={"student_id": student['id']}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'message' in data, "Response should have message"
        
        # Verify assignment persisted
        verify_res = requests.get(f"{BASE_URL}/api/tasks/active")
        verify_tasks = verify_res.json().get('tasks', [])
        assigned_task = next((t for t in verify_tasks if t['id'] == task_id), None)
        
        assert assigned_task is not None, "Task should still exist"
        assert assigned_task['assigned_student_id'] == student['id'], f"Student should be assigned, got {assigned_task.get('assigned_student_id')}"
        
        print(f"✓ PUT /api/tasks/{task_id}/assign - Student {student['name']} assigned to task")
    
    def test_assign_task_invalid_id(self):
        """Test PUT /api/tasks/:taskId/assign with invalid task ID"""
        response = requests.put(
            f"{BASE_URL}/api/tasks/nonexistent-task-123/assign",
            json={"student_id": "some-student"}
        )
        # Should return 404 since task doesn't exist (but modify_count will be 0)
        # Note: Current implementation returns 404 only if modified_count == 0
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ PUT /api/tasks/invalid-id/assign - Returns 404")


class TestSocialItemReservation:
    """Tests for social item reservation by students"""
    
    test_students = []
    
    @classmethod
    def setup_class(cls):
        """Get existing students for testing"""
        response = requests.get(f"{BASE_URL}/api/students")
        if response.status_code == 200:
            cls.test_students = response.json()
    
    def test_reserve_social_item_success(self):
        """Test POST /api/tasks/social/reserve - student reserves social item successfully"""
        # Get active tasks
        tasks_res = requests.get(f"{BASE_URL}/api/tasks/active")
        assert tasks_res.status_code == 200
        tasks_data = tasks_res.json()
        tasks = tasks_data.get('tasks', [])
        existing_reservations = tasks_data.get('reservations', [])
        
        if not tasks:
            pytest.skip("No active tasks to test reservation")
        
        if not self.test_students:
            pytest.skip("No students available for test")
        
        # Find a social task
        social_task = next((t for t in tasks if t['task_type'] == 'social'), None)
        if not social_task:
            pytest.skip("No social task available")
        
        team_id = social_task['team_id']
        task_id = social_task['id']
        
        # Find a student from the same team who hasn't reserved yet
        team_students = [s for s in self.test_students if s.get('team') == team_id]
        
        # Check which students already have reservations
        students_with_reservations = [r['student_id'] for r in existing_reservations if r['team_id'] == team_id]
        available_students = [s for s in team_students if s['id'] not in students_with_reservations]
        
        if not available_students:
            print("⚠ All team students already have reservations - skipping test")
            pytest.skip("All team students already have reservations")
        
        student = available_students[0]
        
        # Find an available item (not already reserved for this team)
        team_reservations = [r for r in existing_reservations if r['team_id'] == team_id]
        reserved_items = [r['item'] for r in team_reservations]
        available_items = [item for item in SOCIAL_ITEMS if item not in reserved_items]
        
        if not available_items:
            print("⚠ All items already reserved for this team - skipping test")
            pytest.skip("All items already reserved for this team")
        
        item = available_items[0]
        
        # Reserve the item
        response = requests.post(
            f"{BASE_URL}/api/tasks/social/reserve",
            json={
                "student_id": student['id'],
                "task_id": task_id,
                "team_id": team_id,
                "item": item
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'message' in data, "Response should have message"
        assert item in data['message'], f"Message should mention the item: {item}"
        
        print(f"✓ POST /api/tasks/social/reserve - Student {student['name']} reserved {item}")
    
    def test_same_student_cannot_reserve_twice(self):
        """Test POST /api/tasks/social/reserve - same student cannot reserve twice"""
        # Get active tasks
        tasks_res = requests.get(f"{BASE_URL}/api/tasks/active")
        assert tasks_res.status_code == 200
        tasks_data = tasks_res.json()
        reservations = tasks_data.get('reservations', [])
        
        if not reservations:
            pytest.skip("No reservations to test duplicate student validation")
        
        # Get a reservation and try to reserve again for the same student
        existing = reservations[0]
        tasks = tasks_data.get('tasks', [])
        social_task = next((t for t in tasks if t['task_type'] == 'social' and t['team_id'] == existing['team_id']), None)
        
        if not social_task:
            pytest.skip("No social task found for team")
        
        # Try to reserve a different item for the same student
        existing_item = existing['item']
        different_item = next((item for item in SOCIAL_ITEMS if item != existing_item), SOCIAL_ITEMS[0])
        
        response = requests.post(
            f"{BASE_URL}/api/tasks/social/reserve",
            json={
                "student_id": existing['student_id'],
                "task_id": social_task['id'],
                "team_id": existing['team_id'],
                "item": different_item
            }
        )
        
        # Should fail with 400 because student already reserved an item
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert 'detail' in data, "Response should have error detail"
        
        print(f"✓ Same student cannot reserve twice - Error: {data['detail']}")
    
    def test_same_item_cannot_be_reserved_twice_in_team(self):
        """Test POST /api/tasks/social/reserve - same item in same team cannot be reserved twice"""
        # Get active tasks
        tasks_res = requests.get(f"{BASE_URL}/api/tasks/active")
        assert tasks_res.status_code == 200
        tasks_data = tasks_res.json()
        reservations = tasks_data.get('reservations', [])
        
        if not reservations:
            pytest.skip("No reservations to test duplicate item validation")
        
        # Get a reservation and try to reserve same item by different student
        existing = reservations[0]
        tasks = tasks_data.get('tasks', [])
        social_task = next((t for t in tasks if t['task_type'] == 'social' and t['team_id'] == existing['team_id']), None)
        
        if not social_task:
            pytest.skip("No social task found for team")
        
        # Find a different student from same team who hasn't reserved
        team_students = [s for s in self.test_students if s.get('team') == existing['team_id']]
        students_with_reservations = [r['student_id'] for r in reservations if r['team_id'] == existing['team_id']]
        available_students = [s for s in team_students if s['id'] not in students_with_reservations]
        
        if not available_students:
            pytest.skip("No available students to test duplicate item")
        
        different_student = available_students[0]
        
        # Try to reserve the same item
        response = requests.post(
            f"{BASE_URL}/api/tasks/social/reserve",
            json={
                "student_id": different_student['id'],
                "task_id": social_task['id'],
                "team_id": existing['team_id'],
                "item": existing['item']  # Same item
            }
        )
        
        # Should fail with 400 because item is already taken
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert 'detail' in data, "Response should have error detail"
        
        print(f"✓ Same item cannot be reserved twice in team - Error: {data['detail']}")
    
    def test_reserve_invalid_item(self):
        """Test POST /api/tasks/social/reserve with invalid item"""
        if not self.test_students:
            pytest.skip("No students available for test")
        
        student = self.test_students[0]
        
        response = requests.post(
            f"{BASE_URL}/api/tasks/social/reserve",
            json={
                "student_id": student['id'],
                "task_id": "some-task",
                "team_id": "sadara",
                "item": "invalid-item"  # Not in SOCIAL_ITEMS
            }
        )
        
        # Should fail with 400 because item is invalid
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        print("✓ Reserve invalid item - Returns 400")


class TestSpecialDinner:
    """Tests for special dinner creation and deletion"""
    
    test_students = []
    created_dinner_ids = []
    
    @classmethod
    def setup_class(cls):
        """Get existing students for testing"""
        response = requests.get(f"{BASE_URL}/api/students")
        if response.status_code == 200:
            cls.test_students = response.json()
    
    @pytest.fixture(autouse=True)
    def cleanup_dinners(self):
        """Cleanup any dinners created during tests"""
        yield
        for dinner_id in self.created_dinner_ids:
            try:
                requests.delete(f"{BASE_URL}/api/tasks/special-dinner/{dinner_id}")
            except:
                pass
        self.created_dinner_ids.clear()
    
    def test_create_special_dinner(self):
        """Test POST /api/tasks/special-dinner - admin creates special dinner"""
        team_id = "nukhba"
        student_id = None
        
        # Optionally assign a student
        team_students = [s for s in self.test_students if s.get('team') == team_id]
        if team_students:
            student_id = team_students[0]['id']
        
        response = requests.post(
            f"{BASE_URL}/api/tasks/special-dinner",
            json={
                "team_id": team_id,
                "student_id": student_id
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'message' in data, "Response should have message"
        
        # Verify dinner was created
        verify_res = requests.get(f"{BASE_URL}/api/tasks/active")
        dinners = verify_res.json().get('dinners', [])
        
        # Find our dinner (most recent for team)
        team_dinners = [d for d in dinners if d['team_id'] == team_id]
        assert len(team_dinners) > 0, "Dinner should be created"
        
        # Store for cleanup
        if team_dinners:
            self.created_dinner_ids.append(team_dinners[-1]['id'])
        
        print(f"✓ POST /api/tasks/special-dinner - Dinner created for team {team_id}")
    
    def test_create_special_dinner_without_student(self):
        """Test POST /api/tasks/special-dinner without assigning a student"""
        team_id = "zaama"
        
        response = requests.post(
            f"{BASE_URL}/api/tasks/special-dinner",
            json={
                "team_id": team_id,
                "student_id": None
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify dinner created
        verify_res = requests.get(f"{BASE_URL}/api/tasks/team/{team_id}")
        dinners = verify_res.json().get('dinners', [])
        
        unassigned_dinner = next((d for d in dinners if d.get('assigned_student_id') is None), None)
        
        # Store for cleanup
        if unassigned_dinner:
            self.created_dinner_ids.append(unassigned_dinner['id'])
        
        print(f"✓ POST /api/tasks/special-dinner without student - Dinner created for team {team_id}")
    
    def test_delete_special_dinner(self):
        """Test DELETE /api/tasks/special-dinner/:id - admin deletes dinner"""
        # First create a dinner
        team_id = "riyada"
        create_res = requests.post(
            f"{BASE_URL}/api/tasks/special-dinner",
            json={"team_id": team_id, "student_id": None}
        )
        assert create_res.status_code == 200
        
        # Get the dinner ID
        active_res = requests.get(f"{BASE_URL}/api/tasks/team/{team_id}")
        dinners = active_res.json().get('dinners', [])
        
        if not dinners:
            pytest.fail("Dinner should have been created")
        
        dinner_id = dinners[-1]['id']
        
        # Delete the dinner
        delete_res = requests.delete(f"{BASE_URL}/api/tasks/special-dinner/{dinner_id}")
        assert delete_res.status_code == 200, f"Expected 200, got {delete_res.status_code}"
        
        # Verify deletion
        verify_res = requests.get(f"{BASE_URL}/api/tasks/team/{team_id}")
        verify_dinners = verify_res.json().get('dinners', [])
        deleted = next((d for d in verify_dinners if d['id'] == dinner_id), None)
        
        assert deleted is None, "Dinner should be deleted"
        
        print(f"✓ DELETE /api/tasks/special-dinner/{dinner_id} - Dinner deleted")


class TestClearTasks:
    """Tests for clearing all tasks"""
    
    def test_clear_tasks(self):
        """Test DELETE /api/tasks/clear - clears all active tasks"""
        # First ensure tasks are distributed
        requests.post(f"{BASE_URL}/api/tasks/distribute")
        
        # Verify tasks exist
        before_res = requests.get(f"{BASE_URL}/api/tasks/active")
        before_data = before_res.json()
        
        if len(before_data.get('tasks', [])) == 0:
            print("⚠ No tasks to clear - distributing first")
            requests.post(f"{BASE_URL}/api/tasks/distribute")
        
        # Clear tasks
        response = requests.delete(f"{BASE_URL}/api/tasks/clear")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify tasks are cleared (is_active = False)
        after_res = requests.get(f"{BASE_URL}/api/tasks/active")
        after_data = after_res.json()
        
        # Tasks should be cleared (empty or all inactive)
        assert len(after_data.get('tasks', [])) == 0, "All tasks should be cleared (inactive)"
        
        print("✓ DELETE /api/tasks/clear - All tasks cleared")
        
        # Re-distribute for other tests
        requests.post(f"{BASE_URL}/api/tasks/distribute")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
