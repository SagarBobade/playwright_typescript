import { expect, test } from "../../../../../../src/core/fixtures";
import { createLink } from "../../../../../../test-data/data-creation-utils";
import { Link, Production } from "../../../../../../test-data/types";


test.describe.serial("CRUD operations on Links of Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@link"] }, () => {
   

    // @feature link
    test("TC-1: Able to add a non-existing Provider's link by selecting a provider from dropdown.", { tag: ["@planningApp", "@sanity", "@workspace", "@link"] },
        async ({ planningApp }) => {
           isLinkPresent = await planningApp.productionPlanningHeader.isLinkPresent(link.referenceName);
            expect(isLinkPresent, "Link to the Production Plan should be created.").toBeTruthy();
        });

    });