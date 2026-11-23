extends RefCounted
class_name KitchenInventory
## Real stock-to-hands flow. Items leave storage only when explicitly collected.

const STARTING_STOCK := {
	"chicken": {"name": "Kipfilet", "unit": "portie", "quantity": 6.0, "storage": "fridge"},
	"carrot": {"name": "Wortel", "unit": "stuk", "quantity": 12.0, "storage": "fridge"},
	"potato": {"name": "Aardappel", "unit": "stuk", "quantity": 10.0, "storage": "dry"},
	"butter": {"name": "Boter", "unit": "gram", "quantity": 500.0, "storage": "fridge"},
	"salt": {"name": "Zout", "unit": "gram", "quantity": 250.0, "storage": "dry"},
	"frozen_peas": {"name": "Diepvrieserwten", "unit": "gram", "quantity": 1000.0, "storage": "freezer"}
}

var player_data: Dictionary

func _init(data: Dictionary) -> void:
	player_data = data
	if not player_data.has("kitchen_stock"):
		player_data["kitchen_stock"] = _copy_starting_stock()
	if not player_data.has("kitchen_hands"):
		player_data["kitchen_hands"] = {}

func _copy_starting_stock() -> Dictionary:
	var result := {}
	for item_id in STARTING_STOCK:
		result[item_id] = STARTING_STOCK[item_id].duplicate(true)
	return result

func get_storage_items(storage_type: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var stock: Dictionary = player_data.get("kitchen_stock", {})
	for item_id in stock:
		var item: Dictionary = stock[item_id]
		if str(item.get("storage", "")) == storage_type and float(item.get("quantity", 0.0)) > 0.0:
			var entry: Dictionary = item.duplicate(true)
			entry["id"] = str(item_id)
			result.append(entry)
	return result

func take_item(item_id: String, amount: float = 1.0) -> Dictionary:
	if amount <= 0.0:
		return {"ok": false, "message": "Kies een hoeveelheid groter dan nul."}
	var stock: Dictionary = player_data.get("kitchen_stock", {})
	if not stock.has(item_id):
		return {"ok": false, "message": "Dit product zit niet in de voorraad."}
	var item: Dictionary = stock[item_id]
	var available := float(item.get("quantity", 0.0))
	if available < amount:
		return {"ok": false, "message": "Onvoldoende %s in voorraad." % str(item.get("name", item_id))}
	var hands: Dictionary = player_data.get("kitchen_hands", {})
	if not hands.is_empty() and not hands.has(item_id):
		return {"ok": false, "message": "Je handen zijn al bezet. Leg eerst je huidige product neer."}
	item["quantity"] = snappedf(available - amount, 0.001)
	hands[item_id] = float(hands.get(item_id, 0.0)) + amount
	player_data["kitchen_stock"] = stock
	player_data["kitchen_hands"] = hands
	return {"ok": true, "message": "%s meegenomen." % str(item.get("name", item_id)), "item": item_id, "amount": amount}

func put_down_item() -> Dictionary:
	var hands: Dictionary = player_data.get("kitchen_hands", {})
	if hands.is_empty():
		return {"ok": false, "message": "Je hebt niets in je handen."}
	var item_id := str(hands.keys()[0])
	var amount := float(hands[item_id])
	hands.erase(item_id)
	player_data["kitchen_hands"] = hands
	var bench: Dictionary = player_data.get("kitchen_worktop", {})
	bench[item_id] = float(bench.get(item_id, 0.0)) + amount
	player_data["kitchen_worktop"] = bench
	return {"ok": true, "message": "Product op het werkblad gelegd.", "item": item_id, "amount": amount}

func consume_worktop_item(item_id: String, amount: float) -> Dictionary:
	var bench: Dictionary = player_data.get("kitchen_worktop", {})
	var available := float(bench.get(item_id, 0.0))
	if amount <= 0.0 or available < amount:
		return {"ok": false, "message": "Niet genoeg van dit product op het werkblad."}
	available -= amount
	if available <= 0.001:
		bench.erase(item_id)
	else:
		bench[item_id] = available
	player_data["kitchen_worktop"] = bench
	return {"ok": true, "message": "Ingrediënt gebruikt.", "item": item_id, "amount": amount}

func get_held_item() -> Dictionary:
	var hands: Dictionary = player_data.get("kitchen_hands", {})
	if hands.is_empty():
		return {}
	var item_id := str(hands.keys()[0])
	return {"id": item_id, "amount": float(hands[item_id])}
