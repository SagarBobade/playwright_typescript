import { expect, test } from "../../../../../../src/core/fixtures";
import { createLink } from "../../../../../../test-data/data-creation-utils";
import { Link, Production } from "../../../../../../test-data/types";


test.serial("CRUD operations on Links of Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@link"] }, () => {
   

    // @feature link
    test.skip("TC-1: Able to open the added link of the Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@link"] },
        async ({ planningApp, context }) => {
         
    
            const newTabURL = newTab.url();
            expect.soft(newTabURL, "Expected URL is => " + link.url).toEqual(link.url);
    
            console.info("Closing the link list...");
            await planningApp.productionPlanningHeader.closeLinkList(newTab);
        }
        );
    });