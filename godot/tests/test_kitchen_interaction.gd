extends SceneTree

var failures := 0

func _initialize() -> void:
	call_deferred("_run_tests")

func _run_tests() -> void:
	var scene := load("res://scenes/main.tscn") as PackedScene
	_assert(scene != null, "Main game scene loads")
	if scene == null:
		quit(1)
		return
	var game := scene.instantiate()
	root.add_child(game)
	await process_frame
	game.player.set_spawn_position(Vector3(-25.0, 0.0, -6.75))
	await process_frame
	var button: Button = game.get_node_or_null("HUD/KitchenContextButton")
	_assert(button != null, "Single contextual kitchen button exists")
	if button != null:
		_assert(button.visible, "Cutting button appears beside the cutting board")
		_assert(button.text == "SNIJDEN", "Context button shows the correct cutting action")
		_assert(button.anchor_left == 1.0 and button.anchor_right == 1.0, "Context button is positioned on the right side")
		_assert(game.get_node_or_null("HUD/KitchenActionBar") == null, "The fixed bottom action bar is removed")
	game.player.set_spawn_position(Vector3(0.0, 0.0, 0.0))
	await process_frame
	_assert(button != null and not button.visible, "Context button disappears away from kitchen workstations")

	# Validate the recipe sequence: cutting alone is not enough to start cooking.
	var data := {"cooking_lesson_stage": 0, "cooking_lesson_quality": 100, "cooking_lessons_completed": 0}
	var lesson_script = load("res://scripts/cooking_lesson.gd")
	var lesson = lesson_script.new(data)
	var blocked := lesson.perform_action("cook", game.education, 100)
	_assert(not bool(blocked.get("ok", false)), "Cooking cannot start before the preparation and pan-loading steps")
	var prepared := lesson.perform_action("prepare", game.education, 100)
	_assert(bool(prepared.get("ok", false)), "Player can complete ingredient preparation")
	var still_blocked := lesson.perform_action("cook", game.education, 100)
	_assert(not bool(still_blocked.get("ok", false)), "Cooking remains blocked until ingredients are loaded into the pan")
	var loaded := lesson.perform_action("load_pan", game.education, 100)
	_assert(bool(loaded.get("ok", false)) and bool(data.get("cooking_pan_loaded", false)), "Ingredient-loading is a separate required action")
	var cooked := lesson.perform_action("cook", game.education, 100)
	_assert(bool(cooked.get("ok", false)), "Cooking becomes available only after ingredients enter the pan")

	# Visuals must show ingredients in the pan and a composed plated dish.
	game.world.show_cooking_action("load_pan")
	var hot_station := game.world.get_node("ANIMO_CULINARY_SCHOOL/ANIMO_Workstation_GAREN")
	_assert(hot_station.has_node("ActionVisual_load_pan"), "Loaded ingredients are visibly placed in the pan")
	game.world.show_cooking_action("plate")
	var plate_visual := game.world.get_node("ANIMO_CULINARY_SCHOOL/ANIMO_Workstation_DRESSEREN/ActionVisual_plate")
	_assert(plate_visual.get_node_or_null("SearedChickenFillet") != null, "Plated dish contains a shaped main ingredient")
	_assert(plate_visual.get_node_or_null("RoastedPotatoWedge_0") != null, "Plated dish contains potato garnish")
	_assert(plate_visual.get_node_or_null("GlazedCarrot_0") != null, "Plated dish contains vegetable garnish")
	_assert(plate_visual.get_node_or_null("PlatedFood_0") == null, "Plating no longer uses coloured food spheres")

	if failures == 0:
		print("KITCHEN INTERACTION TESTS PASSED")
		quit(0)
	else:
		push_error("%d KITCHEN INTERACTION TEST(S) FAILED" % failures)
		quit(1)

func _assert(condition: bool, description: String) -> void:
	if not condition:
		failures += 1
		push_error("TEST FAILED: " + description)
