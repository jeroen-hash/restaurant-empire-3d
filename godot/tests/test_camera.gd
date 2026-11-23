extends SceneTree

const PlayerScript = preload("res://scripts/player_controller.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run_tests")

func _run_tests() -> void:
	var player = PlayerScript.new()
	root.add_child(player)
	await process_frame
	_assert(player.camera != null and player.camera.current, "Third-person camera starts active")
	_assert(not player.first_person and player.character.visible, "Character is visible in third-person mode")
	var first_person: bool = player.toggle_camera_mode()
	_assert(first_person, "Camera switches to first-person mode")
	_assert(not player.character.visible, "Character model is hidden in first-person mode")
	_assert(is_equal_approx(player.camera.position.z, 0.08), "First-person camera is placed at eye level")
	var third_person: bool = player.toggle_camera_mode()
	_assert(not third_person, "Camera switches back to third-person mode")
	_assert(player.character.visible, "Character model returns in third-person mode")
	_assert(is_equal_approx(player.camera.position.z, player.camera_distance), "Third-person camera restores follow distance")
	if failures == 0:
		print("CAMERA TESTS PASSED")
		quit(0)
	else:
		push_error("%d CAMERA TEST(S) FAILED" % failures)
		quit(1)

func _assert(condition: bool, description: String) -> void:
	if not condition:
		failures += 1
		push_error("TEST FAILED: " + description)
