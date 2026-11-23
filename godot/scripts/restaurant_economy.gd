extends RefCounted
class_name RestaurantEconomy
## Voorraad, receptkost en verkoop. Hoeveelheden zijn altijd basiseenheden
## (bv. stuks, gram of milliliter), nooit verpakkingen.

var player_data: Dictionary
var restaurant_data: Dictionary

func _init(player: Dictionary, restaurant: Dictionary) -> void:
	player_data = player
	restaurant_data = restaurant
	if not restaurant_data.has("stock"):
		restaurant_data["stock"] = {}
	if not restaurant_data.has("recipes"):
		restaurant_data["recipes"] = {}
	if not restaurant_data.has("sales"):
		restaurant_data["sales"] = {"count": 0, "revenue": 0.0, "ingredient_cost": 0.0}

func purchase_ingredient(item_id: String, display_name: String, package_quantity: float, package_price: float) -> Dictionary:
	if item_id.strip_edges().is_empty() or display_name.strip_edges().is_empty():
		return _failure("Productnaam en productcode zijn verplicht.")
	if package_quantity <= 0.0 or package_price < 0.0:
		return _failure("Verpakkingshoeveelheid moet groter dan nul zijn en de prijs mag niet negatief zijn.")
	var balance := float(player_data.get("cash", 0.0))
	if balance < package_price:
		return _failure("Onvoldoende geld om deze voorraad aan te kopen.")
	var stock: Dictionary = restaurant_data["stock"]
	var current: Dictionary = stock.get(item_id, {
		"name": display_name,
		"quantity": 0.0,
		"unit_cost": 0.0
	})
	var old_quantity := float(current.get("quantity", 0.0))
	var old_cost := float(current.get("unit_cost", 0.0))
	var incoming_unit_cost := package_price / package_quantity
	var new_quantity := old_quantity + package_quantity
	var weighted_cost := incoming_unit_cost
	if new_quantity > 0.0:
		weighted_cost = ((old_quantity * old_cost) + package_price) / new_quantity
	current["name"] = display_name
	current["quantity"] = new_quantity
	current["unit_cost"] = weighted_cost
	stock[item_id] = current
	restaurant_data["stock"] = stock
	player_data["cash"] = balance - package_price
	return {
		"ok": true,
		"message": "%s toegevoegd aan voorraad." % display_name,
		"quantity": new_quantity,
		"unit_cost": weighted_cost,
		"purchase_cost": package_price
	}

func save_recipe(recipe_id: String, display_name: String, ingredients: Dictionary, selling_price: float) -> Dictionary:
	if recipe_id.strip_edges().is_empty() or display_name.strip_edges().is_empty():
		return _failure("Receptcode en naam zijn verplicht.")
	if ingredients.is_empty() or selling_price < 0.0:
		return _failure("Een recept heeft ingrediënten nodig en de verkoopprijs mag niet negatief zijn.")
	for item_id in ingredients:
		if float(ingredients[item_id]) <= 0.0:
			return _failure("Ingrediëntenhoeveelheden moeten groter zijn dan nul.")
	var recipes: Dictionary = restaurant_data["recipes"]
	recipes[recipe_id] = {
		"name": display_name,
		"ingredients": ingredients.duplicate(true),
		"selling_price": selling_price
	}
	restaurant_data["recipes"] = recipes
	return {"ok": true, "message": "Recept opgeslagen."}

func calculate_recipe_cost(recipe_id: String) -> Dictionary:
	var recipes: Dictionary = restaurant_data.get("recipes", {})
	if not recipes.has(recipe_id):
		return _failure("Recept niet gevonden.")
	var recipe: Dictionary = recipes[recipe_id]
	var stock: Dictionary = restaurant_data.get("stock", {})
	var total_cost := 0.0
	var missing: Array[String] = []
	for item_id in recipe["ingredients"]:
		var required := float(recipe["ingredients"][item_id])
		if not stock.has(item_id):
			missing.append(str(item_id))
			continue
		var item: Dictionary = stock[item_id]
		total_cost += required * float(item.get("unit_cost", 0.0))
	var price := float(recipe.get("selling_price", 0.0))
	var margin := price - total_cost
	return {
		"ok": missing.is_empty(),
		"recipe_name": recipe.get("name", recipe_id),
		"ingredient_cost": total_cost,
		"selling_price": price,
		"gross_margin": margin,
		"food_cost_percent": (total_cost / price * 100.0) if price > 0.0 else 0.0,
		"missing_ingredients": missing
	}

func prepare_and_sell(recipe_id: String) -> Dictionary:
	var costing := calculate_recipe_cost(recipe_id)
	if not costing["ok"]:
		return _failure("Niet genoeg voorraad of ingrediënten ontbreken: %s" % ", ".join(costing["missing_ingredients"]))
	var recipe: Dictionary = restaurant_data["recipes"][recipe_id]
	var stock: Dictionary = restaurant_data["stock"]
	for item_id in recipe["ingredients"]:
		var item: Dictionary = stock[item_id]
		var required := float(recipe["ingredients"][item_id])
		if float(item.get("quantity", 0.0)) < required:
			return _failure("Onvoldoende voorraad van %s." % item.get("name", item_id))
	for item_id in recipe["ingredients"]:
		var item: Dictionary = stock[item_id]
		item["quantity"] = float(item["quantity"]) - float(recipe["ingredients"][item_id])
		stock[item_id] = item
	restaurant_data["stock"] = stock
	var revenue := float(recipe["selling_price"])
	player_data["cash"] = float(player_data.get("cash", 0.0)) + revenue
	var sales: Dictionary = restaurant_data.get("sales", {"count": 0, "revenue": 0.0, "ingredient_cost": 0.0})
	sales["count"] = int(sales.get("count", 0)) + 1
	sales["revenue"] = float(sales.get("revenue", 0.0)) + revenue
	sales["ingredient_cost"] = float(sales.get("ingredient_cost", 0.0)) + float(costing["ingredient_cost"])
	restaurant_data["sales"] = sales
	return {
		"ok": true,
		"recipe_name": recipe.get("name", recipe_id),
		"revenue": revenue,
		"ingredient_cost": costing["ingredient_cost"],
		"gross_margin": revenue - float(costing["ingredient_cost"])
	}

func _failure(message: String) -> Dictionary:
	return {"ok": false, "message": message}
