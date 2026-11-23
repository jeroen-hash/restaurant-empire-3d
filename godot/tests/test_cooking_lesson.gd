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
	_assert(lesson.get_summary().contains("Stap 1/8"), "Lesson summary shows the first step")

	var wrong: Dictionary = lesson.perform_action("season", education)
	_assert(not wrong["ok"], "Cooking out of sequence is rejected")
	_assert(int(data["cooking_lesson_stage"]) == 0, "Wrong action does not skip the preparation step")
	_assert(int(data["cooking_lesson_quality"]) == 100, "Wrong action does not damage lesson quality")

	var prepare: Dictionary = lesson.perform_action("prepare", education)
	_assert(prepare["ok"] and not prepare["complete"], "Preparation is the first practical step")
	_assert(lesson.get_summary().contains("Stap 2/8"), "Lesson summary advances after preparation")
	var load_pan: Dictionary = lesson.perform_action("load_pan", education)
	_assert(load_pan["ok"] and bool(data["cooking_pan_loaded"]), "Ingredients must be loaded into the pan as a separate step")
	var cook: Dictionary = lesson.perform_action("cook", education)
	_assert(cook["ok"], "Cooking follows ingredient loading")
	var season: Dictionary = lesson.perform_action("season", education)
	_assert(season["ok"], "Seasoning follows cooking")
	var plate_main: Dictionary = lesson.perform_action("plate_main", education)
	_assert(plate_main["ok"] and not plate_main["complete"], "Main ingredient is plated as a separate action")
	var plate_side: Dictionary = lesson.perform_action("plate_side", education)
	_assert(plate_side["ok"] and not plate_side["complete"], "Side dish is plated separately")
	var plate_veg: Dictionary = lesson.perform_action("plate_veg", education)
	_assert(plate_veg["ok"] and not plate_veg["complete"], "Vegetables are plated separately")
	var plate_finish: Dictionary = lesson.perform_action("plate_finish", education)
	_assert(plate_finish["ok"] and plate_finish["complete"], "The player completes the final sauce and garnish action")
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
	var load_pan_action: Dictionary = timing_lesson.perform_action("load_pan", timing_education, 0)
	_assert(load_pan_action["ok"], "Loading the pan is a separate timed interaction")
	var timing_cook: Dictionary = timing_lesson.perform_action("cook", timing_education, 0)
	_assert(timing_cook["ok"], "Cooking after pan loading advances the lesson")
	var timing_season: Dictionary = timing_lesson.perform_action("season", timing_education, 0)
	_assert(timing_season["ok"], "Seasoning follows cooking")
	var poor_action: Dictionary = timing_lesson.perform_action("plate_main", timing_education, 0)
	_assert(poor_action["ok"], "A poorly timed plating action still advances the lesson")
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
