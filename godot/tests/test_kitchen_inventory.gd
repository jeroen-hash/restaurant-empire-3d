extends SceneTree

var failures := 0

func _initialize() -> void:
	call_deferred("_run_tests")

func _run_tests() -> void:
	var inventory_script = load("res://scripts/kitchen_inventory.gd")
	_assert(inventory_script != null, "Kitchen inventory script loads")
	if inventory_script == null:
		quit(1)
		return
	var data := {}
	var inventory = inventory_script.new(data)
	_assert(inventory.get_storage_items("fridge").size() == 3, "Fridge starts with chilled ingredients")
	_assert(inventory.get_storage_items("freezer").size() == 1, "Freezer has separate frozen stock")
	_assert(inventory.get_storage_items("dry").size() == 2, "Dry storage has shelf-stable ingredients")
	var taken: Dictionary = inventory.take_item("chicken", 2.0)
	_assert(bool(taken.get("ok", false)), "Player can take chicken from the fridge")
	_assert(is_equal_approx(float(data["kitchen_stock"]["chicken"]["quantity"]), 4.0), "Taking food immediately reduces fridge stock")
	_assert(is_equal_approx(float(inventory.get_held_item().get("amount", 0.0)), 2.0), "Collected food is physically represented in the hands inventory")
	var blocked: Dictionary = inventory.take_item("carrot", 1.0)
	_assert(not bool(blocked.get("ok", false)), "Player cannot collect a second item while hands are occupied")
	var placed: Dictionary = inventory.put_down_item()
	_assert(bool(placed.get("ok", false)), "Player can place the collected item on the worktop")
	_assert(is_equal_approx(float(data["kitchen_worktop"]["chicken"]), 2.0), "Placed food is tracked on the worktop")
	var used: Dictionary = inventory.consume_worktop_item("chicken", 1.0)
	_assert(bool(used.get("ok", false)), "Recipe preparation can consume an ingredient from the worktop")
	_assert(is_equal_approx(float(data["kitchen_worktop"]["chicken"]), 1.0), "Using an ingredient reduces the worktop quantity")
	var empty: Dictionary = inventory.take_item("chicken", 99.0)
	_assert(not bool(empty.get("ok", false)), "Player cannot take more than the remaining stock")
	var saved_copy := data.duplicate(true)
	var reloaded = inventory_script.new(saved_copy)
	_assert(is_equal_approx(float(reloaded.get_held_item().get("amount", 0.0)), 0.0), "Hands are empty after putting the ingredient down")
	_assert(is_equal_approx(float(saved_copy["kitchen_worktop"]["chicken"]), 1.0), "Worktop contents persist in saved player data")
	if failures == 0:
		print("KITCHEN INVENTORY TESTS PASSED")
		quit(0)
	else:
		push_error("%d KITCHEN INVENTORY TEST(S) FAILED" % failures)
		quit(1)

func _assert(condition: bool, description: String) -> void:
	if not condition:
		failures += 1
		push_error("TEST FAILED: " + description)
