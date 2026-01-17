import { expect, test } from "../../../../src/core/fixtures";
import { AssociatedOrganization, Production } from "../../../../test-data/types";
import { getIndexOfRecordInMap } from "../../../../src/core/common-actions";
import { createNewAssociatedOrganization } from "../../../../test-data/data-creation-utils";



test.skip("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedOrganization"] }, () => {
   

    // @feature associated-organization
    test("TC-1: Able to add an existing associated organization to the Production Plan", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedOrganization"] },
        async ({ planningApp }) => {
          const requiredRecord = gridData[record];

            if (record > -1) {
                expect.soft(requiredRecord.get("Organization"), "Expected Associated organization name is => " + associatedOrganization.organizationName).toEqual(associatedOrganization.organizationName);
                expect.soft(requiredRecord.get("Organization Type"), "Expected Associated organization type is => " + associatedOrganization.organizationType).toEqual(associatedOrganization.organizationType);
                expect.soft(requiredRecord.get("Organization Category"), "Expected Associated organization category is => " + associatedOrganization.organizationCategory).toEqual(associatedOrganization.organizationCategory);
            } else {
                expect.soft(1, "Production Associated organization creation Failed ").toEqual(2);
            }
        })

    // @feature associated-organization
    test("TC-2: Able to edit associated organization of the Production Plan", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedOrganization"] },
        async ({ planningApp }) => {
              const requiredRecord = gridData[record];

            if (record > -1) {
                expect.soft(requiredRecord.get("Organization"), "Expected Associated organization name is => " + editAssociatedOrganization.organizationName).toEqual(editAssociatedOrganization.organizationName);
                expect.soft(requiredRecord.get("Organization Type"), "Expected Associated organization type is => " + editAssociatedOrganization.organizationType).toEqual(editAssociatedOrganization.organizationType);
                expect.soft(requiredRecord.get("Organization Category"), "Expected Associated organization category is => " + editAssociatedOrganization.organizationCategory).toEqual(editAssociatedOrganization.organizationCategory);
            } else {
                expect.soft(1, "Production Associated organization updation Failed ").toEqual(2);
            }
        })

    // @feature associated-organization
    test("TC-3: Able to delete associated organization of the Production Plan", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedOrganization"] },
        async ({ planningApp }) => {
           const record = await getIndexOfRecordInMap(editAssociatedOrganization, gridData);

            if (record < 1) {
                expect(record, "Associated organization of a Production plan should be deleted").toBeLessThan(1);
            } else {
                expect.soft(1, "Associated organization deletion Failed").toEqual(2);
            }
        })
});
