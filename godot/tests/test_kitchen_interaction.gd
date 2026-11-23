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
	game.player.set_spawn_position(Vector3(-25.0, 0.0, -5.0))
	var button: Button = game.get_node_or_null("HUD/KitchenInteractButton")
	_assert(button != null, "Dedicated kitchen interaction button exists")
	if button != null:
		_assert(button.get_parent().name == "HUD", "Kitchen interaction button is outside the scrollable menu")
		_assert(button.visible, "Kitchen interaction button remains visible on mobile")
		_assert(button.anchor_right == 1.0 and button.anchor_bottom == 1.0, "Kitchen interaction button is anchored to the screen corner")
		_assert(button.custom_minimum_size.y >= 50.0, "Kitchen interaction button is large enough for touch")
	var nearest: Dictionary = game._get_nearest_cooking_station(game.player.global_position)
	_assert(float(nearest.get("distance", INF)) <= 2.6, "Starting position is within reach of the first cooking station")
	await process_frame
	_assert(not button.disabled, "Kitchen action button activates when the player reaches a workstation")
	button.pressed.emit()
	_assert(game.cooking_challenge_active, "Touch interaction starts the first cooking action")
	_assert(game.player.is_working, "Player enters working state during the cooking action")
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
