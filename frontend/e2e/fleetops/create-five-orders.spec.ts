import { test, expect } from "../fixtures/test";
import { createOrdersViaApi } from "../helpers/fleetops/api-seed";
import {
  gotoFleetopsList,
  expectGlobalLoaderHidden,
} from "../helpers/fleetops/workflow";
import { waitForApiSettle } from "../helpers/network";

test.describe("FleetOps — create five orders", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test("creates 5 orders and verifies they appear in the orders list", async ({ page, request }) => {
    const created = await createOrdersViaApi(request, 5);
    expect(created).toHaveLength(5);

    await gotoFleetopsList(page, "/fleet-ops/operations/orders", "orders-list-page");
    await page.getByTestId("orders-view-table").click();
    await waitForApiSettle(page);
    await expectGlobalLoaderHidden(page);

    for (const row of created) {
      const rowLocator = page
        .getByTestId(`orders-table-row-${row.orderId}`)
        .or(page.getByTestId(`orders-table-row-${row.publicId}`));
      await expect(rowLocator).toBeVisible({ timeout: 45_000 });
    }
  });
});
