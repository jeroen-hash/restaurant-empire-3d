extends SceneTree

const GameStateScript = preload("res://scripts/game_state.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run_tests")

func _run_tests() -> void:
	var state = GameStateScript.new()
	_assert(state.player_data["position"]["x"] == -25.0, "New career starts at culinary school")
	_assert(int(state.player_data["education_year"]) == 1, "New career starts in school year one")

	var old_save := {
		"version": 1,
		"player": {
			"career_title": "Culinaire student",
			"career_level": 1,
			"position": {"x": 0.0, "y": 0.0, "z": 5.0},
			"cash": 250.0
		},
		"restaurant": {"name": "ANIMO CAFE", "owned": false, "stock": {}, "staff": []}
	}
	var file := FileAccess.open(state.SAVE_PATH, FileAccess.WRITE)
	_assert(file != null, "Legacy save test file can be created")
	if file != null:
		file.store_string(JSON.stringify(old_save))
		file.close()

	var loaded: bool = state.load_game()
	_assert(loaded, "Version one save loads successfully")
	_assert(is_equal_approx(float(state.player_data["position"]["x"]), -22.0), "Legacy save moves player to culinary school")
	_assert(is_equal_approx(float(state.player_data["position"]["z"]), -5.3), "Legacy save receives correct school entrance position")
	_assert(int(state.player_data["education_year"]) == 1, "Legacy save receives school progression defaults")
	_assert(str(state.player_data["avatar_type"]) == "man", "Legacy save receives a default playable character")

	var migrated_file := FileAccess.open(state.SAVE_PATH, FileAccess.READ)
	if migrated_file != null:
		var migrated = JSON.parse_string(migrated_file.get_as_text())
		migrated_file.close()
		_assert(int(migrated.get("version", 0)) == 2, "Migrated save is written as version two")
	else:
		_assert(false, "Migrated save can be reopened")

	DirAccess.remove_absolute(ProjectSettings.globalize_path(state.SAVE_PATH))
	if failures == 0:
		print("SAVE MIGRATION TESTS PASSED")
		quit(0)
	else:
		push_error("%d SAVE MIGRATION TEST(S) FAILED" % failures)
		quit(1)

func _assert(condition: bool, description: String) -> void:
	if not condition:
		failures += 1
		push_error("TEST FAILED: " + description)
