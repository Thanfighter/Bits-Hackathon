import requests
import sys
import json
from datetime import datetime

class TradeIQAPITester:
    def __init__(self, base_url="https://shipment-check-11.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if endpoint else f"{self.base_url}/api"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                "name": name,
                "success": success,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "endpoint": endpoint
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "success": False,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_shipment_analysis(self):
        """Test shipment analysis endpoint"""
        test_shipment = {
            "hs_code": "8471",
            "origin": "China",
            "destination": "Germany", 
            "weight": 5000.0,
            "value": 250000.0,
            "priority": "medium",
            "carrier": "maersk"
        }
        success, response = self.run_test("Shipment Analysis", "POST", "shipments/analyze", 200, test_shipment)
        return success, response

    def test_shipment_history(self):
        """Test shipment history endpoint"""
        return self.run_test("Shipment History", "GET", "shipments/history", 200)

    def test_get_shipment(self, shipment_id):
        """Test get specific shipment endpoint"""
        return self.run_test(f"Get Shipment {shipment_id[:8]}", "GET", f"shipments/{shipment_id}", 200)

    def test_scenario_simulation(self, shipment_id):
        """Test scenario simulation endpoint"""
        sim_data = {
            "shipment_id": shipment_id,
            "new_carrier": "msc",
            "new_origin": "India"
        }
        return self.run_test("Scenario Simulation", "POST", "shipments/simulate", 200, sim_data)

    def test_ai_recommendation(self, shipment_id):
        """Test AI recommendation endpoint"""
        ai_data = {
            "shipment_id": shipment_id,
            "question": "What are the main risks for this shipment?"
        }
        return self.run_test("AI Recommendation", "POST", "ai/recommend", 200, ai_data, timeout=60)

    def test_reference_endpoints(self):
        """Test reference data endpoints"""
        countries_success, _ = self.run_test("Reference Countries", "GET", "reference/countries", 200)
        carriers_success, _ = self.run_test("Reference Carriers", "GET", "reference/carriers", 200)
        return countries_success and carriers_success

    def test_finance_simulation(self):
        """Test finance simulation endpoint"""
        return self.run_test("Finance Simulation", "GET", "finance/simulate", 200)

    def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        # Test non-existent shipment
        invalid_success, _ = self.run_test("Invalid Shipment ID", "GET", "shipments/invalid-id", 404)
        
        # Test invalid analysis data
        invalid_data = {
            "hs_code": "",  # Invalid empty HS code
            "origin": "InvalidCountry",
            "destination": "InvalidCountry"
        }
        invalid_analysis, _ = self.run_test("Invalid Analysis Data", "POST", "shipments/analyze", 422, invalid_data)
        
        return invalid_success

def main():
    print("🚢 TradeIQ Sentinel 3.0 API Testing Suite")
    print("=" * 50)
    
    tester = TradeIQAPITester()
    shipment_id = None

    # Test basic endpoints
    print("\n📊 Testing Basic Endpoints...")
    tester.test_root_endpoint()
    tester.test_dashboard_stats()
    tester.test_shipment_history()
    tester.test_reference_endpoints()
    tester.test_finance_simulation()

    # Test shipment analysis (core functionality)
    print("\n🔬 Testing Core Analysis...")
    analysis_success, analysis_response = tester.test_shipment_analysis()
    if analysis_success and 'id' in analysis_response:
        shipment_id = analysis_response['id']
        print(f"   Created shipment ID: {shipment_id[:8]}...")
        
        # Test dependent endpoints
        print("\n🔄 Testing Dependent Endpoints...")
        tester.test_get_shipment(shipment_id)
        tester.test_scenario_simulation(shipment_id)
        
        # Test AI recommendation (may take longer)
        print("\n🤖 Testing AI Integration...")
        tester.test_ai_recommendation(shipment_id)
    else:
        print("❌ Shipment analysis failed, skipping dependent tests")

    # Test error handling
    print("\n⚠️ Testing Error Handling...")
    tester.test_invalid_endpoints()

    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    # Print failed tests
    failed_tests = [t for t in tester.test_results if not t['success']]
    if failed_tests:
        print("\n❌ Failed Tests:")
        for test in failed_tests:
            error_msg = test.get('error', f"Status {test.get('status_code')} != {test.get('expected_status')}")
            print(f"   - {test['name']}: {error_msg}")
    
    # Return exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())