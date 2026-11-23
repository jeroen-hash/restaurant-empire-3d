extends SceneTree

const EducationScript = preload("res://scripts/education_progression.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run_tests")

func _run_tests() -> void:
	var data := {"career_title": "Culinaire student", "career_level": 1}
	var school = EducationScript.new(data)
	_assert(int(data["education_year"]) == 1, "Speler start in het eerste schooljaar")
	_assert(int(data["education_level"]) == 1, "Speler start op niveau 1")
	var locked = school.take_exam()
	_assert(not locked["ok"], "Examen mag niet zonder vereist niveau")
	for i in range(8):
		school.study("theory")
	_assert(int(data["education_level"]) == 3, "Acht lessen brengen speler naar niveau 3")
	for i in range(8):
		school.study("practice")
	_assert(int(data["education_level"]) == 5, "Zestien lessen brengen speler naar niveau 5")
	var passed = school.take_exam()
	_assert(passed["ok"] and int(data["education_year"]) == 2, "Geslaagd examen start tweede schooljaar")
	var fail_data := {"education_year": 1, "education_level": 5, "education_xp": 0, "theory_skill": 8, "practical_skill": 0}
	var fail_school = EducationScript.new(fail_data)
	var failed = fail_school.take_exam()
	_assert(not failed["ok"] and failed.get("failed", false), "Onvoldoende praktijkvaardigheid betekent herkansing")
	_assert(int(fail_data["education_year"]) == 1, "Niet geslaagd betekent hetzelfde jaar hernemen")
	for i in range(8):
		school.study("theory")
		school.study("practice")
	_assert(int(data["education_level"]) == 9, "Tweede jaar bouwt verder op niveau 5")
	for i in range(2):
		school.study("theory")
		school.study("practice")
	_assert(int(data["education_level"]) == 10, "Derde examen is op niveau 10")
	var year_two = school.take_exam()
	_assert(year_two["ok"] and int(data["education_year"]) == 3, "Tweede examen geeft toegang tot derde jaar")
	for i in range(20):
		school.study("theory")
		school.study("practice")
	_assert(int(data["education_level"]) == 15, "Laatste schooljaar eindigt op niveau 15")
	var diploma = school.take_exam()
	_assert(diploma["ok"] and diploma.get("graduated", false), "Geslaagd derde examen geeft diploma")
	_assert(school.is_graduated(), "Diplomastatus wordt bewaard")

	if failures == 0:
		print("EDUCATION TESTS PASSED")
		quit(0)
	else:
		push_error("%d EDUCATION TEST(S) FAILED" % failures)
		quit(1)

func _assert(condition: bool, description: String) -> void:
	if not condition:
		failures += 1
		push_error("TEST FAILED: " + description)
