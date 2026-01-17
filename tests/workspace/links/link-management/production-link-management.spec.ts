import { expect, test } from "../../../../../../src/core/fixtures";
import NavigationPage from "../../../../../../src/poms/navigation.page";
import { createLink } from "../../../../../../test-data/data-creation-utils";
import { Link, Production } from "../../../../../../test-data/types";


test.describe.serial("CRUD operations on Links of Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@link"] }, () => {

    // @feature link
    test("TC-1: Able to add a link to the Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@link"] },
        async ({ planningApp }) => {
             isLinkPresent = await planningApp.productionPlanningHeader.isLinkPresent(link.referenceName); //TODO: assert Link Icon as well
            expect(isLinkPresent, "Link to the Production Plan should be created.").toBeTruthy();
        });

    // @feature link
    test("TC-2: Able to edit the added link of the existing Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@link"] },
        async ({ planningApp }) => {
           expect(isLinkPresent, "Link to the Production Plan should be edited.").toBeTruthy();
        });

    // @feature link
    test("TC-3: Able to delete the edited link of the existing Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@link"] },
        async ({ planningApp }) => {
           isLinkPresent = await planningApp.productionPlanningHeader.isLinkPresent(editLink.referenceName);
            expect(isLinkPresent, "Link to the Production Plan should be deleted.").toBeFalsy();
        });

});
