extends SceneTree

const EducationScript = preload("res://scripts/education_progression.gd")
const CookingLessonScript = preload("res://scripts/cooking_lesson.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run_tests")

func _run_tests() -> void:
	var data := {"career_title": "Culinaire student", "career_level": 1}
	var education = EducationScript.new(data)
	var lesson = CookingLessonScript.new(data)
	_assert(lesson.get_summary().contains("Stap 1/4"), "Lesson summary shows the first step")

	var wrong: Dictionary = lesson.perform_action("cook", education)
	_assert(not wrong["ok"], "Cooking out of sequence is rejected")
	_assert(int(data["cooking_lesson_stage"]) == 0, "Wrong action does not skip the preparation step")
	_assert(int(data["cooking_lesson_quality"]) == 85, "Wrong action reduces lesson quality")

	var prepare: Dictionary = lesson.perform_action("prepare", education)
	_assert(prepare["ok"] and not prepare["complete"], "Preparation is the first practical step")
	_assert(lesson.get_summary().contains("Stap 2/4"), "Lesson summary advances after preparation")
	var cook: Dictionary = lesson.perform_action("cook", education)
	_assert(cook["ok"], "Cooking follows preparation")
	var season: Dictionary = lesson.perform_action("season", education)
	_assert(season["ok"], "Seasoning follows cooking")
	var plate: Dictionary = lesson.perform_action("plate", education)
	_assert(plate["ok"] and plate["complete"], "Plating completes the practical assignment")
	_assert(int(data["practical_skill"]) == 1, "Completed assignment increases practical skill")
	_assert(int(data["education_xp"]) == 25, "Completed assignment grants school experience")
	_assert(int(data["cooking_lessons_completed"]) == 1, "Completed practical lesson is counted")
	_assert(int(data["cooking_lesson_stage"]) == 0, "Next practical lesson resets to the first step")
	_assert(int(data["cooking_lesson_quality"]) == 100, "Next practical lesson starts with full quality")

	var timing_data := {"career_title": "Culinaire student", "career_level": 1}
	var timing_education = EducationScript.new(timing_data)
	var timing_lesson = CookingLessonScript.new(timing_data)
	var precise_action: Dictionary = timing_lesson.perform_action("prepare", timing_education, 100)
	_assert(precise_action["ok"], "A correctly timed kitchen action is accepted")
	_assert(int(timing_data["cooking_lesson_quality"]) == 100, "Precise timing preserves full practical quality")
	var poor_action: Dictionary = timing_lesson.perform_action("cook", timing_education, 0)
	_assert(poor_action["ok"], "A poorly timed kitchen action still advances the lesson")
	_assert(int(timing_data["cooking_lesson_quality"]) < 100, "Poor timing lowers the practical grade")

	if failures == 0:
		print("COOKING LESSON TESTS PASSED")
		quit(0)
	else:
		push_error("%d COOKING LESSON TEST(S) FAILED" % failures)
		quit(1)

func _assert(condition: bool, description: String) -> void:
	if not condition:
		failures += 1
		push_error("TEST FAILED: " + description)
