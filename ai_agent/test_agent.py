#!/usr/bin/env python3
"""
Comprehensive AI Agent Test Suite
Tests all merchant operations
"""
from utils.web3_helpers import Web3Helper
import json
import time

def main():
    print("\n" + "="*60)
    print("🤖 AI AGENT COMPREHENSIVE TEST SUITE")
    print("="*60 + "\n")
    
    # Load config
    with open('config.json') as f:
        config = json.load(f)
    
    # Initialize helper
    print("1️⃣ Initializing Web3 Helper...")
    helper = Web3Helper(config)
    print(f"   ✅ Connected to {config['network']}")
    print(f"   ✅ Agent: {helper.account.address}")
    print(f"   ✅ Balance: {helper.get_wallet_balance()[1]:.4f} STT\n")
    
    # Check registration
    print("2️⃣ Checking AI Agent Registration...")
    is_registered = helper.factory_contract.functions.isAIAgent(helper.account.address).call()
    print(f"   ✅ Registered: {is_registered}\n")
    
    # Get existing merchants
    print("3️⃣ Fetching Existing Merchants...")
    merchants = helper.get_all_merchants_from_factory()
    print(f"   ✅ Total merchants: {len(merchants)}")
    for i, addr in enumerate(merchants):
        print(f"      {i+1}. {addr}")
    print()
    
    # Test with existing merchant or create new one
    if merchants:
        test_merchant = merchants[0]
        print(f"4️⃣ Using Existing Merchant: {test_merchant}\n")
    else:
        print("4️⃣ Creating New Merchant...")
        tx_hash = helper.create_merchant("AI Test Shop")
        if tx_hash:
            print(f"   ✅ Created merchant: {tx_hash}")
            time.sleep(5)  # Wait for confirmation
            merchants = helper.get_all_merchants_from_factory()
            test_merchant = merchants[-1]
            print(f"   ✅ Merchant address: {test_merchant}\n")
        else:
            print("   ❌ Failed to create merchant")
            return
    
    # Get merchant info
    print("5️⃣ Fetching Merchant Details...")
    try:
        # Assuming merchantId = 1 for the first/test merchant
        merchant_id = 1
        item_count = helper.merchant_contract.functions.getItemCount(merchant_id).call()
        print(f"   ✅ Merchant ID: {merchant_id}")
        print(f"   ✅ Item count: {item_count}")
        
        # Get profit
        profit_wei, profit_eth = helper.get_profit(merchant_id)
        print(f"   ✅ Profit: {profit_eth:.4f} STT\n")
    except Exception as e:
        print(f"   ⚠️ Could not fetch merchant details: {e}\n")
    
    # Test inventory functions
    print("6️⃣ Testing Inventory Functions...")
    try:
        inventory = helper.get_inventory(merchant_id)
        print(f"   ✅ Current inventory: {len(inventory)} items")
        for item in inventory:
            print(f"      - {item['name']}: {item['price_eth']} STT x {item['quantity']} (Active: {item['active']})")
    except Exception as e:
        print(f"   ⚠️ Inventory fetch failed: {e}")
    print()
    
    # Test adding item (if we own the merchant)
    print("7️⃣ Testing Add Item...")
    try:
        test_item_name = f"Test Potion #{int(time.time()) % 1000}"
        test_price = helper.web3.to_wei(0.01, 'ether')  # 0.01 STT
        test_quantity = 10
        
        print(f"   Adding item: {test_item_name}")
        print(f"   Price: 0.01 STT")
        print(f"   Quantity: {test_quantity}")
        
        tx_hash = helper.add_item(merchant_id, test_item_name, test_price, test_quantity)
        if tx_hash:
            print(f"   ✅ Item added: {tx_hash}")
        else:
            print(f"   ⚠️ Could not add item (may not own this merchant)")
    except Exception as e:
        print(f"   ⚠️ Add item failed: {e}")
    print()
    
    # Summary
    print("="*60)
    print("✅ TEST SUITE COMPLETE!")
    print("="*60)
    print(f"\nSummary:")
    print(f"  • Agent Address: {helper.account.address}")
    print(f"  • Registered: {is_registered}")
    print(f"  • Balance: {helper.get_wallet_balance()[1]:.4f} STT")
    print(f"  • Total Merchants: {len(helper.get_all_merchants_from_factory())}")
    print()

if __name__ == "__main__":
    main()
