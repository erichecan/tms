import logging
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:5173"

def run_tests():
    report = {
        "passed": [],
        "failed": [],
        "notes": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # 1. Dashboard Test
            logger.info("Testing Dashboard...")
            page.goto(BASE_URL)
            page.wait_for_load_state('networkidle')
            
            # Check Title
            if "TMS" in page.title() or "Vite" in page.title(): # Title might be Vite App or TMS
                report["passed"].append("Dashboard Load")
            else:
                report["failed"].append("Dashboard Title Check")

            # Check View Reports Button
            try:
                # Assuming button text is "View Reports" or similar
                # Based on previous edits, it might be an icon or text.
                # Searching for "View Reports" text.
                view_reports_btn = page.get_by_role("button", name="View Reports")
                if view_reports_btn.is_visible():
                     report["passed"].append("View Reports Button Exists")
                     # Optional: Click and check for alert (handling dialogs is tricky in headless script without setup)
                else:
                    report["failed"].append("View Reports Button Missing")
            except Exception as e:
                report["failed"].append(f"View Reports Check: {str(e)}")

            # 2. Waybills Test
            logger.info("Testing Waybills...")
            page.goto(f"{BASE_URL}/waybills")
            page.wait_for_load_state('networkidle')
            
            # Check Create Waybill Button
            try:
                # Look for a button with "Create" or "New"
                create_btn = page.locator("button:has-text('Create')").first
                if create_btn.is_visible():
                    report["passed"].append("Create Waybill Button Exists")
                else:
                    report["failed"].append("Create Waybill Button Missing")
            except:
                report["failed"].append("Waybills Page Check")

            # 3. Fleet Management Test
            logger.info("Testing Fleet Management...")
            page.goto(f"{BASE_URL}/fleet")
            page.wait_for_load_state('networkidle')

            # Tab: Drivers
            # Check Add Driver Modal
            try:
                add_driver_btn = page.locator("button:has-text('Add Driver')")
                if add_driver_btn.is_visible():
                     add_driver_btn.click()
                     # Wait for modal
                     modal_title = page.locator("h3:has-text('Add Driver')")
                     try:
                         modal_title.wait_for(state="visible", timeout=2000)
                         report["passed"].append("Add Driver Modal Opens")
                         # Close modal
                         page.locator("button:has-text('Cancel')").click()
                     except:
                         report["failed"].append("Add Driver Modal Did Not Open")
                else:
                    report["failed"].append("Add Driver Button Missing")
            except Exception as e:
                 report["failed"].append(f"Drivers Tab Check: {str(e)}")

            # Switch to Vehicles Tab (Click Logic)
            try:
                page.get_by_text("Vehicles").click()
                page.wait_for_timeout(500)
                add_vehicle_btn = page.locator("button:has-text('Add Vehicle')")
                if add_vehicle_btn.is_visible():
                     add_vehicle_btn.click()
                     # Wait for modal
                     modal_title = page.locator("h3:has-text('Add Vehicle')")
                     try:
                        modal_title.wait_for(state="visible", timeout=2000)
                        report["passed"].append("Add Vehicle Modal Opens")
                        page.locator("button:has-text('Cancel')").click()
                     except:
                        report["failed"].append("Add Vehicle Modal Did Not Open")
                else:
                     report["failed"].append("Add Vehicle Button Missing")
            except Exception as e:
                report["failed"].append(f"Vehicles Tab Check: {str(e)}")

            # 4. Tracking Test
            logger.info("Testing Tracking...")
            page.goto(f"{BASE_URL}/tracking")
            page.wait_for_load_state('networkidle')
            
            # Check Sidebar
            if page.locator("text=Active Fleet List").is_visible():
                report["passed"].append("Tracking Sidebar Visible")
            else:
                report["failed"].append("Tracking Sidebar Missing")

        except Exception as e:
            logger.error(f"Global Test Exception: {e}")
            report["failed"].append(f"Global Exception: {str(e)}")
        finally:
            browser.close()

    return report

if __name__ == "__main__":
    results = run_tests()
    print("\nXXX_TEST_REPORT_START_XXX")
    print("PASSED:")
    for p in results["passed"]:
        print(f"  [x] {p}")
    print("\nFAILED:")
    for f in results["failed"]:
        print(f"  [ ] {f}")
    print("XXX_TEST_REPORT_END_XXX")
