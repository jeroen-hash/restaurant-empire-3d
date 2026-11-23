extends SceneTree

const EconomyScript = preload("res://scripts/restaurant_economy.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run_tests")

func _run_tests() -> void:
	var player := {"cash": 100.0}
	var restaurant := {"stock": {}, "recipes": {}, "sales": {"count": 0, "revenue": 0.0, "ingredient_cost": 0.0}}
	var economy = EconomyScript.new(player, restaurant)

	var purchase = economy.purchase_ingredient("eggs", "Eieren", 10.0, 5.0)
	_assert(purchase["ok"], "Aankoop van 10 eieren moet slagen")
	_assert(is_equal_approx(float(restaurant["stock"]["eggs"]["unit_cost"]), 0.5), "Een ei moet €0,50 kosten")

	var recipe = economy.save_recipe("omelet", "Omelet", {"eggs": 5.0}, 8.0)
	_assert(recipe["ok"], "Recept moet opgeslagen worden")
	var cost = economy.calculate_recipe_cost("omelet")
	_assert(cost["ok"], "Receptkost moet berekend kunnen worden")
	_assert(is_equal_approx(float(cost["ingredient_cost"]), 2.5), "Vijf eieren moeten €2,50 kosten, niet €0,25")
	_assert(is_equal_approx(float(cost["food_cost_percent"]), 31.25), "Foodcostpercentage moet 31,25% zijn")

	var sale = economy.prepare_and_sell("omelet")
	_assert(sale["ok"], "Verkoop moet slagen")
	_assert(is_equal_approx(float(restaurant["stock"]["eggs"]["quantity"]), 5.0), "Na verkoop moeten vijf eieren overblijven")
	_assert(is_equal_approx(float(player["cash"]), 103.0), "Kas moet aankoop en verkoop correct verwerken")
	_assert(int(restaurant["sales"]["count"]) == 1, "Er moet één verkoop geregistreerd zijn")

	var second_sale = economy.prepare_and_sell("omelet")
	_assert(second_sale["ok"], "Tweede verkoop moet lukken met de resterende vijf eieren")
	_assert(is_equal_approx(float(restaurant["stock"]["eggs"]["quantity"]), 0.0), "Na twee porties moet de eierstock nul zijn")
	_assert(is_equal_approx(float(player["cash"]), 111.0), "Twee verkopen moeten samen €16 omzet opleveren na de aankoop")

	var blocked = economy.prepare_and_sell("omelet")
	_assert(not blocked["ok"], "Derde verkoop moet blokkeren wanneer de eierstock op is")

	if failures == 0:
		print("ECONOMY TESTS PASSED")
		quit(0)
	else:
		push_error("%d ECONOMY TEST(S) FAILED" % failures)
		quit(1)

func _assert(condition: bool, description: String) -> void:
	if not condition:
		failures += 1
		push_error("TEST FAILED: " + description)
